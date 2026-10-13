import { db, auth } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let currentUserId = null;

let productsData = [];
let transactionsData = [];
let creditsData = [];
let directNotificationsData = [];

const container = document.getElementById("notificationsContainer");
const summary = document.getElementById("notificationSummary");
const storeName = document.getElementById("topbarStoreName");
const avatar = document.getElementById("topbarAvatarContainer") || document.getElementById("avatarContainer");

function showMessage(message, type = "normal") {
  if (!container) return;

  if (type === "error") {
    container.innerHTML = `
      <div class="notif-error">
        <i class="fa-solid fa-circle-exclamation" style="font-size:28px;margin-bottom:10px;"></i>
        <br>
        ${escapeHtml(message)}
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="notif-empty">
      <i class="fa-solid fa-bell-slash notif-empty-icon"></i>
      <br>
      ${escapeHtml(message)}
    </div>
  `;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showMessage("Please log in first.", "error");
    if (storeName) {
      storeName.innerText = "Not Logged In";
    }
    return;
  }

  currentUserId = user.uid;

  try {
    await loadUserProfile();
    await loadAllNotifications();
    startRealtimeListeners();
  } catch (error) {
    console.error("Notification system error:", error);
    showMessage("Unable to load notifications. Check the browser console.", "error");
  }
});

async function loadUserProfile() {
  try {
    const savedStoreName = localStorage.getItem("customStoreName");
    const savedImage = localStorage.getItem("userProfileImage");

    if (storeName) {
      storeName.innerText = savedStoreName || "My Store";
    }

    if (avatar) {
      if (savedImage) {
        avatar.innerHTML = `<img src="${escapeHtml(savedImage)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="Avatar">`;
      } else {
        avatar.innerText = (savedStoreName || "S").charAt(0).toUpperCase();
      }
    }

    const userRef = doc(db, "users", currentUserId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const nameToDisplay = savedStoreName || data.store_name || data.full_name || "My Store";
      
      if (storeName) storeName.innerText = nameToDisplay;
      
      if (avatar && !savedImage) {
        if (data.profile_image) {
          avatar.innerHTML = `<img src="${escapeHtml(data.profile_image)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="Avatar">`;
        } else {
          avatar.innerText = nameToDisplay.charAt(0).toUpperCase();
        }
      }
    }
  } catch (error) {
    console.error("Profile error:", error);
  }
}

async function loadAllNotifications() {
  const productsQuery = query(collection(db, "products"), where("userId", "==", currentUserId));
  const transactionsQuery = query(collection(db, "transactions"), where("userId", "==", currentUserId));
  const creditsQuery = query(collection(db, "credits"), where("userId", "==", currentUserId));
  const notifsQuery = query(collection(db, "notifications"), where("userId", "==", currentUserId));

  const [productsSnapshot, transactionsSnapshot, creditsSnapshot, notifsSnapshot] = await Promise.all([
    getDocs(productsQuery),
    getDocs(transactionsQuery),
    getDocs(creditsQuery),
    getDocs(notifsQuery)
  ]);

  productsData = [];
  productsSnapshot.forEach(docSnap => productsData.push({ id: docSnap.id, ...docSnap.data() }));

  transactionsData = [];
  transactionsSnapshot.forEach(docSnap => transactionsData.push({ id: docSnap.id, ...docSnap.data() }));

  creditsData = [];
  creditsSnapshot.forEach(docSnap => creditsData.push({ id: docSnap.id, ...docSnap.data() }));

  directNotificationsData = [];
  const unreadNotifIds = [];

  notifsSnapshot.forEach(docSnap => {
    const data = docSnap.data();
    directNotificationsData.push({ id: docSnap.id, ...data });
    if (!data.isRead) {
      unreadNotifIds.push(docSnap.id);
    }
  });

  renderAll();

  if (unreadNotifIds.length > 0) {
    await markNotificationsAsRead(unreadNotifIds);
  } else {
    clearNotifBadge();
  }
}

function startRealtimeListeners() {
  const productsQuery = query(collection(db, "products"), where("userId", "==", currentUserId));
  const transactionsQuery = query(collection(db, "transactions"), where("userId", "==", currentUserId));
  const creditsQuery = query(collection(db, "credits"), where("userId", "==", currentUserId));
  const notifsQuery = query(collection(db, "notifications"), where("userId", "==", currentUserId));

  onSnapshot(productsQuery, (snapshot) => {
    productsData = [];
    snapshot.forEach(docSnap => productsData.push({ id: docSnap.id, ...docSnap.data() }));
    renderAll();
  });

  onSnapshot(transactionsQuery, (snapshot) => {
    transactionsData = [];
    snapshot.forEach(docSnap => transactionsData.push({ id: docSnap.id, ...docSnap.data() }));
    renderAll();
  });

  onSnapshot(creditsQuery, (snapshot) => {
    creditsData = [];
    snapshot.forEach(docSnap => creditsData.push({ id: docSnap.id, ...docSnap.data() }));
    renderAll();
  });

  onSnapshot(notifsQuery, (snapshot) => {
    directNotificationsData = [];
    const unreadIds = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      directNotificationsData.push({ id: docSnap.id, ...data });
      if (!data.isRead) {
        unreadIds.push(docSnap.id);
      }
    });

    renderAll();

    if (unreadIds.length > 0) {
      markNotificationsAsRead(unreadIds);
    } else {
      clearNotifBadge();
    }
  });
}

async function markNotificationsAsRead(docIds) {
  try {
    const batch = writeBatch(db);
    docIds.forEach((id) => {
      const docRef = doc(db, "notifications", id);
      batch.update(docRef, { isRead: true });
    });
    await batch.commit();
    clearNotifBadge();
  } catch (err) {
    console.error("Error updating notification read status:", err);
  }
}

function clearNotifBadge() {
  const badgeEl = document.getElementById("notifBadge");
  if (badgeEl) {
    badgeEl.innerText = "0";
    badgeEl.style.display = "none";
  }
}

function renderAll() {
  const notifications = buildNotifications();
  updateSummary(notifications);
  renderNotifications(notifications);
}

function buildNotifications() {
  const notifications = [];

  directNotificationsData.forEach((notif) => {
    let iconClass = "fa-bell";
    let colorHex = "#60a5fa";

    if (notif.category === "danger" || (notif.title && notif.title.includes("Out of Stock"))) {
      iconClass = "fa-circle-xmark";
      colorHex = "#ef4444";
    } else if (notif.category === "warning" || (notif.title && notif.title.includes("Low Stock"))) {
      iconClass = "fa-triangle-exclamation";
      colorHex = "#f59e0b";
    } else {
      iconClass = "fa-box";
      colorHex = "#22c55e";
    }

    notifications.push({
      type: "inventory",
      title: notif.title || "Inventory Alert",
      message: notif.message || notif.description || "",
      icon: iconClass,
      color: colorHex,
      time: getTime(notif.created_at || notif.createdAt)
    });
  });

  productsData.forEach((product) => {
    const stock = Number(product.stock || 0);
    const prodTime = getTime(product.updatedAt || product.updated_at || product.createdAt || product.created_at);

    const isAlreadyInDirect = directNotificationsData.some(d => 
      (d.message && d.message.includes(product.name)) || (d.description && d.description.includes(product.name))
    );

    if (!isAlreadyInDirect) {
      if (stock === 0) {
        notifications.push({
          type: "inventory",
          title: "Out of Stock",
          message: `"${product.name || "Product"}" is out of stock.`,
          icon: "fa-circle-xmark",
          color: "#ef4444",
          time: prodTime
        });
      } else if (stock <= 5) {
        notifications.push({
          type: "inventory",
          title: "Low Stock",
          message: `"${product.name || "Product"}" has only ${stock} left.`,
          icon: "fa-triangle-exclamation",
          color: "#f59e0b",
          time: prodTime
        });
      }
    }
  });

  transactionsData.forEach((transaction) => {
    const amount = Number(transaction.totalAmount || transaction.total_amount || transaction.amount || 0);
    const customer = transaction.customerName || transaction.customer_name || "Walk-in Customer";
    const method = transaction.paymentMethod || transaction.payment_method || "Cash";

    notifications.push({
      type: "transaction",
      title: "New Transaction",
      message: `${customer} — ${method} — ₱${amount.toFixed(2)}`,
      icon: "fa-receipt",
      color: "#60a5fa",
      time: getTime(transaction.createdAt || transaction.created_at)
    });
  });

  creditsData.forEach((credit) => {
    const amount = Number(credit.amount || credit.totalAmount || credit.total_amount || 0);
    const customer = credit.customerName || credit.customer_name || "Customer";
    const paid = credit.isPaid === true;

    notifications.push({
      type: "credit",
      title: paid ? "Credit Paid" : "Unpaid Credit",
      message: paid ? `${customer} paid ₱${amount.toFixed(2)}.` : `${customer} owes ₱${amount.toFixed(2)}.`,
      icon: paid ? "fa-circle-check" : "fa-money-bill-transfer",
      color: paid ? "#22c55e" : "#f97316",
      time: getTime(credit.updatedAt || credit.updated_at || credit.createdAt || credit.created_at || credit.date)
    });
  });

  notifications.sort((a, b) => b.time - a.time);

  return notifications;
}

function updateSummary(notifications) {
  if (!summary) return;

  const inventory = notifications.filter(item => item.type === "inventory").length;
  const transactions = notifications.filter(item => item.type === "transaction").length;
  const credits = notifications.filter(item => item.type === "credit").length;

  if (inventory === 0 && transactions === 0 && credits === 0) {
    summary.innerHTML = "";
    return;
  }

  summary.innerHTML = `
    ${inventory > 0 ? `<span class="notif-summary-item notif-summary-inventory">Inventory ${inventory}</span>` : ""}
    ${transactions > 0 ? `<span class="notif-summary-item notif-summary-transactions">Transactions ${transactions}</span>` : ""}
    ${credits > 0 ? `<span class="notif-summary-item notif-summary-credit">Credit ${credits}</span>` : ""}
  `;
}

function renderNotifications(notifications) {
  if (!container) return;

  if (notifications.length === 0) {
    showMessage("No notifications yet.");
    return;
  }

  container.innerHTML = `
    <div class="notif-section-title">
      <strong>Recent Notifications</strong>
      <span class="notif-count">${notifications.length}</span>
    </div>

    ${notifications.map((item) => `
      <div class="notif-item">
        <div class="notif-item-icon" style="color:${item.color}; background:${item.color}20;">
          <i class="fa-solid ${item.icon}"></i>
        </div>
        <div class="notif-item-content">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.message)}</p>
        </div>
        <div class="notif-item-time">
          ${formatTime(item.time)}
        </div>
      </div>
    `).join("")}
  `;
}

function getTime(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
  if (typeof value === "object" && value.seconds) return value.seconds * 1000;
  return 0;
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}