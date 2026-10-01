
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, collection, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const signupForm = document.getElementById("signupForm");
const errorBox = document.getElementById("errorBox");
const btnSignup = document.getElementById("btnSignup");


function setupPasswordToggle(toggleId, inputId) {
  const toggleBtn = document.getElementById(toggleId);
  const inputField = document.getElementById(inputId);

  if (toggleBtn && inputField) {
    toggleBtn.addEventListener("click", () => {
      const isPassword = inputField.getAttribute("type") === "password";
      inputField.setAttribute("type", isPassword ? "text" : "password");
      toggleBtn.classList.toggle("fa-eye", isPassword);
      toggleBtn.classList.toggle("fa-eye-slash", !isPassword);
    });
  }
}

setupPasswordToggle("togglePassword", "signupPassword");
setupPasswordToggle("toggleConfirmPassword", "signupConfirmPassword");


const defaultProducts = [
  
  { name: 'Sisters Sanitary Pad', category: 'Household', price: 38.00, stock: 15, image: 'sist.jpg' },
  { name: 'Modess Sanitary Napkin 8s', category: 'Household', price: 45.00, stock: 15, image: 'mod.jpg' },
  { name: 'Scotch Brite Sponge', category: 'Household', price: 25.00, stock: 15, image: 'sb.jpg' },
  { name: 'Katol (Mosquito Coil)', category: 'Household', price: 22.00, stock: 20, image: 'kat.jpg' },
  { name: 'Zonrox Bleach 250ml', category: 'Household', price: 22.00, stock: 15, image: 'zon.jpg' },
  { name: 'Champion Bar Soap', category: 'Household', price: 28.00, stock: 25, image: 'champ.jpg' },
  { name: 'Downy Fabric Conditioner Sachet', category: 'Household', price: 8.00, stock: 50, image: 'down.jpg' },
  { name: 'Sunsilk Shampoo Sachet', category: 'Household', price: 7.00, stock: 50, image: 'suns.jpg' },
  { name: 'Colgate Toothpaste Small', category: 'Household', price: 24.00, stock: 20, image: 'colg.jpg' },
  { name: 'Creamsilk Conditioner Sachet', category: 'Household', price: 8.00, stock: 50, image: 'cream.jpg' },
  { name: 'Palmolive Shampoo Sachet', category: 'Household', price: 7.00, stock: 50, image: 'palm.jpg' },
  { name: 'Safeguard Bar Soap White', category: 'Household', price: 32.00, stock: 25, image: 'safe.jpg' },

  
  { name: 'Gatorade Blue Bolt', category: 'Beverage', price: 40.00, stock: 15, image: 'gat.jpg' },
  { name: 'Zesto Juice Orange', category: 'Beverage', price: 10.00, stock: 30, image: 'zes_o.jpg' },
  { name: 'Zesto Juice Apple', category: 'Beverage', price: 10.00, stock: 30, image: 'zes_a.jpg' },
  { name: 'Sprite 1.5L', category: 'Beverage', price: 72.00, stock: 10, image: 'spr_15.jpg' },
  { name: 'Royal 1.5L', category: 'Beverage', price: 72.00, stock: 10, image: 'roy_15.jpg' },
  { name: "Nature's Spring 500ml", category: 'Beverage', price: 12.00, stock: 40, image: 'nat.jpg' },
  { name: 'C2 Apple 500ml', category: 'Beverage', price: 25.00, stock: 25, image: 'c2_a.jpg' },
  { name: 'Sting Energy Drink', category: 'Beverage', price: 25.00, stock: 30, image: 'sti.jpg' },
  { name: 'Coke 500ml', category: 'Beverage', price: 35.00, stock: 24, image: 'cok.jpg' },

 
  { name: "Young's Town Sardines", category: 'Canned', price: 26.00, stock: 20, image: 'yt.jpg' },
  { name: 'San Marino Corned Tuna', category: 'Canned', price: 35.00, stock: 20, image: 'sm_tuna.jpg' },
  { name: 'CDO Carne Norte', category: 'Canned', price: 28.00, stock: 15, image: 'cdo.jpg' },
  { name: 'Purefoods Corned Beef', category: 'Canned', price: 55.00, stock: 12, image: 'pf.jpg' },
  { name: 'Argentina Meat Loaf', category: 'Canned', price: 25.00, stock: 18, image: 'arg_ml.jpg' },
  { name: 'Argentina Corned Beef', category: 'Canned', price: 32.00, stock: 15, image: 'arg_cb.jpg' },
  { name: 'Century Tuna Hot & Spicy', category: 'Canned', price: 39.00, stock: 15, image: 'cen_spi.jpg' },
  { name: 'Century Tuna Flakes in Oil', category: 'Canned', price: 38.00, stock: 15, image: 'cen_oil.jpg' },
  { name: 'Ligo Sardines Red', category: 'Canned', price: 29.00, stock: 15, image: 'lgr.jpg' },
  { name: 'Ligo Sardines Green', category: 'Canned', price: 29.00, stock: 15, image: 'lgg.jpg' },
  { name: 'Mega Sardines Chili', category: 'Canned', price: 31.00, stock: 15, image: 'meg_chi.jpg' },

  
  { name: "Hunter's Dry Gin", category: 'Alcohol', price: 80.00, stock: 15, image: 'hunt.jpg' },
  { name: 'Fundador Light 750ml', category: 'Alcohol', price: 450.00, stock: 6, image: 'fund.jpg' },
  { name: 'Ginebra San Miguel Gin 350ml', category: 'Alcohol', price: 75.00, stock: 20, image: 'gsm.jpg' },
  { name: 'Emperador Light Brandy 750ml', category: 'Alcohol', price: 150.00, stock: 12, image: 'emp.jpg' },

  
  { name: 'Milo Champion 3in1', category: 'Coffee & Tea', price: 12.00, stock: 30, image: 'mil_c.jpg' },
  { name: 'Quaker Oats Instant Sachet', category: 'Coffee & Tea', price: 12.00, stock: 25, image: 'qua.jpg' },
  { name: 'Milo Sachet 24g', category: 'Coffee & Tea', price: 12.00, stock: 40, image: 'mil.jpg' },
  { name: 'Nescafe Creamy White', category: 'Coffee & Tea', price: 9.00, stock: 50, image: 'nes_c.jpg' },
  { name: 'Nescafe Original 3in1', category: 'Coffee & Tea', price: 8.50, stock: 50, image: 'nes_o.jpg' },
  { name: 'Kopiko Brown Coffee', category: 'Coffee & Tea', price: 9.00, stock: 50, image: 'kop_b.jpg' },
  { name: 'Kopiko Blanka 3in1', category: 'Coffee & Tea', price: 9.00, stock: 50, image: 'kop.jpg' },
  { name: 'Great Taste White 3in1', category: 'Coffee & Tea', price: 8.00, stock: 50, image: 'gt.jpg' },

 
  { name: 'Lemon Square Cheese Cupcake', category: 'Biscuits', price: 10.00, stock: 20, image: 'lem.jpg' },
  { name: 'Choco Mucho Cookie', category: 'Biscuits', price: 12.00, stock: 25, image: 'cmc.jpg' },
  { name: 'Magic Flakes Choco', category: 'Biscuits', price: 8.00, stock: 35, image: 'mf_c.jpg' },
  { name: 'Cream-O Vanilla', category: 'Biscuits', price: 9.00, stock: 30, image: 'cre.jpg' },
  { name: 'Criss Cross Crackers', category: 'Biscuits', price: 8.00, stock: 30, image: 'cc.jpg' },
  { name: 'Presto Peanut Butter', category: 'Biscuits', price: 8.00, stock: 35, image: 'pre.jpg' },
  { name: 'Hansel Butter', category: 'Biscuits', price: 8.00, stock: 35, image: 'han.jpg' },
  { name: 'Rebisco Chocolate Sandwich', category: 'Biscuits', price: 8.00, stock: 35, image: 'reb_c.jpg' },
  { name: 'Rebisco Crackers', category: 'Biscuits', price: 7.00, stock: 40, image: 'reb.jpg' },
  { name: 'Fita Crackers', category: 'Biscuits', price: 9.00, stock: 35, image: 'fit.jpg' },
  { name: 'SkyFlakers Crackers', category: 'Biscuits', price: 8.00, stock: 40, image: 'sky.jpg' },

  
  { name: 'Ding Dong Mixed Nuts', category: 'Chips', price: 18.00, stock: 20, image: 'dd.jpg' },
  { name: 'Nagaraya Peanut Garlic', category: 'Chips', price: 20.00, stock: 20, image: 'nag.jpg' },
  { name: 'Boy Bawang Cornick', category: 'Chips', price: 12.00, stock: 30, image: 'boy.jpg' },
  { name: "Cracklings Salt & Vinegar", category: 'Chips', price: 10.00, stock: 25, image: 'cra.jpg' },
  { name: 'Patata', category: 'Chips', price: 12.00, stock: 20, image: 'pat.jpg' },
  { name: "Nova Lick 'n Chips", category: 'Chips', price: 25.00, stock: 15, image: 'nov.jpg' },
  { name: 'Mr. Chips', category: 'Chips', price: 12.00, stock: 25, image: 'mrc.jpg' },
  { name: 'Piattos Cheese', category: 'Chips', price: 20.00, stock: 25, image: 'pia.jpg' },

  
  { name: 'Crispy Fry Breading Mix', category: 'Condiments', price: 20.00, stock: 25, image: 'cris.jpg' },
  { name: 'Mama Sita Sinigang Mix', category: 'Condiments', price: 25.00, stock: 25, image: 'mam.jpg' },
  { name: 'Knorr Liquid Seasoning', category: 'Condiments', price: 35.00, stock: 15, image: 'kno.jpg' },
  { name: 'Ajinomoto Umami Seasoning 50g', category: 'Condiments', price: 15.00, stock: 30, image: 'aji.jpg' },
  { name: 'Magic Sarap All-In-One Seasoning', category: 'Condiments', price: 6.00, stock: 50, image: 'mag.jpg' },
  { name: 'Papa Banana Catsup', category: 'Condiments', price: 28.00, stock: 18, image: 'pap.jpg' },
  { name: 'Silver Swan Vinegar', category: 'Condiments', price: 20.00, stock: 20, image: 'ss_v.jpg' },
  { name: 'Silver Swan Soy Sauce 350ml', category: 'Condiments', price: 22.00, stock: 20, image: 'ss_s.jpg' },
  { name: 'Datu Puti Vinegar 350ml', category: 'Condiments', price: 20.00, stock: 20, image: 'dp_v.jpg' },
  { name: 'Datu Puti Soy Sauce 350ml', category: 'Condiments', price: 22.00, stock: 20, image: 'dp_s.jpg' },
  { name: 'Mang Tomas Siga Lechon Sauce', category: 'Condiments', price: 25.00, stock: 20, image: 'mt.jpg' }
];

function showError(message, isError = true) {
  if (!errorBox) return;
  errorBox.style.display = "block";
  errorBox.style.background = isError ? "rgba(217, 83, 79, 0.4)" : "rgba(92, 184, 92, 0.4)";
  errorBox.style.color = "#fff";
  errorBox.innerText = message;
}

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("signupFullName").value.trim();
    const storeName = document.getElementById("signupStoreName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const dob = document.getElementById("signupDob").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const confirmPassword = document.getElementById("signupConfirmPassword").value.trim();

    if (!fullName || !storeName || !email || !dob || !password || !confirmPassword) {
      showError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    try {
      if (btnSignup) {
        btnSignup.disabled = true;
        btnSignup.innerText = "Creating account...";
      }

      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      
      await setDoc(doc(db, "users", user.uid), {
        full_name: fullName,
        store_name: storeName,
        email: email,
        dob: dob,
        created_at: serverTimestamp()
      });

     
      const batch = writeBatch(db);
      const productsRef = collection(db, "products");

      defaultProducts.forEach((prod) => {
        const newDocRef = doc(productsRef);
        batch.set(newDocRef, {
          userId: user.uid,
          name: prod.name,
          category: prod.category,
          price: prod.price,
          stock: prod.stock,
          image: prod.image,
          created_at: serverTimestamp()
        });
      });

      await batch.commit();

      showError("Account created successfully! Redirecting to login...", false);

      
      await signOut(auth);

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);

    } catch (error) {
      if (btnSignup) {
        btnSignup.disabled = false;
        btnSignup.innerText = "Sign Up";
      }

      switch (error.code) {
        case "auth/email-already-in-use":
          showError("Email address is already registered.");
          break;
        case "auth/weak-password":
          showError("Password should be at least 6 characters.");
          break;
        case "auth/invalid-email":
          showError("Please enter a valid email address.");
          break;
        default:
          showError("Failed to create account: " + error.message);
      }
    }
  });
}