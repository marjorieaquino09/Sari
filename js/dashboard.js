
import { db, auth } from "./firebase-config.js";
import { checkAuth, logoutUser } from "./auth.js";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUserId = null;


checkAuth(async (user) => {
  currentUserId = user.uid;

  try {
    const userDoc = await getDoc(doc(db, "users", currentUserId));
    if (userDoc.exists()) {
      document.getElementById("topbarStoreName").innerText = userDoc.data().store_name || "My Store";
    }
  } catch (err) {
    console.error("Error fetching user details:", err);
  }

  loadDashboardData();
});


async function loadDashboardData() {
  try {
    
    const txQuery = query(collection(db, "transactions"), where("userId", "==", currentUserId));
    const txSnap = await getDocs(txQuery);

    let totalRevenue = 0;
    let totalTransactions = 0;
    let cashCount = 0;
    let creditCount = 0;
    const monthlyRevenue = {};
    const productSalesMap = {};

    txSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const amount = Number(data.total_amount || 0);
      
      totalRevenue += amount;
      totalTransactions++;

      
      const method = String(data.payment_method || 'cash').toLowerCase();
      if (method === 'credit') {
        creditCount++;
      } else {
        cashCount++;
      }

      
      if (data.created_at) {
        const date = data.created_at.toDate ? data.created_at.toDate() : new Date(data.created_at);
        const monthLabel = date.toLocaleString('en-US', { month: 'short' });
        monthlyRevenue[monthLabel] = (monthlyRevenue[monthLabel] || 0) + amount;
      }

      
      if (Array.isArray(data.items)) {
        data.items.forEach(item => {
          if (item.name) {
            if (!productSalesMap[item.name]) {
              productSalesMap[item.name] = { qty: 0, revenue: 0 };
            }
            productSalesMap[item.name].qty += Number(item.qty || 1);
            productSalesMap[item.name].revenue += (Number(item.price || 0) * Number(item.qty || 1));
          }
        });
      }
    });

   
    const estProfit = totalRevenue * 0.20;
    const avgSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const cashPct = totalTransactions > 0 ? (cashCount / totalTransactions) * 100 : 0;
    const creditPct = totalTransactions > 0 ? (creditCount / totalTransactions) * 100 : 0;

    document.getElementById("statTotalRevenue").innerText = `₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById("statTotalTxns").innerText = `${totalTransactions} total transactions`;
    document.getElementById("statTotalProfit").innerText = `₱${estProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById("statProfitMargin").innerText = totalRevenue > 0 ? "20%" : "0%";
    document.getElementById("statAvgSale").innerText = `₱${avgSale.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById("cashPctText").innerText = `${cashPct.toFixed(1)}%`;
    document.getElementById("creditPctText").innerText = `${creditPct.toFixed(1)}%`;

    
    renderChart(monthlyRevenue);

    loadCategoryStats();
   
    renderTopProducts(productSalesMap);

  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}


function renderChart(monthlyRevenue) {
  const chartContainer = document.getElementById("chartContainer");
  const monthKeys = Object.keys(monthlyRevenue);

  if (monthKeys.length === 0) {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
    monthlyRevenue[currentMonth] = 0;
  }

  const maxMonthlyRev = Math.max(...Object.values(monthlyRevenue), 1);

  chartContainer.innerHTML = Object.entries(monthlyRevenue).map(([mLabel, mRev]) => {
    let revHeight = (mRev / maxMonthlyRev) * 100;
    if (revHeight > 0 && revHeight < 25) revHeight = 25;
    if (revHeight === 0) revHeight = 8;
    const profHeight = Math.max(revHeight * 0.2, 6);

    return `
      <div class="custom-bar-group">
        <div class="custom-bar-value">₱${Math.round(mRev).toLocaleString()}</div>
        <div class="custom-bars-wrapper">
          <div class="custom-bar revenue" style="height: ${revHeight}%;" title="Revenue: ₱${mRev.toFixed(2)}"></div>
          <div class="custom-bar profit" style="height: ${profHeight}%;" title="Profit: ₱${(mRev * 0.2).toFixed(2)}"></div>
        </div>
        <span class="custom-bar-label">${mLabel}</span>
      </div>
    `;
  }).join('');
}


async function loadCategoryStats() {
  try {
    const prodQuery = query(collection(db, "products"), where("userId", "==", currentUserId));
    const prodSnap = await getDocs(prodQuery);

    const catCounts = {};
    let totalProds = 0;

    prodSnap.forEach((docSnap) => {
      const cat = docSnap.data().category || 'Others';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
      totalProds++;
    });

    const bevPct = totalProds > 0 ? Math.round(((catCounts['Beverage'] || catCounts['Beverages'] || 0) / totalProds) * 100) : 0;
    const snacksPct = totalProds > 0 ? Math.round(((catCounts['Chips'] || catCounts['Biscuits'] || 0) / totalProds) * 100) : 0;
    const housePct = totalProds > 0 ? Math.round(((catCounts['Household'] || 0) / totalProds) * 100) : 0;
    let otherPct = totalProds > 0 ? (100 - (bevPct + snacksPct + housePct)) : 0;
    if (otherPct < 0) otherPct = 0;

    document.getElementById("bevPctText").innerText = `${bevPct}%`;
    document.getElementById("bevBarFill").style.width = `${bevPct}%`;

    document.getElementById("snacksPctText").innerText = `${snacksPct}%`;
    document.getElementById("snacksBarFill").style.width = `${snacksPct}%`;

    document.getElementById("housePctText").innerText = `${housePct}%`;
    document.getElementById("houseBarFill").style.width = `${housePct}%`;

    document.getElementById("otherPctText").innerText = `${otherPct}%`;
    document.getElementById("otherBarFill").style.width = `${otherPct}%`;

  } catch (err) {
    console.error("Error loading category stats:", err);
  }
}


function renderTopProducts(productSalesMap) {
  const tbody = document.getElementById("topProductsTableBody");
  const sorted = Object.entries(productSalesMap).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);

  if (sorted.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; color: #9aa9a0; padding: 30px;">No sales recorded yet.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = sorted.map(([name, data]) => `
    <tr>
      <td>${name}</td>
      <td>${data.qty}</td>
      <td>₱${data.revenue.toFixed(2)}</td>
    </tr>
  `).join('');
}

document.getElementById("logoutBtn").addEventListener("click", logoutUser);