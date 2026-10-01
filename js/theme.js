// theme.js
(function () {
  const saved = localStorage.getItem('theme') || 'default';
  if (saved !== 'default') {
    document.documentElement.setAttribute('data-theme', saved);
  }
})();

function setTheme(name) {
  if (name === 'default') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', name);
  }
  localStorage.setItem('theme', name);
}