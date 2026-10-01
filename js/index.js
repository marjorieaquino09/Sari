
import { db, auth } from "./firebase-config.js";
import { checkAuth, logoutUser } from "./auth.js";
import { checkAndSeedDefaultProducts } from "./seed-products.js";
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

  if (typeof checkAndSeedDefaultProducts === "function") {
    await checkAndSeedDefaultProducts(currentUserId);
  }

  
  try {
    const userDoc = await getDoc(doc(db, "users", currentUserId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const storeName = data.store_name || "My Store";
      const fullName = data.full_name || "Owner";

      document.getElementById("topbarStoreName").innerText = storeName;
      document.getElementById("greetingStoreName").innerText = storeName;
      document.getElementById("greetingFullName").innerText = fullName;

      const topbarAvatar = document.getElementById("topbarAvatarContainer");
      if (data.profile_image) {
        topbarAvatar.innerHTML = `<img src="${data.profile_image}" class="topbar-avatar" style="object-fit:cover;" alt="Avatar">`;
      } else {
        topbarAvatar.innerText = fullName.charAt(0).toUpperCase();
      }
    }
  } catch (err) {
    console.error("Error loading user profile:", err);
  }

  loadHomeData();
});


async function loadHomeData() {
  try {
    // A. Fetch Products (Capital, Low Stock Count, Low Stock List)
    const prodQuery = query(collection(db, "products"), where("userId", "==", currentUserId));
    const prodSnap = await getDocs(prodQuery);

    let totalCapital = 0;
    let lowStockCount = 0;
    const lowStockList = [];

    prodSnap.forEach((docSnap) => {
      const p = docSnap.data();
      const price = Number(p.price || 0);
      const stock = Number(p.stock || 0);

      totalCapital += (price * stock);

      if (stock <= 5) {
        lowStockCount++;
        lowStockList.push({ name: p.name, stock: stock });
      }
    });

    document.getElementById("homeCapital").innerText = `₱${totalCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById("homeLowStockCount").innerText = lowStockCount;

   
    const lowStockContainer = document.getElementById("lowStockAlertsContainer");
    if (lowStockList.length === 0) {
      lowStockContainer.innerHTML = `<div class="list-row"><span class="item-name" style="color:#7c8b82;">All items well stocked</span></div>`;
    } else {
      lowStockContainer.innerHTML = lowStockList.slice(0, 4).map(item => `
        <div class="list-row">
          <span class="item-name">${item.name}</span>
          <span class="item-value">${item.stock} left</span>
        </div>
      `).join('');
    }

    
    const custQuery = query(collection(db, "customers"), where("userId", "==", currentUserId));
    const custSnap = await getDocs(custQuery);

    let creditCustomersCount = 0;
    let totalCreditOwed = 0;

    custSnap.forEach((docSnap) => {
      const c = docSnap.data();
      const credit = Number(c.credit || 0);
      if (credit > 0) {
        creditCustomersCount++;
        totalCreditOwed += credit;
      }
    });

    document.getElementById("homeCreditCustomers").innerText = creditCustomersCount;
    document.getElementById("homeCreditBalance").innerText = `₱${totalCreditOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById("homeCreditTxnCount").innerText = `${creditCustomersCount} customers`;

    
    const txQuery = query(collection(db, "transactions"), where("userId", "==", currentUserId));
    const txSnap = await getDocs(txQuery);

    const todayStr = new Date().toDateString();
    let salesToday = 0;
    let txnCountToday = 0;
    let totalNetProfit = 0;

    const allTxns = [];
    const topSalesMap = {};
    const weeklyDays = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    txSnap.forEach((docSnap) => {
      const tx = docSnap.data();
      const amt = Number(tx.total_amount || 0);
      allTxns.push(tx);

      totalNetProfit += (amt * 0.20); 

      if (tx.created_at) {
        const txDate = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
        
        
        if (txDate.toDateString() === todayStr) {
          salesToday += amt;
          txnCountToday++;
        }

       
        const dayName = txDate.toLocaleDateString('en-US', { weekday: 'short' });
        if (weeklyDays[dayName] !== undefined) {
          weeklyDays[dayName] += amt;
        }
      }

      
      if (Array.isArray(tx.items)) {
        tx.items.forEach(item => {
          if (item.name) {
            topSalesMap[item.name] = (topSalesMap[item.name] || 0) + Number(item.qty || 1);
          }
        });
      }
    });

    const profitToday = salesToday * 0.20;

    document.getElementById("homeSalesToday").innerText = `₱${salesToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById("homeSalesCard").innerText = `₱${salesToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById("homeProfitToday").innerText = `₱${profitToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById("homeNetProfit").innerText = `₱${totalNetProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById("homeTxnCountToday").innerText = `${txnCountToday} transactions`;

   
    const recentTxnContainer = document.getElementById("recentTransactionsContainer");
    if (allTxns.length === 0) {
      recentTxnContainer.innerHTML = `<div class="transaction-row"><span class="transaction-meta" style="color:#7c8b82;">No recent transactions</span></div>`;
    } else {
      recentTxnContainer.innerHTML = allTxns.slice(-3).reverse().map(tx => `
        <div class="transaction-row">
          <div class="transaction-left">
            <span class="transaction-icon"></span>
            <span class="transaction-meta">${tx.customer_name || 'Walk-in'} — ${tx.payment_method || 'Cash'}</span>
          </div>
          <span class="transaction-amount">₱${Number(tx.total_amount || 0).toFixed(2)}</span>
        </div>
      `).join('');
    }

   
    const topSellingContainer = document.getElementById("topSellingContainer");
    const topList = Object.entries(topSalesMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

    if (topList.length === 0) {
      topSellingContainer.innerHTML = `<div class="list-row"><span class="item-name" style="color:#7c8b82;">No sales recorded yet</span></div>`;
    } else {
      topSellingContainer.innerHTML = topList.map(([name, qty]) => `
        <div class="list-row">
          <span class="item-name">${name}</span>
          <span class="item-value">${qty} sold</span>
        </div>
      `).join('');
    }

    
    renderWeeklyChart(weeklyDays);

  } catch (error) {
    console.error("Error loading home dashboard:", error);
  }
}


function renderWeeklyChart(weeklyDays) {
  const container = document.getElementById("weeklyChartContainer");
  const maxVal = Math.max(...Object.values(weeklyDays), 1);

  container.innerHTML = Object.entries(weeklyDays).map(([day, val]) => {
    let heightPct = (val / maxVal) * 100;
    if (heightPct > 0 && heightPct < 20) heightPct = 20;
    if (heightPct === 0) heightPct = 8;
    const profitPct = Math.max(heightPct * 0.20, 6);

    return `
      <div class="bar-day">
        <div class="bar" style="height: ${heightPct}%;" title="Sales: ₱${val.toFixed(2)}"></div>
        <div class="bar profit" style="height: ${profitPct}%;" title="Profit: ₱${(val * 0.20).toFixed(2)}"></div>
        <span class="bar-day-label">${day}</span>
      </div>
    `;
  }).join('');
}


document.getElementById("logoutBtn").addEventListener("click", logoutUser);