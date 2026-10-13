import { auth } from "./firebase-config.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const forgotForm = document.getElementById("forgotForm");
const errorBox = document.getElementById("errorBox");

if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("resetEmail").value.trim();
    const btnReset = document.getElementById("btnReset");

    if (errorBox) {
      errorBox.style.display = "none";
      errorBox.innerText = "";
    }

    btnReset.disabled = true;
    btnReset.innerText = "Sending...";

    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Naisend na ang password reset link sa ${email}!\nPaki-check ang iyong inbox o spam folder.`);
      window.location.href = "login.html";
    } catch (error) {
      console.error("Reset error:", error);
      btnReset.disabled = false;
      btnReset.innerText = "Send Reset Link";
      
      if (errorBox) {
        errorBox.style.display = "block";
        if (error.code === 'auth/user-not-found') {
          errorBox.innerText = "Walang account na nakarehistro sa email na ito.";
        } else {
          errorBox.innerText = "Error: " + error.message;
        }
      }
    }
  });
}