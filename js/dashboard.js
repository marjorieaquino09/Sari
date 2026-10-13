import { db, auth } from "./firebase-config.js";
import { checkAuth, logoutUser } from "./auth.js";
import { 
  collection, 
  getDocs, 
  getDoc,
  doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUserId = null;
let trendChartChartJS = null;
let categoryChartChartJS = null;

checkAuth(async (user) => {
  currentUserId = user.uid;

  try {
    const userDoc = await getDoc(doc(db, "users", currentUserId));
    const storeNameEl = document.getElementById("topbarStoreName");
    if (userDoc.exists() && storeNameEl) {
      storeNameEl.innerText = userDoc.data().store_name || userDoc.data().name || "My Store";
    } else if (storeNameEl) {
      storeNameEl.innerText = "My Store";
    }
  } catch (err) {
    console.error("Error fetching user details:", err);
    const storeNameEl = document.getElementById("topbarStoreName");
    if (storeNameEl) storeNameEl.innerText = "My Store";
  }

  loadDashboardData();
});

async function loadDashboardData() {
  try {
    const txSnap = await getDocs(collection(db, "transactions"));

    let totalRevenue = 0;
    let totalTransactions = 0;
    let cashCount = 0;
    let creditCount = 0;
    
    // Kumpletong 12 Buwan ng taon para sa magandang tuloy-tuloy na linya
    const months12 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevenueMap = {};
    months12.forEach(m => monthlyRevenueMap[m] = 0);

    const productSalesMap = {};

    txSnap.forEach((docSnap) => {
      const data = docSnap.data();
      
      const docUserId = data.userId || data.user_id;
      if (docUserId && docUserId !== currentUserId) return;

      const amount = Number(data.total_amount || data.totalAmount || data.total || 0);
      
      totalRevenue += amount;
      totalTransactions++;

      const method = String(data.payment_method || data.paymentMethod || 'cash').toLowerCase();
      if (method === 'credit') {
        creditCount++;
      } else {
        cashCount++;
      }

      let dateObj = new Date();
      if (data.created_at) {
        if (typeof data.created_at.toDate === 'function') {
          dateObj = data.created_at.toDate();
        } else {
          dateObj = new Date(data.created_at);
        }
      } else if (data.date) {
        dateObj = new Date(data.date);
      }

      if (!isNaN(dateObj.getTime())) {
        const monthLabel = dateObj.toLocaleString('en-US', { month: 'short' });
        if (monthlyRevenueMap[monthLabel] !== undefined) {
          monthlyRevenueMap[monthLabel] += amount;
        }
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

    const statRev = document.getElementById("statTotalRevenue");
    const statTxns = document.getElementById("statTotalTxns");
    const statProf = document.getElementById("statTotalProfit");
    const statMargin = document.getElementById("statProfitMargin");
    const statAvg = document.getElementById("statAvgSale");
    const cashTxt = document.getElementById("cashPctText");
    const creditTxt = document.getElementById("creditPctText");

    if (statRev) statRev.innerText = `₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (statTxns) statTxns.innerText = `${totalTransactions} total transactions`;
    if (statProf) statProf.innerText = `₱${estProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (statMargin) statMargin.innerText = totalRevenue > 0 ? "20%" : "0%";
    if (statAvg) statAvg.innerText = `₱${avgSale.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (cashTxt) cashTxt.innerText = `${cashPct.toFixed(1)}%`;
    if (creditTxt) creditTxt.innerText = `${creditPct.toFixed(1)}%`;

    renderCleanLineChart(months12, monthlyRevenueMap);
    loadCleanCategoryDonut();
    renderTopProducts(productSalesMap);

  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// GRAPH 1: PROPESYONAL NA 12-MONTH AREA TREND CHART
function renderCleanLineChart(monthsList, monthlyRevenueMap) {
  const canvas = document.getElementById("trendChartCanvas");
  if (!canvas) return;

  const revData = monthsList.map(m => monthlyRevenueMap[m] || 0);
  const profitData = revData.map(val => val * 0.20);

  if (trendChartChartJS) {
    trendChartChartJS.destroy();
  }

  const ctx = canvas.getContext("2d");

  // Gradient Fills
  const revGrad = ctx.createLinearGradient(0, 0, 0, 250);
  revGrad.addColorStop(0, "rgba(74, 222, 128, 0.4)");
  revGrad.addColorStop(1, "rgba(74, 222, 128, 0.0)");

  const profGrad = ctx.createLinearGradient(0, 0, 0, 250);
  profGrad.addColorStop(0, "rgba(253, 224, 71, 0.4)");
  profGrad.addColorStop(1, "rgba(253, 224, 71, 0.0)");

  trendChartChartJS = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthsList,
      datasets: [
        {
          label: 'Revenue (Benta)',
          data: revData,
          borderColor: '#4ade80',
          backgroundColor: revGrad,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#4ade80'
        },
        {
          label: 'Profit (Tubo)',
          data: profitData,
          borderColor: '#fde047',
          backgroundColor: profGrad,
          borderWidth: 2,
          borderDash: [5, 5],
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#fde047'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#ffffff', font: { family: 'sans-serif', weight: 'bold' } }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ₱${context.raw.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#ffffff', font: { weight: 'bold' } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: {
            color: '#ffffff',
            callback: function(val) { return '₱' + val; }
          }
        }
      }
    }
  });
}

// GRAPH 2: MALINIS NA TOP 5 CATEGORIES DONUT CHART
async function loadCleanCategoryDonut() {
  const canvas = document.getElementById("categoryChartCanvas");
  if (!canvas) return;

  try {
    const prodQuery = collection(db, "products");
    const prodSnap = await getDocs(prodQuery);

    const catCounts = {};
    let totalProducts = 0;

    prodSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const docUserId = data.userId || data.user_id;
      if (docUserId && docUserId !== currentUserId) return;

      const cat = data.category || 'Others';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
      totalProducts++;
    });

    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    
    // Kunin lang ang Top 4 + ipagsama ang iba sa "Others"
    const topLabels = [];
    const topData = [];
    let othersSum = 0;

    sortedCats.forEach(([catName, count], idx) => {
      if (idx < 4) {
        topLabels.push(catName);
        topData.push(count);
      } else {
        othersSum += count;
      }
    });

    if (othersSum > 0) {
      topLabels.push("Others");
      topData.push(othersSum);
    }

    if (topLabels.length === 0) {
      topLabels.push("No Items");
      topData.push(1);
    }

    if (categoryChartChartJS) {
      categoryChartChartJS.destroy();
    }

    const ctx = canvas.getContext("2d");

    categoryChartChartJS = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: topLabels,
        datasets: [{
          data: topData,
          backgroundColor: ['#4ade80', '#fde047', '#38bdf8', '#a78bfa', '#f43f5e'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#ffffff', font: { size: 12, weight: 'bold' }, padding: 12 }
          },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = Math.round((ctx.raw / total) * 100);
                return `${ctx.label}: ${pct}% (${ctx.raw} items)`;
              }
            }
          }
        },
        cutout: '65%'
      }
    });

  } catch (err) {
    console.error("Error loading category donut:", err);
  }
}

function renderTopProducts(productSalesMap) {
  const tbody = document.getElementById("topProductsTableBody");
  if (!tbody) return;

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

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutUser);
}