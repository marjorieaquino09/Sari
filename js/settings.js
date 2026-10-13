import { db, auth } from "./firebase-config.js";
import { checkAuth, logoutUser } from "./auth.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let currentUserId = null;
let userEmail = "";

checkAuth(async (user) => {
  currentUserId = user.uid;
  userEmail = user.email || "";

  try {
    const userDocRef = doc(db, "users", currentUserId);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();

      // Ang avatar at pangalan ng store sa topbar ay hinahawakan na ng topbar.js

      if (data.low_stock_threshold !== undefined) {
        document.getElementById("low_stock_threshold").value = data.low_stock_threshold;
      }
      if (data.push_notifications !== undefined) {
        document.getElementById("pushNotifToggle").checked = data.push_notifications;
      }
      if (data.low_stock_alerts !== undefined) {
        document.getElementById("lowStockAlertToggle").checked = data.low_stock_alerts;
      }
    }
  } catch (err) {
    console.error("Error loading settings:", err);
  }
});

document.getElementById("settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("saveThresholdBtn");
  const thresholdVal = Number(document.getElementById("low_stock_threshold").value);

  try {
    btn.disabled = true;
    btn.innerText = "Saving...";

    const userRef = doc(db, "users", currentUserId);
    await updateDoc(userRef, {
      low_stock_threshold: thresholdVal,
      updated_at: serverTimestamp()
    });

    btn.disabled = false;
    btn.innerText = "Save";

    alert("Settings saved successfully!");
  } catch (err) {
    btn.disabled = false;
    btn.innerText = "Save";
    console.error("Error updating threshold:", err);
    alert("Failed to save settings: " + err.message);
  }
});

async function saveTogglePreference(key, value) {
  try {
    const userRef = doc(db, "users", currentUserId);
    await updateDoc(userRef, {
      [key]: value,
      updated_at: serverTimestamp()
    });
  } catch (err) {
    console.error(`Error saving ${key}:`, err);
  }
}

document.getElementById("pushNotifToggle").addEventListener("change", (e) => {
  saveTogglePreference("push_notifications", e.target.checked);
});

document.getElementById("lowStockAlertToggle").addEventListener("change", (e) => {
  saveTogglePreference("low_stock_alerts", e.target.checked);
});

document.getElementById("changePasswordBtn").addEventListener("click", async () => {
  if (userEmail) {
    try {
      await sendPasswordResetEmail(auth, userEmail);
      alert(`A password reset link has been sent to ${userEmail}. Check your inbox!`);
    } catch (err) {
      alert("Failed to send reset email: " + err.message);
    }
  } else {
    alert("User email not found.");
  }
});

document.getElementById("aboutBtn").addEventListener("click", () => {
  alert("Sari App v1.0 — Firebase Powered Edition");
});

document.getElementById("logoutBtnFull").addEventListener("click", () => {
  logoutUser();
});