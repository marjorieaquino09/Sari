import { auth } from "./firebase-config.js";
import { confirmPasswordReset, verifyPasswordResetCode } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const urlParams = new URLSearchParams(window.location.search);
const oobCode = urlParams.get('oobCode');

const resetForm = document.getElementById("resetPasswordForm");
const errorBox = document.getElementById("errorBox");
const btnSubmit = document.getElementById("btnSubmit");

if (!oobCode) {
  if (errorBox) {
    errorBox.style.display = "block";
    errorBox.innerText = "Invalid or missing password reset token.";
  }
  if (resetForm) resetForm.style.display = "none";
} else {
  verifyPasswordResetCode(auth, oobCode)
    .catch((error) => {
      console.error("Token error:", error);
      if (errorBox) {
        errorBox.style.display = "block";
        errorBox.innerText = "Expired o naisa-gamit na ang reset link na ito.";
      }
      if (resetForm) resetForm.style.display = "none";
    });
}

if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      if (errorBox) {
        errorBox.style.display = "block";
        errorBox.innerText = "Hindi nagtutugma ang password.";
      }
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerText = "Saving...";

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      alert("Matagumpay na nabago ang password! Pwede ka nang mag-login.");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Reset error:", error);
      btnSubmit.disabled = false;
      btnSubmit.innerText = "Save New Password";
      if (errorBox) {
        errorBox.style.display = "block";
        errorBox.innerText = "Error: " + error.message;
      }
    }
  });
}