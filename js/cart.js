// js/cart.js
import { db, auth } from "./firebase-config.js";
import { checkAuth, logoutUser } from "./auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUserId = null;


function getCart() {
  const cart = localStorage.getItem("sari_cart");
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem("sari_cart", JSON.stringify(cart));
  renderCart();
}


checkAuth(async (user) => {
  currentUserId = user.uid;

  try {
    const userDoc = await getDoc(doc(db, "users", currentUserId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const storeName = data.store_name || "My Store";
      document.getElementById("topbarStoreName").innerText = storeName;

      const topbarAvatar = document.getElementById("topbarAvatarContainer");
      if (data.profile_image) {
        topbarAvatar.innerHTML = `<img src="${data.profile_image}" class="topbar-avatar" style="object-fit:cover;" alt="Avatar">`;
      } else {
        topbarAvatar.innerText = (data.full_name || "U").charAt(0).toUpperCase();
      }
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }

  renderCart();
});


function renderCart() {
  const cart = getCart();
  const container = document.getElementById("cartContentArea");
  const clearBtn = document.getElementById("clearCartBtn");

  if (!cart || cart.length === 0) {
    clearBtn.style.display = "none";
    container.innerHTML = `
      <div class="empty-cart-card">
        <i class="fa-solid fa-basket-shopping empty-icon"></i>
        <h3>Your cart is empty</h3>
        <p>Magdagdag ng paninda mula sa Home page.</p>
        <a href="index.html" class="btn-shop-now">Go to Home</a>
      </div>
    `;
    return;
  }

  clearBtn.style.display = "inline-block";

  let grandTotal = 0;
  let totalItemsCount = 0;

  const tableRowsHtml = cart.map((item, index) => {
    const price = Number(item.price || 0);
    const qty = Number(item.qty || 1);
    const subtotal = price * qty;

    grandTotal += subtotal;
    totalItemsCount += qty;

    return `
      <tr>
        <td class="product-cell">
          <div class="cart-item-title">${item.name || 'Product'}</div>
          <span class="cart-item-cat">${item.category || 'General'}</span>
        </td>
        <td>₱${price.toFixed(2)}</td>
        <td>
          <div class="qty-control">
            <button type="button" class="qty-btn btn-decrease" data-index="${index}">-</button>
            <span class="qty-num">${qty}</span>
            <button type="button" class="qty-btn btn-increase" data-index="${index}">+</button>
          </div>
        </td>
        <td class="subtotal-text">₱${subtotal.toFixed(2)}</td>
        <td>
          <button type="button" class="remove-btn btn-remove" data-index="${index}" title="Remove Item">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items-wrapper">
        <table class="cart-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Subtotal</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <div class="cart-summary-card">
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Total Items:</span>
          <span>${cart.length} (${totalItemsCount} pcs)</span>
        </div>
        <div class="summary-row total-row">
          <span>Grand Total:</span>
          <span class="grand-total-val">₱${grandTotal.toFixed(2)}</span>
        </div>
        <a href="checkout.html" class="btn-checkout">
          Proceed to Checkout <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `;

  attachCartEvents();
}


function attachCartEvents() {
  document.querySelectorAll(".btn-increase").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      const cart = getCart();
      cart[idx].qty += 1;
      saveCart(cart);
    });
  });

  document.querySelectorAll(".btn-decrease").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      const cart = getCart();
      cart[idx].qty -= 1;

      if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
      }
      saveCart(cart);
    });
  });

  document.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      const cart = getCart();
      cart.splice(idx, 1);
      saveCart(cart);
    });
  });
}

document.getElementById("clearCartBtn").addEventListener("click", () => {
  if (confirm("Sigurado ka bang gusto mong alisin ang lahat ng laman ng cart?")) {
    saveCart([]);
  }
});

document.getElementById("logoutBtn").addEventListener("click", logoutUser);