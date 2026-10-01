// ============================================================
// Shared script for all SARI pages (profile, edit, settings, notifications)
// Each block checks whether its elements exist before running,
// so this one file is safe to include on every page.
// ============================================================

// ---- Profile data storage (so Edit Profile persists across pages) ----
const DEFAULT_PROFILE = {
  fullname: 'Majo Sungit',
  storename: "Majo's Store",
  email: 'majo@gmail.com',
  phone: '0917 234 5566',
  address: '123 kanya kanya, Nato city'
};

function getProfile(){
  try{
    const saved = JSON.parse(localStorage.getItem('sari-profile'));
    return saved ? { ...DEFAULT_PROFILE, ...saved } : { ...DEFAULT_PROFILE };
  }catch(e){
    return { ...DEFAULT_PROFILE };
  }
}

function saveProfile(data){
  localStorage.setItem('sari-profile', JSON.stringify(data));
}

// ---- Toggle switches (Settings page) ----
document.querySelectorAll('[data-toggle]').forEach(btn=>{
  btn.innerHTML = '<span class="knob"></span>';
  btn.addEventListener('click', ()=> btn.classList.toggle('off'));
});

// ---- QR code generator (deterministic pattern from store info) ----
function seededRandom(seed){
  let s = seed;
  return function(){
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashString(str){
  let h = 0;
  for(let i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i)) >>> 0; }
  return h;
}

function renderQR(text){
  const qrTarget = document.getElementById('qr-code');
  if(!qrTarget) return;

  const size = 21;
  const cell = 130 / size;
  const rand = seededRandom(hashString(text) || 1);
  let cells = [];
  for(let r=0;r<size;r++){
    cells[r]=[];
    for(let c=0;c<size;c++){ cells[r][c] = rand() > 0.55 ? 1 : 0; }
  }

  function stampFinder(row0, col0){
    for(let r=0;r<7;r++){
      for(let c=0;c<7;c++){
        const border = (r===0||r===6||c===0||c===6);
        const inner = (r>=2&&r<=4&&c>=2&&c<=4);
        cells[row0+r][col0+c] = (border||inner) ? 1 : 0;
      }
    }
  }
  stampFinder(0,0);
  stampFinder(0, size-7);
  stampFinder(size-7, 0);

  let rects = '';
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(cells[r][c]){
        rects += `<rect x="${c*cell}" y="${r*cell}" width="${cell}" height="${cell}" fill="#163329"/>`;
      }
    }
  }

  qrTarget.innerHTML = `<svg viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="130" height="130" fill="white"/>
    ${rects}
  </svg>`;
}

// ---- PROFILE PAGE ----
(function initProfilePage(){
  const nameEl = document.getElementById('p-name');
  if(!nameEl) return; // not on the profile page

  const data = getProfile();
  document.getElementById('p-name').textContent = data.fullname;
  document.getElementById('p-store').textContent = data.storename;
  document.getElementById('p-fullname').textContent = data.fullname;
  document.getElementById('p-email').textContent = data.email;
  document.getElementById('p-phone').textContent = data.phone;
  document.getElementById('p-address').textContent = data.address;

  const qrNameEl = document.getElementById('qr-storename');
  if(qrNameEl) qrNameEl.textContent = data.storename;
  renderQR(data.storename + '|' + data.email);

  const downloadBtn = document.getElementById('qr-download');
  if(downloadBtn){
    downloadBtn.addEventListener('click', ()=>{
      const svgEl = document.querySelector('#qr-code svg');
      if(!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], {type:'image/svg+xml'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'store-qr-code.svg';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
})();

// ---- EDIT PROFILE PAGE ----
(function initEditPage(){
  const form = document.getElementById('edit-form');
  if(!form) return; // not on the edit page

  const data = getProfile();
  document.getElementById('in-fullname').value = data.fullname;
  document.getElementById('in-storename').value = data.storename;
  document.getElementById('in-email').value = data.email;
  document.getElementById('in-phone').value = data.phone;
  document.getElementById('in-address').value = data.address;

  const initials = data.fullname.split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const initialsEl = document.getElementById('e-initials');
  if(initialsEl) initialsEl.textContent = initials || 'MS';

  form.addEventListener('submit', function(e){
    e.preventDefault();
    saveProfile({
      fullname: document.getElementById('in-fullname').value.trim(),
      storename: document.getElementById('in-storename').value.trim(),
      email: document.getElementById('in-email').value.trim(),
      phone: document.getElementById('in-phone').value.trim(),
      address: document.getElementById('in-address').value.trim()
    });
    window.location.href = 'profile.html';
  });
})();

// ---- NOTIFICATIONS PAGE ----
(function initNotificationsPage(){
  const list = document.getElementById('notif-list');
  if(!list) return; // not on the notifications page

  const tabs = document.querySelectorAll('.notif-tab');
  const rows = document.querySelectorAll('#notif-list .notif-row');

  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.tab;
      rows.forEach(row=>{
        const isUnread = row.dataset.unread === 'true';
        row.style.display = (mode==='unread' && !isUnread) ? 'none' : 'flex';
      });
    });
  });

  const markAllBtn = document.getElementById('mark-all-read');
  if(markAllBtn){
    markAllBtn.addEventListener('click', ()=>{
      rows.forEach(row=>{
        row.dataset.unread = 'false';
        const dot = row.querySelector('.unread-dot');
        if(dot) dot.remove();
      });
    });
  }
})();

// ---- LOG OUT (Settings page button) ----
// Mirrors the same behavior as the app-shell sidebar's #logoutBtn in script.js:
// no backend/session logic yet, just sends the user back to the login page.
document.querySelectorAll('.logout-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    window.location.href = 'login.html';
  });
});