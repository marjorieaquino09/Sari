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
      fullName = data.full_name || data.name || "";
      storeName = data.store_name || "";
      email = data.email || user.email || "";
      currentProfileImage = data.profile_image || null;
      dob = data.dob || "";
    }

    const topbarStoreName = document.getElementById("topbarStoreName");
    if (topbarStoreName) topbarStoreName.innerText = storeName || "My Store";

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

function renderAvatar(name, imgUrl) {
  const topbarAvatar =
    document.getElementById("topbarAvatarContainer") ||
    document.getElementById("avatarContainer");
  const avatarBox = document.getElementById("avatarBox");

  if (topbarAvatar) {
    if (imgUrl) {
      if (topbarAvatar.classList.contains("topbar-avatar")) {
        topbarAvatar.innerHTML = "";
        topbarAvatar.style.backgroundImage = `url("${imgUrl}")`;
        topbarAvatar.style.backgroundSize = "cover";
        topbarAvatar.style.backgroundPosition = "center";
      } else {
        topbarAvatar.innerHTML = `<img src="${imgUrl}" class="topbar-avatar" style="object-fit:cover;" alt="Avatar">`;
      }
    } else {
      topbarAvatar.style.backgroundImage = "";
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

function compressImage(file, size = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Hindi mabasa ang file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Hindi valid na larawan ang file."));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, size, size);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const avatarBox = document.getElementById("avatarBox");
const profileImageFile = document.getElementById("profileImageFile");

if (avatarBox && profileImageFile) {
  avatarBox.addEventListener("click", () => profileImageFile.click());

  profileImageFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      currentProfileImage = await compressImage(file);
      renderAvatar(document.getElementById("inputFullName").value, currentProfileImage);

      if (currentUserId) {
        await updateDoc(doc(db, "users", currentUserId), {
          profile_image: currentProfileImage,
          updated_at: serverTimestamp()
        });
        localStorage.setItem("userProfileImage", currentProfileImage);
      }
    } catch (err) {
      console.error("Image error:", err);
      alert("Hindi na-save ang picture: " + err.message);
    }
  });
}

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

      if (newStoreName) {
        localStorage.setItem("customStoreName", newStoreName);
      } else {
        localStorage.removeItem("customStoreName");
      }

      if (currentProfileImage) {
        localStorage.setItem("userProfileImage", currentProfileImage);
      }

      const topbarStoreName = document.getElementById("topbarStoreName");
      if (topbarStoreName) topbarStoreName.innerText = newStoreName || "My Store";

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