// js/edit-profile.js
import { db, auth } from "./firebase-config.js";
import { checkAuth } from "./auth.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUserId = null;
let currentProfileImage = null;


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
      fullName = data.full_name || "";
      storeName = data.store_name || "";
      email = data.email || user.email || "";
      currentProfileImage = data.profile_image || null;
      dob = data.dob || "";
    }

    
    const topbarStoreName = document.getElementById("topbarStoreName");
    if (topbarStoreName) topbarStoreName.innerText = storeName || "My Store";

    document.getElementById("fullNameInput").value = fullName;
    document.getElementById("storeNameInput").value = storeName;
    document.getElementById("emailInput").value = email;
    document.getElementById("dobInput").value = dob;

    renderAvatar(fullName, currentProfileImage);

  } catch (error) {
    console.error("Error loading profile:", error);
  }
});


function renderAvatar(name, imgUrl) {
  const topbarAvatar = document.getElementById("topbarAvatarContainer");
  const avatarPreview = document.getElementById("avatarPreview");

  if (topbarAvatar) {
    if (imgUrl) {
      topbarAvatar.innerHTML = `<img src="${imgUrl}" class="topbar-avatar" style="object-fit:cover;" alt="Avatar">`;
    } else {
      topbarAvatar.innerText = (name || "U").charAt(0).toUpperCase();
    }
  }

  if (avatarPreview) {
    if (imgUrl) {
      avatarPreview.innerHTML = `<img src="${imgUrl}" alt="Avatar">`;
    } else {
      avatarPreview.innerHTML = `<i class="fa-solid fa-user"></i>`;
    }
  }
}


const avatarPreview = document.getElementById("avatarPreview");
const profileImageInput = document.getElementById("profileImageInput");

if (avatarPreview && profileImageInput) {
  avatarPreview.addEventListener("click", () => profileImageInput.click());

  profileImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        currentProfileImage = evt.target.result; // Base64
        renderAvatar(document.getElementById("fullNameInput").value, currentProfileImage);
      };
      reader.readAsDataURL(file);
    }
  });
}


const editProfileForm = document.getElementById("editProfileForm");
if (editProfileForm) {
  editProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("saveProfileBtn");

    const newFullName = document.getElementById("fullNameInput").value.trim();
    const newStoreName = document.getElementById("storeNameInput").value.trim();
    const newDob = document.getElementById("dobInput").value;

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

     
      btn.disabled = false;
      btn.innerText = "Save Changes";

      alert("Profile updated successfully!");
      window.location.href = "profile.html";

    } catch (err) {
      console.error("Error updating profile:", err);
      btn.disabled = false;
      btn.innerText = "Save Changes";
      alert("Failed to update profile: " + err.message);
    }
  });
}