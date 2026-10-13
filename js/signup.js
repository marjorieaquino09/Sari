import { auth as mainAuth } from "./firebase-config.js";
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


const SIGNUP_APP_NAME = "signupApp";
const signupApp = getApps().some((a) => a.name === SIGNUP_APP_NAME)
  ? getApp(SIGNUP_APP_NAME)
  : initializeApp(mainAuth.app.options, SIGNUP_APP_NAME);

const signupAuth = getAuth(signupApp);
const signupDb = getFirestore(signupApp);

const signupForm = document.getElementById("signupForm");
const errorBox = document.getElementById("errorBox");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const name = document.getElementById("signupName")?.value.trim() || "";
    const email = document.getElementById("signupEmail")?.value.trim() || "";
    const password = document.getElementById("signupPassword")?.value || "";

    if (errorBox) {
      errorBox.style.display = "none";
      errorBox.innerText = "";
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(signupAuth, email, password);
      const user = userCredential.user;

      if (name) {
        await updateProfile(user, { displayName: name });
      }

      await setDoc(doc(signupDb, "users", user.uid), {
        full_name: name,
        email: email,
        store_name: name ? name + " Store" : "My Store",
        profile_image: "",
        createdAt: new Date()
      });

      await signOut(signupAuth);

      localStorage.removeItem("userProfileImage");
      localStorage.removeItem("customStoreName");

      alert("You have successfully signed up! Please log in with your new account.");
      window.location.href = "login.html";

    } catch (error) {
      console.error("Signup error:", error);
      if (errorBox) {
        errorBox.style.display = "block";
        if (error.code === "auth/email-already-in-use") {
          errorBox.innerText = "May gumagamit na ng email na ito.";
        } else if (error.code === "auth/weak-password") {
          errorBox.innerText = "Dapat mahigit 6 na characters ang password.";
        } else {
          errorBox.innerText = "May naganap na error: " + error.message;
        }
      }
    }
  });
}

const toggleSignupPassword = document.getElementById("toggleSignupPassword");
const signupPasswordInput = document.getElementById("signupPassword");

if (toggleSignupPassword && signupPasswordInput) {
  toggleSignupPassword.addEventListener("click", () => {
    const type = signupPasswordInput.getAttribute("type") === "password" ? "text" : "password";
    signupPasswordInput.setAttribute("type", type);
    toggleSignupPassword.classList.toggle("fa-eye");
    toggleSignupPassword.classList.toggle("fa-eye-slash");
  });
}