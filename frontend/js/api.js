const API = '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showAlert(el, msg, type = 'success') {
  el.className = `alert alert-${type} show`;
  el.textContent = msg;
  setTimeout(() => el.classList.remove('show'), 4000);
}

function stockBadge(stock) {
  if (stock === 0) return `<span class="badge badge-danger">Out of Stock</span>`;
  if (stock <= 5) return `<span class="badge badge-warning">Low Stock (${stock})</span>`;
  return `<span class="badge badge-success">In Stock (${stock})</span>`;
}

function activeBadge(active) {
  return active
    ? `<span class="badge badge-success">Active</span>`
    : `<span class="badge badge-danger">Inactive</span>`;
}

function formatCurrency(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d) {
  if (!d) return '';
  const dateStr = typeof d === 'string' ? d.split('T')[0] : d;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function setNavActive() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    a.classList.toggle('active', href === path);
  });
}

document.addEventListener('DOMContentLoaded', setNavActive);
