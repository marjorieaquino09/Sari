import { db, auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

function applyTheme() {
  const savedTheme = localStorage.getItem('sari_theme');
  if (savedTheme && savedTheme !== 'default') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

applyTheme();

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();

  onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    const isAuthPage = /\/(login|signup|index)(\.html)?\/?$/.test(path) || path === "/";

    if (user && !isAuthPage) {
      listenForNotificationBadge(user.uid);
      loadTopbarAvatar(user.uid);
    }
  });

  const toggleEyeIcons = document.querySelectorAll('.toggle-eye');
  toggleEyeIcons.forEach((eyeIcon) => {
    eyeIcon.addEventListener('click', () => {
      const wrapper = eyeIcon.closest('.password-wrapper');
      if (!wrapper) return;

      const input = wrapper.querySelector('input');
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      eyeIcon.classList.toggle('fa-eye-slash', !isPassword);
      eyeIcon.classList.toggle('fa-eye', isPassword);
    });
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Logout error:', err);
      }
      localStorage.removeItem('userProfileImage');
      localStorage.removeItem('customStoreName');
      window.location.href = 'login.html';
    });
  }

  const posCategories = document.querySelectorAll('.pos-category');
  posCategories.forEach((btn) => {
    btn.addEventListener('click', () => {
      posCategories.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const posPaymentBtns = document.querySelectorAll('.pos-payment-btn');
  posPaymentBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      posPaymentBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.querySelectorAll('.pos-qty-stepper').forEach((stepper) => {
    const qtyLabel = stepper.querySelector('span');
    const buttons = stepper.querySelectorAll('button');

    if (buttons.length < 2 || !qtyLabel) return;

    buttons[0].addEventListener('click', () => {
      const current = parseInt(qtyLabel.textContent, 10) || 1;
      qtyLabel.textContent = Math.max(1, current - 1);
    });

    buttons[1].addEventListener('click', () => {
      const current = parseInt(qtyLabel.textContent, 10) || 1;
      qtyLabel.textContent = current + 1;
    });
  });

  const clearCartBtn = document.querySelector('.pos-clear-cart');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
      const cartItems = document.querySelector('.pos-cart-items');
      if (cartItems) {
        cartItems.innerHTML = '<p style="color:#9aa9a0; font-size:0.85rem; text-align:center; padding:20px 0;">Cart is empty.</p>';
      }
    });
  }
});

async function loadTopbarAvatar(userId) {
  try {
    let savedStoreName = localStorage.getItem('customStoreName');
    let savedImage = localStorage.getItem('userProfileImage');

    const storeNameEl = document.getElementById('topbarStoreName');
    if (storeNameEl && savedStoreName) {
      storeNameEl.innerText = savedStoreName;
    }

    const target =
      document.getElementById('avatarContainer') ||
      document.getElementById('topbarAvatarContainer') ||
      document.querySelector('.topbar-avatar:not(img)');

    if (target && savedImage) {
      if (target.classList.contains('topbar-avatar')) {
        target.innerHTML = '';
        target.style.backgroundImage = `url("${savedImage}")`;
        target.style.backgroundSize = 'cover';
        target.style.backgroundPosition = 'center';
      } else {
        target.innerHTML = `<img src="${savedImage}" class="topbar-avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="Avatar">`;
      }
    }

    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return;

    const uData = snap.data();
    const nameToDisplay = uData.store_name || uData.full_name || 'My Store';

    if (storeNameEl && !savedStoreName) {
      storeNameEl.innerText = nameToDisplay;
      localStorage.setItem('customStoreName', nameToDisplay);
    }

    const imgUrl = uData.profile_image || uData.photoURL || '';

    if (imgUrl && /^(data:image\/|https:\/\/)/.test(imgUrl)) {
      localStorage.setItem('userProfileImage', imgUrl);
      if (target) {
        if (target.classList.contains('topbar-avatar')) {
          target.innerHTML = '';
          target.style.backgroundImage = `url("${imgUrl}")`;
          target.style.backgroundSize = 'cover';
          target.style.backgroundPosition = 'center';
        } else {
          target.innerHTML = `<img src="${imgUrl}" class="topbar-avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="Avatar">`;
        }
      }
    } else if (target && !savedImage && !imgUrl) {
      target.style.backgroundImage = '';
      target.innerHTML = nameToDisplay.charAt(0).toUpperCase();
    }
  } catch (err) {
    console.error('Error loading topbar avatar:', err);
  }
}

function listenForNotificationBadge(userId) {
  const notifBtn = document.getElementById('notificationBtn');
  if (!notifBtn) return;

  let badgeEl = document.getElementById('notifBadge');
  if (!badgeEl) {
    notifBtn.style.position = 'relative';
    badgeEl = document.createElement('span');
    badgeEl.id = 'notifBadge';
    badgeEl.style.cssText = 'display: none; position: absolute; top: -2px; right: -2px; background: #ef4444; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 5px; border-radius: 10px; border: 2px solid #111d17; min-width: 18px; text-align: center;';
    notifBtn.appendChild(badgeEl);
  }

  const notifQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );

  onSnapshot(notifQuery, (snapshot) => {
    const unreadCount = snapshot.size;

    if (unreadCount > 0) {
      badgeEl.innerText = unreadCount > 99 ? '99+' : unreadCount;
      badgeEl.style.display = 'inline-block';
    } else {
      badgeEl.style.display = 'none';
    }
  }, (err) => {
    console.error('Error fetching notification badge:', err);
  });
}

function changeTheme(themeName) {
  if (themeName === 'default') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('sari_theme', 'default');
  } else {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('sari_theme', themeName);
  }

  if (typeof window.showToast === 'function') {
    window.showToast('Theme updated successfully!');
  }
}

function showToast(message, type = 'success') {
  let toast = document.getElementById('sariToast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'sariToast';
    document.body.appendChild(toast);
  }

  let icon = 'fa-circle-check';

  if (type === 'error') {
    icon = 'fa-circle-xmark';
  } else if (type === 'warning') {
    icon = 'fa-triangle-exclamation';
  } else if (type === 'info') {
    icon = 'fa-circle-info';
  }

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  clearTimeout(window.sariToastTimeout);

  window.sariToastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

window.changeTheme = changeTheme;
window.showToast = showToast;