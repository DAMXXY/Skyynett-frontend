// Consolidated script for site interactions
document.addEventListener('DOMContentLoaded', () => {
  // Element refs
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const themeToggle = document.getElementById('themeToggle');
  const sidebarThemeBtn = document.getElementById('sidebarTheme');
  const cartBtn = document.getElementById('cartBtn');
  const cartSidebar = document.getElementById('cartSidebar');
  const closeCart = document.getElementById('closeCart');
  const cartItemsList = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');

  // Theme
  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      if (themeToggle) {
        themeToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.93 4.93l1.41 1.41"></path><path d="M17.66 17.66l1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M4.93 19.07l1.41-1.41"></path><path d="M17.66 6.34l1.41-1.41"></path></svg>';
      }
      if (sidebarThemeBtn) sidebarThemeBtn.innerHTML = '<i class="ti ti-sun"></i> Toggle Theme';
    } else {
      document.body.classList.remove('light-theme');
      if (themeToggle) {
        themeToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      }
      if (sidebarThemeBtn) sidebarThemeBtn.innerHTML = '<i class="ti ti-moon"></i> Toggle Theme';
    }
  }
  const savedTheme = localStorage.getItem('theme');
  applyTheme(savedTheme || 'dark');
  themeToggle?.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    const newTheme = isLight ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });
  sidebarThemeBtn?.addEventListener('click', () => themeToggle?.click());

  // Sidebar
  hamburger?.addEventListener('click', () => { sidebar?.classList.add('active'); overlay?.classList.add('active'); });
  closeSidebarBtn?.addEventListener('click', () => { sidebar?.classList.remove('active'); overlay?.classList.remove('active'); });
  overlay?.addEventListener('click', () => { sidebar?.classList.remove('active'); cartSidebar?.classList.remove('open'); overlay?.classList.remove('active'); });

  // Cart
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  function updateCartUI() {
    if (!cartItemsList) return;
    cartItemsList.innerHTML = '';
    let total = 0;
    cart.forEach((item, idx) => {
      total += (item.price || 0) * (item.quantity || 1);
      const li = document.createElement('li');
      li.innerHTML = `<span>${item.name} (${item.quantity})</span><div class="cart-controls"><button class="decrease" data-i="${idx}">-</button><button class="increase" data-i="${idx}">+</button><button class="remove" data-i="${idx}">x</button></div>`;
      cartItemsList.appendChild(li);
    });
    cartTotal && (cartTotal.textContent = total.toFixed(2));
    localStorage.setItem('cart', JSON.stringify(cart));
  }
  function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); updateCartUI(); }
  cartBtn?.addEventListener('click', () => { cartSidebar?.classList.add('open'); overlay?.classList.add('active'); });
  closeCart?.addEventListener('click', () => { cartSidebar?.classList.remove('open'); overlay?.classList.remove('active'); });
  cartItemsList?.addEventListener('click', (e) => {
    const idx = e.target?.getAttribute('data-i');
    if (idx == null) return;
    if (e.target.classList.contains('decrease')) { cart[idx].quantity = Math.max(1, cart[idx].quantity - 1); saveCart(); }
    if (e.target.classList.contains('increase')) { cart[idx].quantity = (cart[idx].quantity || 0) + 1; saveCart(); }
    if (e.target.classList.contains('remove')) { cart.splice(idx,1); saveCart(); }
  });
  updateCartUI();

  // Simple search toggle
  const searchToggle = document.getElementById('searchToggle');
  const searchDropdown = document.getElementById('searchDropdown');
  searchToggle?.addEventListener('click', (e) => { e.stopPropagation(); if (!searchDropdown) return; searchDropdown.style.display = searchDropdown.style.display === 'flex' ? 'none' : 'flex'; });
  document.addEventListener('click', (e) => { if (searchDropdown && !searchDropdown.contains(e.target) && searchToggle && !searchToggle.contains(e.target)) searchDropdown.style.display = 'none'; });

  // Categories -> Products
  const API_URL = 'http://localhost:5000/api';

  // Static categoriesData (hardcoded). Use `let` so admin-driven sync can replace it.
  let categoriesData = {
    iphones: [ 
      { name: 'iPhone 15', price: '$999', image: 'images/iphone2.png', description: 'Latest model, limited stock.' }, 
      { name: 'iPhone 15 Pro', price: '$1299', image: 'images/iphone2.png', description: 'Pro model with advanced features.' } 
    ],
    samsung: [ 
      { name: 'Galaxy S23', price: '$899', image: 'images/samsung.png', description: 'High-performance Android phone.' } 
    ],
    ipads: [ 
      { name: 'iPad Pro', price: '$1099', image: 'images/ipad.png', description: '10.2-inch, ideal for work and study.' } 
    ],
    smartwatches: [ 
      { name: 'Apple Watch Series 9', price: '$399', image: 'images/smartwatch.png', description: 'Series 9, fitness & health features.' } 
    ],
    gaming: [ 
      { name: 'PS5', price: '$499', image: 'images/console-2-preview.png', description: 'Console bundle with controller.' } 
    ],
    laptops: [ 
      { name: 'MacBook Pro', price: '$1299', image: 'images/laptops.png', description: 'Intel or Apple Silicon options.' } 
    ]
  };

  // Attach click handlers to existing category cards (static HTML)
  function attachCategoryCardListeners() {
    document.querySelectorAll('.category-card').forEach(card => {
      // avoid attaching duplicate listeners
      if (card._hasClick) return;
      card.addEventListener('click', () => showProductsForCategory(card.dataset.category));
      card._hasClick = true;
    });
  }

  // Rebuild category grid from a categories map where values are arrays of products
  function rebuildCategoryGrid(fromMap) {
    // explicit thumbnail overrides for categories (prefer these images when present)
    const thumbOverrides = {
      laptops: 'images/laptops.png',
      iphones: 'images/iphone2.png',
      samsung: 'images/samsung.png',
      ipads: 'images/ipad.png',
      smartwatches: 'images/smartwatch.png',
      gaming: 'images/console-2-preview.png'
    };
    const container = document.querySelector('.category-grid');
    if (!container) return;
    // Merge with existing cards instead of wiping them out so hardcoded items keep their styles
    const existing = Array.from(container.querySelectorAll('.category-card'));
    const existingMap = {};
    existing.forEach(card => { existingMap[card.dataset.category] = card; });

    Object.keys(fromMap).forEach(key => {
      const products = fromMap[key] || [];
      const name = key.charAt(0).toUpperCase() + key.slice(1);
      const imgSrc = thumbOverrides[key] || (products[0] && products[0].image) || `images/${key}.png`;

      if (existingMap[key]) {
        // update image and text on existing card
        const card = existingMap[key];
        const imgBox = card.querySelector('.img-box');
        if (imgBox) {
          const img = imgBox.querySelector('img');
          if (img) img.src = imgSrc;
          else imgBox.innerHTML = `<img src="${imgSrc}" alt="${name}" />`;
        } else {
          card.insertAdjacentHTML('afterbegin', `<div class="img-box"><img src="${imgSrc}" alt="${name}" /></div>`);
        }
        const h3 = card.querySelector('h3');
        if (h3) h3.textContent = name; else card.appendChild(Object.assign(document.createElement('h3'), { textContent: name }));
      } else {
        // create a new card that matches the static markup
        const card = document.createElement('div');
        card.className = 'category-card';
        card.dataset.category = key;
        const imgBox = document.createElement('div');
        imgBox.className = 'img-box';
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = name;
        imgBox.appendChild(img);
        const h3 = document.createElement('h3');
        h3.textContent = name;
        card.appendChild(imgBox);
        card.appendChild(h3);
        container.appendChild(card);
      }
    });

    // Make sure all cards have listeners
    attachCategoryCardListeners();
  }

  // Sync with backend API. If API returns categories (non-empty), treat API as authoritative and replace categoriesData.
  async function syncWithApi() {
    try {
      const res = await fetch(`${API_URL}/categories`);
      if (!res.ok) return;
      const cats = await res.json();
      if (!Array.isArray(cats) || cats.length === 0) return; // keep static data when API empty

      const newMap = {};
      for (const cat of cats) {
        const key = (cat.name || '').toLowerCase().replace(/\s+/g, '');
        try {
          const prodRes = await fetch(`${API_URL}/products/category/${cat._id}`);
          const prods = prodRes.ok ? await prodRes.json() : [];
          const mapped = prods.map(p => ({ name: p.title, price: `$${p.price}`, image: p.imageUrl || `images/${key}.png`, id: p._id, description: p.description || '' }));
          // If API supplied a category image, use it as the card image when no product image is available
          if (cat.imageUrl) {
            if (mapped.length === 0) mapped.push({ name: cat.name || key, price: '', image: cat.imageUrl });
            else mapped[0].image = mapped[0].image || cat.imageUrl;
          }
          // Normalize image URLs: if server returns a path starting with '/', prefix with API base URL
          const apiBase = API_URL.replace(/\/api\/?$/, '');
          newMap[key] = mapped.map(item => {
            if (item.image && item.image.startsWith('/')) item.image = apiBase + item.image;
            return item;
          });
        } catch (e) {
          // if fetching products failed but category has image, show a placeholder entry so category card shows image
          if (cat.imageUrl) {
            const apiBase = API_URL.replace(/\/api\/?$/, '');
            const img = cat.imageUrl.startsWith('/') ? apiBase + cat.imageUrl : cat.imageUrl;
            newMap[key] = [{ name: cat.name || key, price: '', image: img }];
          } else newMap[key] = [];
        }
      }

      // Replace local map and rebuild grid
      categoriesData = newMap;
      rebuildCategoryGrid(categoriesData);
      // reset failure counter on success
      if (typeof window !== 'undefined' && window._apiSyncFailures !== undefined) window._apiSyncFailures = 0;
    } catch (err) {
      // network errors are fine; we'll keep using static data
      console.warn('Could not sync categories from API:', err);
      // increment a global failure counter and stop polling after repeated failures
      if (typeof window !== 'undefined') {
        window._apiSyncFailures = (window._apiSyncFailures || 0) + 1;
        if (window._apiSyncFailures >= 3) {
          console.warn('syncWithApi: API unreachable after multiple attempts — stopping automatic sync. Start the API server or check API_URL.');
          try { clearInterval(window._apiSyncInterval); } catch(e) {}
        }
      }
    }
  }

  // Initialize listeners for the existing static HTML and attempt a sync
  attachCategoryCardListeners();
  // Call sync once and then poll periodically so admin changes appear on the main site
  syncWithApi();
  // keep the interval id on window so we can clear it from the catch handler above
  if (typeof window !== 'undefined') {
    window._apiSyncFailures = 0;
    window._apiSyncInterval = setInterval(syncWithApi, 3000);
  } else {
    setInterval(syncWithApi, 3000);
  }

  function showProductsForCategory(catKey) {
    const products = categoriesData[catKey] || [];
    const titleEl = document.getElementById('categoryTitle');
    const productsPage = document.getElementById('productsPage');
    const categoriesPage = document.querySelector('.categories-page');
    const grid = document.getElementById('productGrid');
    if (!grid || !productsPage || !categoriesPage) return;
    titleEl && (titleEl.textContent = (catKey || '').toUpperCase());
    grid.innerHTML = '';
    products.forEach((p) => {
      const priceNum = parseFloat(String(p.price).replace(/[^0-9.-]+/g, '')) || 0;
      const item = document.createElement('div');
      item.className = 'product-item';
      // include data attributes so product-detail delegation can always read product metadata
      item.setAttribute('data-product-name', p.name || '');
      item.setAttribute('data-product-price', (priceNum || 0).toString());
      if (p.image) item.setAttribute('data-product-image', p.image);
      // include product description if provided by admin/API so modal can display it
      if (p.description) item.setAttribute('data-product-description', p.description);
      item.innerHTML = `
        <div class="img-box"><img src="${p.image}" alt="${p.name}"></div>
        <div class="product-meta">
          <h3 class="product-title">${p.name}</h3>
          <p class="prod-price">$${priceNum.toFixed(2)}</p>
        </div>
      `;
      grid.appendChild(item);
    });

    // Let the shared cart module attach add-to-cart buttons
    if (window.addAddToCartButtons) window.addAddToCartButtons();
    
    // Attach product detail modal click listeners
    if (window.attachProductClickListeners) window.attachProductClickListeners();

    categoriesPage.classList.add('hidden');
    productsPage.classList.remove('hidden');
  }

  document.getElementById('backCategories')?.addEventListener('click', () => { document.querySelector('.categories-page')?.classList.remove('hidden'); document.getElementById('productsPage')?.classList.add('hidden'); });

  // Auto-load category or search query from homepage
  const selectedCategory = sessionStorage.getItem('selectedCategory');
  const searchQuery = sessionStorage.getItem('searchQuery');
  if (selectedCategory) {
    showProductsForCategory(selectedCategory);
    sessionStorage.removeItem('selectedCategory');
  } else if (searchQuery) {
    // Render all products from all categories, then perform search
    const titleEl = document.getElementById('categoryTitle');
    const productsPage = document.getElementById('productsPage');
    const categoriesPage = document.querySelector('.categories-page');
    const grid = document.getElementById('productGrid');
    if (grid && productsPage && categoriesPage) {
      titleEl && (titleEl.textContent = 'All Products');
      grid.innerHTML = '';
      Object.keys(categoriesData).forEach((key) => {
        const arr = categoriesData[key] || [];
        arr.forEach((p) => {
          const priceNum = parseFloat(String(p.price).replace(/[^0-9.-]+/g, '')) || 0;
          const item = document.createElement('div');
          item.className = 'product-item';
          item.setAttribute('data-product-name', p.name || '');
          item.setAttribute('data-product-price', (priceNum || 0).toString());
          if (p.image) item.setAttribute('data-product-image', p.image);
          if (p.description) item.setAttribute('data-product-description', p.description);
          item.innerHTML = `
            <div class="img-box"><img src="${p.image}" alt="${p.name}"></div>
            <div class="product-meta">
              <h3 class="product-title">${p.name}</h3>
              <p class="prod-price">$${priceNum.toFixed(2)}</p>
            </div>
          `;
          grid.appendChild(item);
        });
      });

      if (window.addAddToCartButtons) window.addAddToCartButtons();
      if (window.attachProductClickListeners) window.attachProductClickListeners();
      categoriesPage.classList.add('hidden');
      productsPage.classList.remove('hidden');

          // run the global search to highlight/navigate to results
          if (window.performSearch) window.performSearch(searchQuery, { navigateIfMissing: false, filterResults: true });
    }
    sessionStorage.removeItem('searchQuery');
  }

});
