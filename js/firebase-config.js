import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCWV-BrkeIg9qG29oDyVS7ka-nRTkuxMmc",
  authDomain: "sari-89290.firebaseapp.com",
  databaseURL: "https://sari-89290-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sari-89290",
  storageBucket: "sari-89290.firebasestorage.app",
  messagingSenderId: "240909232949",
  appId: "1:240909232949:web:bf528c2f5b46a3aa387a7c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);