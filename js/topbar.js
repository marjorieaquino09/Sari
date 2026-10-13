import { db } from "./firebase-config.js";
import { checkAuth } from "./auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

function applyTopbar(name, initialSource, image) {
  const storeEl = document.getElementById("topbarStoreName");
  if (storeEl) storeEl.innerText = name;

  const avatar =
    document.getElementById("topbarAvatarContainer") ||
    document.getElementById("avatarContainer") ||
    document.querySelector(".topbar-avatar");
  if (!avatar) return;

  if (image) {
    avatar.textContent = "";
    avatar.style.overflow = "hidden";
    avatar.style.borderRadius = "50%";
    avatar.innerHTML = `<img src="${image}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
  } else {
    avatar.textContent = (initialSource || name || "U").charAt(0).toUpperCase();
  }
}

checkAuth(async (user) => {
  const cacheKey = "topbar_" + user.uid;

  // 1. Ipakita agad ang naka-cache (per-user) para hindi maghintay sa Firestore
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (cached) applyTopbar(cached.name, cached.initialSource, cached.image);
  } catch (e) {}

  // 2. Kunin ang pinakabago mula sa Firestore at i-update ang cache
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.exists() ? snap.data() : {};
    const name = data.store_name || data.full_name || "My Store";
    const initialSource = data.full_name || name;
    const image = data.profile_image || null;

    applyTopbar(name, initialSource, image);

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ name, initialSource, image }));
    } catch (e) {
      console.warn("topbar cache hindi na-save:", e);
    }
  } catch (err) {
    // Halimbawa: quota exceeded. Mananatili ang naka-cache na picture.
    console.error("topbar error:", err);
  }
});