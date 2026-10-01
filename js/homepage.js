
import { db, auth } from "./firebase-config.js";
import { checkAuth, logoutUser } from "./auth.js";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


import { initializeDefaultProducts } from "./init-products.js";

let currentUserId = null;
let selectedCategory = "";
let searchQuery = "";
let allProducts = [];
let unsubscribeProducts = null;


checkAuth(async (user) => {
  currentUserId = user.uid;

  
  try {
    const userDoc = await getDoc(doc(db, "users", currentUserId));
    if (userDoc.exists()) {
      const uData = userDoc.data();
      const storeNameEl = document.getElementById("topbarStoreName");
      if (storeNameEl) {
        storeNameEl.innerText = uData.store_name || uData.full_name || "My Store";
      }

      const avatarEl = document.getElementById("avatarContainer");
      if (avatarEl && uData.profile_image) {
        avatarEl.innerHTML = `<img src="${uData.profile_image}" class="topbar-avatar" style="object-fit:cover;" alt="Avatar">`;
      }
    }
  } catch (err) {
    console.error("Error fetching user profile:", err);
  }

  
  try {
    if (typeof initializeDefaultProducts === "function") {
      await initializeDefaultProducts(currentUserId);
    }
  } catch (seedErr) {
    console.error("Error initializing default products:", seedErr);
  }

  
  loadProductsRealtime();
});


function loadProductsRealtime() {
  const productGrid = document.getElementById("productGrid");

  if (unsubscribeProducts) unsubscribeProducts();

  const q = query(collection(db, "products"), where("userId", "==", currentUserId));

  unsubscribeProducts = onSnapshot(q, (querySnapshot) => {
    allProducts = [];
    querySnapshot.forEach((docSnap) => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });

    renderProducts();
  }, (error) => {
    console.error("Error fetching products:", error);
    if (productGrid) {
      productGrid.innerHTML = `<p style="color: #ffffff; grid-column: 1 / -1; text-align: center; padding: 40px;">Nagka-error sa pagkuha ng produkto.</p>`;
    }
  });
}


function renderProducts() {
  const productGrid = document.getElementById("productGrid");
  if (!productGrid) return;

  const filtered = allProducts.filter((p) => {
    const matchCategory = !selectedCategory || selectedCategory === "All" || p.category === selectedCategory;
    const matchSearch = !searchQuery || 
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (p.barcode && p.barcode.includes(searchQuery));
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    productGrid.innerHTML = `<p style="color: #ffffff; grid-column: 1 / -1; text-align: center; padding: 40px;">Wala pang nahanap na produkto.</p>`;
    return;
  }

  productGrid.innerHTML = filtered.map((p) => {
    const stock = Number(p.stock || 0);
    const isAvailable = stock > 0;
    
    // Auto-detect image source format mula sa uploads/ folder, http, o base64
    let imgSource = "uploads/default.jpg";
    if (p.image) {
      if (p.image.startsWith("http") || p.image.startsWith("data:")) {
        imgSource = p.image;
      } else if (p.image.startsWith("uploads/")) {
        imgSource = p.image;
      } else {
        imgSource = `uploads/${p.image}`;
      }
    }

    return `
      <div class="product-card">
        <div>
          <img src="${imgSource}" alt="${p.name || 'Product'}" onerror="this.onerror=null; this.src='https://via.placeholder.com/150?text=SARI';">
        </div>
        <div class="product-info">
          <div class="product-category">${p.category || 'General'}</div>
          <div class="product-title">${p.name || ''}</div>
          <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 4px;">Barcode: ${p.barcode || 'N/A'}</div>
          <div class="product-price">₱${Number(p.price || 0).toFixed(2)}</div>
        </div>
        <div class="product-bottom-row">
          <span style="font-size: 0.75rem; font-weight: 700; color: ${isAvailable ? '#4a9c62' : '#d1544a'};">
            Stock: ${stock}
          </span>
          ${
            isAvailable 
              ? `<button class="add-cart-btn" data-id="${p.id}" style="border:none; cursor:pointer;"><i class="fa-solid fa-plus"></i></button>`
              : `<span style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Out of Stock</span>`
          }
        </div>
      </div>
    `;
  }).join("");

 
  document.querySelectorAll(".add-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

// 4. Add to Cart Logic (Firestore)
async function addToCart(productId) {
  try {
    const product = allProducts.find((p) => p.id === productId);
    if (!product || Number(product.stock) <= 0) return;

    const cartRef = collection(db, "cart");
    const q = query(cartRef, where("userId", "==", currentUserId), where("productId", "==", productId));
    const cartSnap = await getDocs(q);

    if (!cartSnap.empty) {
      const cartItem = cartSnap.docs[0];
      const newQty = (cartItem.data().quantity || 0) + 1;

      if (newQty <= Number(product.stock)) {
        await updateDoc(doc(db, "cart", cartItem.id), {
          quantity: newQty,
          updatedAt: serverTimestamp()
        });
      } else {
        alert("Sobra na sa available stock!");
        return;
      }
    } else {
      await addDoc(cartRef, {
        userId: currentUserId,
        productId: productId,
        productName: product.name,
        price: product.price,
        quantity: 1,
        createdAt: serverTimestamp()
      });
    }

    alert(`Nai-add ang "${product.name}" sa cart!`);
  } catch (err) {
    console.error("Error adding to cart:", err);
  }
}

// 5. Search at Category Event Listeners
const searchForm = document.getElementById("searchForm");
if (searchForm) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    searchQuery = document.getElementById("searchInput").value.trim();
    renderProducts();
  });
}

const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    renderProducts();
  });
}

document.querySelectorAll(".category-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".category-pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    selectedCategory = pill.dataset.category || "";
    renderProducts();
  });
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    logoutUser();
  });
}