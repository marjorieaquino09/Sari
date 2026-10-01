// js/auth.js
import { auth } from "./firebase-config.js";
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


export function checkAuth(callback) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      
      callback(user);
    } else {
      // WALANG naka-login, ibalik agad sa login.html
      window.location.href = "login.html";
    }
  });
}


export function logoutUser() {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch((error) => {
    console.error("Logout Error:", error);
  });
}