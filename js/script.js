document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('sari_theme');

  if (savedTheme && savedTheme !== 'default') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

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

  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const usernameElement = document.getElementById('username');
      const passwordElement = document.getElementById('password');

      if (!usernameElement || !passwordElement) return;

      const username = usernameElement.value.trim();
      const password = passwordElement.value.trim();

      if (!username || !password) {
        return;
      }

      console.log('Login form submitted:', { username });
      window.location.href = 'homepage.php';
    });
  }

  const signupForm = document.getElementById('signupForm');

  if (signupForm) {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    if (password && confirmPassword) {
      let errorMessage = document.querySelector('.error-message');

      if (!errorMessage) {
        errorMessage = document.createElement('p');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Passwords do not match.';

        const inputGroup = confirmPassword.closest('.input-group');

        if (inputGroup) {
          inputGroup.appendChild(errorMessage);
        }
      }

      function passwordsMatch() {
        return password.value === confirmPassword.value;
      }

      confirmPassword.addEventListener('input', () => {
        if (passwordsMatch()) {
          errorMessage.style.display = 'none';
        }
      });

      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!passwordsMatch()) {
          errorMessage.style.display = 'block';
          confirmPassword.focus();
          return;
        }

        errorMessage.style.display = 'none';

        const fullNameElement = document.getElementById('fullName');
        const storeNameElement = document.getElementById('storeName');
        const emailElement = document.getElementById('email');
        const dobElement = document.getElementById('dob');

        const formData = {
          fullName: fullNameElement ? fullNameElement.value.trim() : '',
          storeName: storeNameElement ? storeNameElement.value.trim() : '',
          email: emailElement ? emailElement.value.trim() : '',
          dob: dobElement ? dobElement.value : ''
        };

        console.log('Signup form submitted:', formData);
        window.location.href = 'homepage.php';
      });
    }
  }

  const sidebar = document.getElementById('sidebar');
  const topbarMenuBtn = document.getElementById('topbarMenuBtn');

  if (topbarMenuBtn && sidebar) {
    topbarMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  if (sidebar && window.innerWidth <= 640) {
    sidebar.classList.add('collapsed');
  }

  const logoutBtn = document.getElementById('logoutBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = 'login.php';
    });
  }

  const posCategories = document.querySelectorAll('.pos-category');

  posCategories.forEach((btn) => {
    btn.addEventListener('click', () => {
      posCategories.forEach((b) => {
        b.classList.remove('active');
      });

      btn.classList.add('active');
    });
  });

  const posPaymentBtns = document.querySelectorAll('.pos-payment-btn');

  posPaymentBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      posPaymentBtns.forEach((b) => {
        b.classList.remove('active');
      });

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
        cartItems.innerHTML =
          '<p style="color:#9aa9a0; font-size:0.85rem; text-align:center; padding:20px 0;">Cart is empty.</p>';
      }
    });
  }
});

window.changeTheme = function(themeName) {
  if (themeName === 'default') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('sari_theme', 'default');
  } else {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('sari_theme', themeName);
  }

  if (typeof showToast === 'function') {
    showToast('Theme updated successfully!');
  }
};

window.showToast = function(message, type = 'success') {
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
};