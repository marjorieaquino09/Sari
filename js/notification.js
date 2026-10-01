import { db, auth } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let currentUserId = null;

let productsData = [];
let transactionsData = [];
let creditsData = [];

const container = document.getElementById("notificationsContainer");
const summary = document.getElementById("notificationSummary");
const storeName = document.getElementById("topbarStoreName");
const avatar = document.getElementById("topbarAvatarContainer");

function showMessage(message, type = "normal") {
  if (!container) return;

  if (type === "error") {
    container.innerHTML = `
      <div class="notif-error">
        <i class="fa-solid fa-circle-exclamation"
           style="font-size:28px;margin-bottom:10px;"></i>
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

  console.log("SARI Notifications User:", currentUserId);

  try {
    await loadUserProfile();
    await loadAllNotifications();
    startRealtimeListeners();
  } catch (error) {
    console.error("Notification system error:", error);

    showMessage(
      "Unable to load notifications. Check the browser console.",
      "error"
    );
  }
});

async function loadUserProfile() {
  try {
    const userRef = doc(db, "users", currentUserId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      if (storeName) {
        storeName.innerText = "My Store";
      }

      return;
    }

    const data = userSnap.data();

    if (storeName) {
      storeName.innerText =
        data.store_name ||
        data.full_name ||
        "My Store";
    }

    if (avatar) {
      if (data.profile_image) {
        avatar.innerHTML = `
          <img
            src="${escapeHtml(data.profile_image)}"
            class="topbar-avatar"
            style="object-fit:cover;"
            alt="Avatar"
          >
        `;
      } else {
        avatar.innerText =
          (data.full_name || "U")
            .charAt(0)
            .toUpperCase();
      }
    }
  } catch (error) {
    console.error("Profile error:", error);

    if (storeName) {
      storeName.innerText = "My Store";
    }
  }
}

async function loadAllNotifications() {
  const productsQuery = query(
    collection(db, "products"),
    where("userId", "==", currentUserId)
  );

  const transactionsQuery = query(
    collection(db, "transactions"),
    where("userId", "==", currentUserId)
  );

  const creditsQuery = query(
    collection(db, "credits"),
    where("userId", "==", currentUserId)
  );

  const [
    productsSnapshot,
    transactionsSnapshot,
    creditsSnapshot
  ] = await Promise.all([
    getDocs(productsQuery),
    getDocs(transactionsQuery),
    getDocs(creditsQuery)
  ]);

  productsData = [];

  productsSnapshot.forEach((docSnap) => {
    productsData.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  transactionsData = [];

  transactionsSnapshot.forEach((docSnap) => {
    transactionsData.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  creditsData = [];

  creditsSnapshot.forEach((docSnap) => {
    creditsData.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  console.log("Products:", productsData);
  console.log("Transactions:", transactionsData);
  console.log("Credits:", creditsData);

  renderAll();
}

function startRealtimeListeners() {
  const productsQuery = query(
    collection(db, "products"),
    where("userId", "==", currentUserId)
  );

  const transactionsQuery = query(
    collection(db, "transactions"),
    where("userId", "==", currentUserId)
  );

  const creditsQuery = query(
    collection(db, "credits"),
    where("userId", "==", currentUserId)
  );

  onSnapshot(
    productsQuery,
    (snapshot) => {
      productsData = [];

      snapshot.forEach((docSnap) => {
        productsData.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      renderAll();
    },
    (error) => {
      console.error("Products realtime error:", error);
    }
  );

  onSnapshot(
    transactionsQuery,
    (snapshot) => {
      transactionsData = [];

      snapshot.forEach((docSnap) => {
        transactionsData.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      renderAll();
    },
    (error) => {
      console.error("Transactions realtime error:", error);
    }
  );

  onSnapshot(
    creditsQuery,
    (snapshot) => {
      creditsData = [];

      snapshot.forEach((docSnap) => {
        creditsData.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      renderAll();
    },
    (error) => {
      console.error("Credits realtime error:", error);
    }
  );
}

function renderAll() {
  const notifications = buildNotifications();

  updateSummary(notifications);
  renderNotifications(notifications);
}

function buildNotifications() {
  const notifications = [];

  productsData.forEach((product) => {
    const stock = Number(product.stock || 0);

    if (stock === 0) {
      notifications.push({
        type: "inventory",
        title: "Out of Stock",
        message:
          `"${product.name || "Product"}" is out of stock.`,
        icon: "fa-circle-xmark",
        color: "#ef4444",
        time: getTime(
          product.updatedAt ||
          product.updated_at ||
          product.createdAt ||
          product.created_at
        )
      });
    } else if (stock <= 5) {
      notifications.push({
        type: "inventory",
        title: "Low Stock",
        message:
          `"${product.name || "Product"}" has only ${stock} left.`,
        icon: "fa-triangle-exclamation",
        color: "#f59e0b",
        time: getTime(
          product.updatedAt ||
          product.updated_at ||
          product.createdAt ||
          product.created_at
        )
      });
    }
  });

  transactionsData.forEach((transaction) => {
    const amount = Number(
      transaction.totalAmount ||
      transaction.total_amount ||
      transaction.amount ||
      0
    );

    const customer =
      transaction.customerName ||
      transaction.customer_name ||
      "Walk-in Customer";

    const method =
      transaction.paymentMethod ||
      transaction.payment_method ||
      "Cash";

    notifications.push({
      type: "transaction",
      title: "New Transaction",
      message:
        `${customer} — ${method} — ₱${amount.toFixed(2)}`,
      icon: "fa-receipt",
      color: "#60a5fa",
      time: getTime(
        transaction.createdAt ||
        transaction.created_at
      )
    });
  });

  creditsData.forEach((credit) => {
    const amount = Number(
      credit.amount ||
      credit.totalAmount ||
      credit.total_amount ||
      0
    );

    const customer =
      credit.customerName ||
      credit.customer_name ||
      "Customer";

    const paid =
      credit.isPaid === true;

    notifications.push({
      type: "credit",
      title: paid
        ? "Credit Paid"
        : "Unpaid Credit",
      message: paid
        ? `${customer} paid ₱${amount.toFixed(2)}.`
        : `${customer} owes ₱${amount.toFixed(2)}.`,
      icon: paid
        ? "fa-circle-check"
        : "fa-money-bill-transfer",
      color: paid
        ? "#22c55e"
        : "#f97316",
      time: getTime(
        credit.updatedAt ||
        credit.updated_at ||
        credit.createdAt ||
        credit.created_at ||
        credit.date
      )
    });
  });

  notifications.sort(
    (a, b) => b.time - a.time
  );

  return notifications;
}

function updateSummary(notifications) {
  if (!summary) return;

  const inventory = notifications.filter(
    item => item.type === "inventory"
  ).length;

  const transactions = notifications.filter(
    item => item.type === "transaction"
  ).length;

  const credits = notifications.filter(
    item => item.type === "credit"
  ).length;

  if (
    inventory === 0 &&
    transactions === 0 &&
    credits === 0
  ) {
    summary.innerHTML = "";
    return;
  }

  summary.innerHTML = `
    ${
      inventory > 0
        ? `
          <span class="notif-summary-item notif-summary-inventory">
            Inventory ${inventory}
          </span>
        `
        : ""
    }

    ${
      transactions > 0
        ? `
          <span class="notif-summary-item notif-summary-transactions">
            Transactions ${transactions}
          </span>
        `
        : ""
    }

    ${
      credits > 0
        ? `
          <span class="notif-summary-item notif-summary-credit">
            Credit ${credits}
          </span>
        `
        : ""
    }
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
      <span class="notif-count">
        ${notifications.length}
      </span>
    </div>

    ${notifications.map((item) => `
      <div class="notif-item">

        <div
          class="notif-item-icon"
          style="
            color:${item.color};
            background:${item.color}20;
          "
        >
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

  if (
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value.toDate === "function"
  ) {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const time =
      new Date(value).getTime();

    return Number.isNaN(time)
      ? 0
      : time;
  }

  if (
    typeof value === "object" &&
    value.seconds
  ) {
    return value.seconds * 1000;
  }

  return 0;
}

function formatTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

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