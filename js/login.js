import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const errorBox = document.getElementById("errorBox");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Pinipigilan nitong mag-reload ang page

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (errorBox) {
      errorBox.style.display = "none";
      errorBox.innerText = "";
    }

    try {
      
      await signInWithEmailAndPassword(auth, email, password);
      
    
      window.location.href = "homepage.html";
    } catch (error) {
      console.error("Login error:", error);
      if (errorBox) {
        errorBox.style.display = "block";
        
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          errorBox.innerText = "Mali ang email o password mo. Pakisubukan ulit.";
        } else {
          errorBox.innerText = "May naganap na error: " + error.message;
        }
      }
    }
  });
}