const API_BASE_URL = "https://gds-det9.onrender.com";
let selectedCategoryId = null;

// ============= LOGIN SETUP =============
// Hardcoded credentials (for demo). In production, use server-side authentication.
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

function initializeLogin() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginError = document.getElementById('loginError');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Store auth token in sessionStorage (cleared on browser close)
      sessionStorage.setItem('adminAuth', 'true');
      // Hide login modal and show admin UI
      const loginModal = document.getElementById('loginModal');
      const adminContainer = document.querySelector('.admin-container');
      if (loginModal) loginModal.style.display = 'none';
      if (adminContainer) adminContainer.style.display = 'flex';
      // Initialize admin dashboard
      loadCategories();
      populateSidebarCategories();
    } else {
      loginError.textContent = 'Invalid username or password';
      loginError.style.display = 'block';
    }
  });
}

function checkAuth() {
  const isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
  const loginModal = document.getElementById('loginModal');
  const adminContainer = document.querySelector('.admin-container');

  if (isAuthenticated) {
    if (loginModal) loginModal.style.display = 'none';
    if (adminContainer) adminContainer.style.display = 'flex';
  } else {
    if (loginModal) loginModal.style.display = 'flex';
    if (adminContainer) adminContainer.style.display = 'none';
  }
}

// ============= DOM REFS =============
const refs = {
  categoryList: document.getElementById('categoryList'),
  productGrid: document.getElementById('productGrid'),
  addProductForm: document.getElementById('addProductForm'),
  productTitle: document.getElementById('productTitle'),
  productDescription: document.getElementById('productDescription'),
  productPrice: document.getElementById('productPrice'),
  productImage: document.getElementById('productImage'),
  imagePreview: document.getElementById('imagePreview'),
  previewImg: document.getElementById('previewImg'),
  addCategoryBtn: document.getElementById('addCategoryBtn'),
  categoryModal: document.getElementById('categoryModal'),
  closeCategoryModal: document.getElementById('closeCategoryModal'),
  addCategoryForm: document.getElementById('addCategoryForm'),
  categoryNameInput: document.getElementById('categoryName'),
  categoryImage: document.getElementById('categoryImage'),
  pageTitle: document.getElementById('pageTitle'),
  pageSubtitle: document.getElementById('pageSubtitle'),
  productCount: document.getElementById('productCount'),
  toast: document.getElementById('toast')
};

function showToast(message, type = 'success') {
  if (!refs.toast) return;
  refs.toast.textContent = message;
  refs.toast.className = `toast show ${type}`;
  setTimeout(() => {
    refs.toast.className = 'toast';
  }, 3000);
}

// Load categories from backend and populate sidebar
async function loadCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    const categories = await res.json();

    if (!refs.categoryList) {
      console.error('categoryList ref not found');
      return;
    }
    refs.categoryList.innerHTML = '';

    if (!categories || categories.length === 0) {
      refs.categoryList.innerHTML = '<p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 10px 0;">No categories yet</p>';
      return;
    }

    categories.forEach(cat => {
      const row = document.createElement('div');
      row.className = 'category-row';
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.marginBottom = '6px';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'category-btn';
      btn.innerHTML = `<i class="fas fa-tag"></i> ${cat.name}`;
      btn.dataset.id = cat._id;
      btn.style.flex = '1';
      btn.style.marginRight = '8px';
      btn.addEventListener('click', () => selectCategory(cat._id, cat.name, btn));

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'small-btn edit-cat';
      editBtn.title = 'Edit';
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener('click', (e) => { e.stopPropagation(); editCategory(cat._id, cat.name); });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'small-btn delete-cat';
      delBtn.title = 'Delete';
      delBtn.innerHTML = '<i class="fas fa-trash"></i>';
      delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteCategoryApi(cat._id); });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      row.appendChild(btn);
      row.appendChild(actions);
      refs.categoryList.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    showToast('Failed to load categories', 'error');
  }
}

// When user selects a category
async function selectCategory(categoryId, categoryName, btnEl) {
  selectedCategoryId = categoryId;
  // mark active
  document.querySelectorAll('#categoryList button').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');

  // update heading
  if (refs.pageTitle) refs.pageTitle.textContent = `${categoryName}`;
  if (refs.pageSubtitle) refs.pageSubtitle.textContent = 'Manage products in this category';

  await loadProducts(categoryId);
}

// Load products for a category
async function loadProducts(categoryId) {
  try {
    const res = await fetch(`${API_URL}/products/category/${categoryId}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const products = await res.json();

    if (!refs.productGrid) return;
    refs.productGrid.innerHTML = '';
    if (refs.productCount) refs.productCount.textContent = `${products.length} item${products.length !== 1 ? 's' : ''}`;

    if (!products.length) {
      refs.productGrid.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No products in this category yet.</p></div>';
      return;
    }

    products.forEach(p => {
      const div = document.createElement('div');
      div.className = 'product-item';
      div.innerHTML = `
        <img src="${p.imageUrl}" alt="${p.title}">
        <div class="product-info">
          <h3 title="${p.title}">${p.title}</h3>
          <p title="${p.description}">${p.description}</p>
          <div class="product-price">$${p.price}</div>
          <button type="button" class="delete-btn" data-id="${p._id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
      `;
      div.querySelector('.delete-btn').addEventListener('click', () => deleteProduct(p._id));
      refs.productGrid.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    showToast('Failed to load products', 'error');
  }
}

// Delete product and refresh
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    const res = await fetch(`${API_URL}/products/${productId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    showToast('Product deleted', 'success');
    await loadProducts(selectedCategoryId);
  } catch (err) {
    console.error(err);
    showToast('Failed to delete product', 'error');
  }
}

// Upload image as base64 (temporary) - returns data URL
function uploadImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Image read error'));
    reader.readAsDataURL(file);
  });
}

// Add product form handler
if (refs.addProductForm) {
  refs.addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedCategoryId) { showToast('Please select a category first', 'error'); return; }

    const title = refs.productTitle.value.trim();
    const description = refs.productDescription.value.trim();
    const price = parseFloat(refs.productPrice.value);
    const file = refs.productImage.files[0];

    if (!file) { showToast('Please choose an image', 'error'); return; }

    try {
      let res;
      // If a file is present, send multipart/form-data so server stores the file
      if (file) {
        const fd = new FormData();
        fd.append('categoryId', selectedCategoryId);
        fd.append('title', title);
        fd.append('description', description);
        fd.append('price', String(price));
        fd.append('image', file);
        res = await fetch(`${API_URL}/products`, { method: 'POST', body: fd });
      } else {
        // fallback (shouldn't happen because we require a file), send JSON
        const imageUrl = await uploadImageAsDataUrl(file);
        res = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId: selectedCategoryId, title, description, price, imageUrl })
        });
      }
      if (!res.ok) throw new Error('Failed to create product');
      showToast('Product added', 'success');
      refs.addProductForm.reset();
      if (refs.imagePreview) refs.imagePreview.style.display = 'none';
      await loadProducts(selectedCategoryId);
    } catch (err) {
      console.error(err);
      showToast('Failed to add product', 'error');
    }
  });
}

// Image preview handling
if (refs.productImage) {
  refs.productImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (refs.previewImg) refs.previewImg.src = ev.target.result;
      if (refs.imagePreview) refs.imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
    // update label if exists
    const label = document.querySelector('.file-label');
    if (label) label.textContent = `✓ ${file.name}`;
  });
}

// Category modal wiring
if (refs.addCategoryBtn && refs.categoryModal && refs.closeCategoryModal && refs.addCategoryForm) {
  refs.addCategoryBtn.addEventListener('click', async () => {
    refs.categoryModal.style.display = 'flex';
    await populateSidebarCategories();
  });
  refs.closeCategoryModal.addEventListener('click', () => refs.categoryModal.style.display = 'none');
  refs.categoryModal.addEventListener('click', (e) => { if (e.target === refs.categoryModal) refs.categoryModal.style.display = 'none'; });

  refs.addCategoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = refs.categoryNameInput.value.trim();
    if (!name) { showToast('Enter a category name', 'error'); return; }

    try {
      // If an image file is provided, submit as multipart/form-data so server stores the file
      const file = refs.categoryImage && refs.categoryImage.files && refs.categoryImage.files[0];
      let res;
      if (file) {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('image', file);
        res = await fetch(`${API_URL}/categories`, { method: 'POST', body: fd });
      } else {
        // no file -> send JSON
        res = await fetch(`${API_URL}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
      }
      if (!res.ok) throw new Error('Create category failed');
      showToast('Category created', 'success');
      refs.addCategoryForm.reset();
      refs.categoryModal.style.display = 'none';
      await loadCategories();
      // refresh the sidebar existing categories list
      populateSidebarCategories();
    } catch (err) {
      console.error(err);
      showToast('Failed to create category', 'error');
    }
  });
}
// Edit category (prompt + API)
async function editCategory(id, currentName) {
  const newName = prompt('Rename category', currentName);
  if (!newName || newName.trim() === '' || newName.trim() === currentName) return;
  try {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() })
    });
    if (!res.ok) throw new Error('Update failed');
    showToast('Category updated', 'success');
    await loadCategories();
    await populateSidebarCategories();
    // if current selected, update title
    if (selectedCategoryId === id && refs.pageTitle) refs.pageTitle.textContent = newName.trim();
  } catch (err) {
    console.error('editCategory error', err);
    showToast('Failed to update category', 'error');
  }
}

// Delete category via API
async function deleteCategoryApi(id) {
  if (!confirm('Delete this category? This will remove its products as well.')) return;
  try {
    const res = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    showToast('Category deleted', 'success');
    // if deleted category was selected, clear selection
    if (selectedCategoryId === id) {
      selectedCategoryId = null;
      if (refs.pageTitle) refs.pageTitle.textContent = 'Welcome to Admin Dashboard';
      if (refs.pageSubtitle) refs.pageSubtitle.textContent = 'Select a category to manage products';
      if (refs.productGrid) refs.productGrid.innerHTML = '';
    }
    await loadCategories();
    await populateSidebarCategories();
  } catch (err) {
    console.error('deleteCategoryApi error', err);
    showToast('Failed to delete category', 'error');
  }
}
// Populate existing categories into the sidebar area below the Add Category button
async function populateSidebarCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    const categories = await res.json();
    const container = document.getElementById('existingCategories');
    if (!container) {
      console.warn('existingCategories container not found in modal');
      return;
    }
    container.innerHTML = '';
    if (!categories || categories.length === 0) {
      container.innerHTML = '<div style="color:rgba(255,255,255,0.6); font-size:13px; padding:8px;">No categories yet</div>';
      return;
    }

    categories.forEach(cat => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '6px 4px';
      row.style.borderBottom = '1px solid rgba(255,255,255,0.03)';

      const nameEl = document.createElement('div');
      nameEl.textContent = cat.name;
      nameEl.style.flex = '1';
      nameEl.style.cursor = 'pointer';
      nameEl.addEventListener('click', () => {
        const sidebarBtn = document.querySelector(`#categoryList button[data-id=\"${cat._id}\"]`);
        if (sidebarBtn) sidebarBtn.click(); else selectCategory(cat._id, cat.name, nameEl);
      });

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'small-btn edit-cat';
      editBtn.title = 'Edit';
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener('click', (e) => { e.stopPropagation(); editCategory(cat._id, cat.name); });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'small-btn delete-cat';
      delBtn.title = 'Delete';
      delBtn.innerHTML = '<i class="fas fa-trash"></i>';
      delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteCategoryApi(cat._id); });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      row.appendChild(nameEl);
      row.appendChild(actions);
      container.appendChild(row);
    });
  } catch (err) {
    console.error('populateSidebarCategories error', err);
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initializeLogin();
  // Admin dashboard will load after successful login
});