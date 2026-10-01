// js/profile.js
import { db, auth } from "./firebase-config.js";
import { checkAuth } from "./auth.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUserId = null;
let currentProfileImage = null;

// 1. Session Verification & Profile Data Loading
checkAuth(async (user) => {
  currentUserId = user.uid;

  try {
    const userDocRef = doc(db, "users", currentUserId);
    const userSnap = await getDoc(userDocRef);

    let fullName = "";
    let storeName = "";
    let email = user.email || "";
    let dob = "";

    if (userSnap.exists()) {
      const data = userSnap.data();
      fullName = data.full_name || data.name || "";
      storeName = data.store_name || "";
      email = data.email || user.email || "";
      currentProfileImage = data.profile_image || null;
      dob = data.dob || "";
    } else {
      // Kung sakaling wala pang document sa Firestore, gamitin ang auth email
      email = user.email || "";
    }

    // Isalpak sa Topbar Store Name
    const topbarStoreName = document.getElementById("topbarStoreName");
    if (topbarStoreName) topbarStoreName.innerText = storeName || "My Store";

    // Isalpak sa form input fields
    const fullNameInput = document.getElementById("inputFullName");
    if (fullNameInput) fullNameInput.value = fullName;

    const storeNameInput = document.getElementById("inputStoreName");
    if (storeNameInput) storeNameInput.value = storeName;

    const emailInput = document.getElementById("valEmail");
    if (emailInput) emailInput.value = email;

    const dobInput = document.getElementById("inputDob");
    if (dobInput) dobInput.value = dob;

    renderAvatar(fullName, currentProfileImage);

  } catch (error) {
    console.error("Error loading profile:", error);
  }
});

// Render Avatar Helper
function renderAvatar(name, imgUrl) {
  const topbarAvatar = document.getElementById("topbarAvatarContainer");
  const avatarBox = document.getElementById("avatarBox");

  if (topbarAvatar) {
    if (imgUrl) {
      topbarAvatar.innerHTML = `<img src="${imgUrl}" class="topbar-avatar" style="object-fit:cover;" alt="Avatar">`;
    } else {
      topbarAvatar.innerText = (name || "U").charAt(0).toUpperCase();
    }
  }

  if (avatarBox) {
    if (imgUrl) {
      avatarBox.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="Avatar">`;
    } else {
      const initial = (name || "U").charAt(0).toUpperCase();
      avatarBox.innerHTML = `<span style="font-size: 2.5rem; font-weight: bold; color: #fff;">${initial}</span>`;
    }
  }
}

// 2. Handle Image Selection & Preview
const avatarBox = document.getElementById("avatarBox");
const profileImageFile = document.getElementById("profileImageFile");

if (avatarBox && profileImageFile) {
  avatarBox.addEventListener("click", () => profileImageFile.click());

  profileImageFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        currentProfileImage = evt.target.result; // Base64
        renderAvatar(document.getElementById("inputFullName").value, currentProfileImage);
      };
      reader.readAsDataURL(file);
    }
  });
}

// 3. Save Profile Form Submission
const profileForm = document.getElementById("profileForm");
if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("saveProfileBtn");

    const newFullName = document.getElementById("inputFullName").value.trim();
    const newStoreName = document.getElementById("inputStoreName").value.trim();
    const newDob = document.getElementById("inputDob").value;

    try {
      btn.disabled = true;
      btn.innerText = "Saving...";

      const userRef = doc(db, "users", currentUserId);
      await updateDoc(userRef, {
        full_name: newFullName,
        store_name: newStoreName,
        dob: newDob,
        profile_image: currentProfileImage,
        updated_at: serverTimestamp()
      });

      // I-update agad ang topbar store name nang walang page reload
      const topbarStoreName = document.getElementById("topbarStoreName");
      if (topbarStoreName) topbarStoreName.innerText = newStoreName;

      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Changes`;
      alert("Profile updated successfully!");

    } catch (err) {
      console.error("Error updating profile:", err);
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Changes`;
      alert("Failed to update profile: " + err.message);
    }
  });
}