// =====================================================
// SEARCH RESULTS PAGE FUNCTIONALITY
// Displays fuzzy-matched search results from all products
// =====================================================

let allProducts = [];
let filteredProducts = [];
let currentView = 'grid';

// Calculate match score based on character overlap (40% threshold)
function calculateMatchScore(searchQuery, productName) {
  const query = searchQuery.toLowerCase();
  const name = productName.toLowerCase();
  
  if (!query || !name) return 0;
  
  // Count matching characters
  let matchedChars = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < name.length && queryIndex < query.length; i++) {
    if (name[i] === query[queryIndex]) {
      matchedChars++;
      queryIndex++;
    }
  }
  
  // Calculate percentage of query that was matched
  const matchPercentage = (matchedChars / query.length) * 100;
  
  // Return score only if at least 40% of the query was found
  if (matchPercentage >= 40) {
    // Score is based on:
    // 1. How much of the query was matched (higher is better)
    // 2. How early in the string the matches started (prefer early matches)
    // 3. Whether query appears as a substring (bonus)
    let score = matchPercentage;
    
    // Bonus if query is a contiguous substring
    if (name.includes(query)) {
      score += 50;
    }
    
    // Bonus if query matches at the start
    if (name.startsWith(query)) {
      score += 30;
    }
    
    // Bonus for word boundaries
    const words = name.split(/[\s\-_]/);
    if (words.some(word => word.startsWith(query))) {
      score += 20;
    }
    
    return score;
  }
  
  return 0; // Below 40% threshold
}

// Fetch all products and apply search filter
async function loadSearchResults() {
  const query = sessionStorage.getItem('searchQuery') || '';
  
  if (!query.trim()) {
    document.getElementById('noResults').style.display = 'block';
    document.getElementById('searchGrid').style.display = 'none';
    return;
  }

  try {
    // Try API first, fallback to JSON file
    let data;
    try {
      const response = await fetch('http://localhost:5000/api/products');
      data = { products: await response.json() };
    } catch (apiError) {
      // Fallback to static JSON file if API fails
      const response = await fetch('admin-dashboard/server/data/db.json');
      data = await response.json();
    }
    
    // Score all products
    const scoredProducts = data.products.map(product => ({
      ...product,
      matchScore: calculateMatchScore(query, product.title)
    }));
    
    // Filter products with score > 0 (40% match or better)
    filteredProducts = scoredProducts
      .filter(p => p.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore); // Sort by score descending
    
    allProducts = filteredProducts;
    
    // Update header
    document.getElementById('searchTitle').textContent = `Search Results for "${query}"`;
    document.getElementById('resultCount').textContent = filteredProducts.length;
    
    if (filteredProducts.length === 0) {
      document.getElementById('searchGrid').style.display = 'none';
      document.getElementById('noResults').style.display = 'block';
    } else {
      document.getElementById('noResults').style.display = 'none';
      document.getElementById('searchGrid').style.display = 'grid';
      renderProducts();
    }
  } catch (error) {
    console.error('Error loading search results:', error);
    document.getElementById('noResults').style.display = 'block';
    document.getElementById('searchGrid').style.display = 'none';
  }
}

// Render products to grid with current sort/view
function renderProducts() {
  const searchGrid = document.getElementById('searchGrid');
  searchGrid.innerHTML = '';
  
  // Apply current sort
  let sortedProducts = [...filteredProducts];
  applySort(sortedProducts);
  
  sortedProducts.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = `product-card shop-product ${currentView === 'list' ? 'list-view' : ''}`;
    productCard.innerHTML = `
      <div class="img-box">
        <img src="${product.imageUrl}" alt="${product.title}">
        <div class="verified-badge">✓ Verified</div>
      </div>
      <div class="product-info">
        <div class="price-tag">$${product.price}</div>
        <h3>${product.title}</h3>
        <p class="product-description">${product.description || 'Premium quality product'}</p>
        <div class="product-meta">
          <span class="location">📍 Available</span>
          <span class="rating">⭐⭐⭐⭐⭐ (5)</span>
        </div>
        <button class="add-to-cart" data-product-id="${product._id}" data-product-name="${product.title}" data-product-price="${product.price}" data-product-image="${product.imageUrl}" data-product-description="${product.description || ''}">Add to Cart</button>
      </div>
    `;
    
    // Add click to open modal
    productCard.addEventListener('click', (e) => {
      if (!e.target.closest('.add-to-cart')) {
        openProductModal(product);
      }
    });
    
    searchGrid.appendChild(productCard);
  });

  // Attach add-to-cart listeners
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      addToCart(this);
    });
  });
}

// Open product detail modal
function openProductModal(product) {
  const modal = document.getElementById('detailModal');
  document.getElementById('detailProductName').textContent = product.title;
  document.getElementById('detailProductPrice').textContent = `$${product.price}`;
  document.getElementById('detailProductImage').src = product.imageUrl;
  document.getElementById('detailProductDesc').textContent = product.description || 'Premium quality product';
  document.getElementById('detailQuantity').value = 1;
  
  document.getElementById('detailAddToCart').dataset.productId = product._id;
  document.getElementById('detailAddToCart').dataset.productName = product.title;
  document.getElementById('detailAddToCart').dataset.productPrice = product.price;
  document.getElementById('detailAddToCart').dataset.productImage = product.imageUrl;
  document.getElementById('detailAddToCart').dataset.productDescription = product.description || '';
  
  modal.style.display = 'block';
}

// Close modal
function closeProductModal() {
  document.getElementById('detailModal').style.display = 'none';
}

// Add to cart function
function addToCart(btn) {
  const productId = btn.dataset.productId;
  const productName = btn.dataset.productName;
  const productPrice = parseFloat(btn.dataset.productPrice);
  const productImage = btn.dataset.productImage;
  const quantity = parseInt(document.getElementById('detailQuantity')?.value || 1);

  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: productId,
      name: productName,
      price: productPrice,
      image: productImage,
      quantity: quantity
    });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay();
  closeProductModal();
  
  // Show feedback
  btn.textContent = '✓ Added!';
  setTimeout(() => { btn.textContent = 'Add to Cart'; }, 1500);
}

// Apply sort to products array
function applySort(products) {
  const sortValue = document.getElementById('sortSelect').value;
  
  switch(sortValue) {
    case 'price-low':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'name':
      products.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'relevance':
    default:
      // Keep current sort by match score (already sorted)
      break;
  }
}

// Update cart display
function updateCartDisplay() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  document.getElementById('cartCount').textContent = cart.length;
  
  const cartItems = document.getElementById('cartItems');
  cartItems.innerHTML = '';
  
  let total = 0;
  cart.forEach(item => {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>$${item.price} x ${item.quantity}</p>
      </div>
      <button class="cart-item-remove" data-id="${item.id}">✕</button>
    `;
    cartItems.appendChild(cartItem);
    total += item.price * item.quantity;
  });
  
  document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
  
  // Attach remove listeners
  document.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', function() {
      removeFromCart(this.dataset.id);
    });
  });
}

// Remove from cart
function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay();
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu
  const hamburger = document.getElementById('hamburger');
  const sidebarMenu = document.getElementById('sidebarMenu');
  const sidebarClose = document.getElementById('sidebarClose');
  
  hamburger?.addEventListener('click', () => {
    sidebarMenu?.classList.add('active');
  });
  
  sidebarClose?.addEventListener('click', () => {
    sidebarMenu?.classList.remove('active');
  });
  
  // Load search results
  loadSearchResults();
  updateCartDisplay();
  
  // Hamburger menu toggle
  if (hamburger && sidebarMenu) {
    hamburger.addEventListener("click", () => {
      sidebarMenu.classList.add("open");
      hamburger.classList.add("open");
    });
  }
  
  if (sidebarClose && sidebarMenu) {
    sidebarClose.addEventListener("click", () => {
      sidebarMenu.classList.remove("open");
      hamburger.classList.remove("open");
    });
  }
  
  // Close sidebar when clicking on a link
  document.querySelectorAll(".sidebar-links a").forEach(link => {
    link.addEventListener("click", () => {
      sidebarMenu.classList.remove("open");
      if (hamburger) hamburger.classList.remove("open");
    });
  });
  
  // View toggle
  document.getElementById('gridViewBtn').addEventListener('click', function() {
    currentView = 'grid';
    document.getElementById('gridViewBtn').classList.add('active');
    document.getElementById('listViewBtn').classList.remove('active');
    document.getElementById('searchGrid').classList.remove('list-view');
    renderProducts();
  });
  
  document.getElementById('listViewBtn').addEventListener('click', function() {
    currentView = 'list';
    document.getElementById('listViewBtn').classList.add('active');
    document.getElementById('gridViewBtn').classList.remove('active');
    document.getElementById('searchGrid').classList.add('list-view');
    renderProducts();
  });
  
  // Sort dropdown
  document.getElementById('sortSelect').addEventListener('change', renderProducts);
  
  // Modal close button
  document.querySelector('.modal-close').addEventListener('click', closeProductModal);
  
  // Modal overlay click to close
  document.querySelector('.modal-overlay').addEventListener('click', closeProductModal);
  
  // Detail add to cart
  document.getElementById('detailAddToCart').addEventListener('click', function(e) {
    e.stopPropagation();
    addToCart(this);
  });
  
  // Cart sidebar
  document.getElementById('cartBtn').addEventListener('click', () => {
    document.getElementById('cartSidebar').classList.add('active');
  });
  
  document.getElementById('closeCart').addEventListener('click', () => {
    document.getElementById('cartSidebar').classList.remove('active');
  });
  
  // Checkout button
  document.getElementById('checkoutBtn').addEventListener('click', () => {
    window.location.href = 'checkout.html';
  });
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.documentElement.style.colorScheme = 
        document.documentElement.style.colorScheme === 'dark' ? 'light' : 'dark';
    });
  }
  
  // Initialize navbar search
  initNavbarSearch();
  initSidebarSearch();
});

// Initialize navbar search (from search.js)
function initNavbarSearch() {
  const searchToggle = document.getElementById("searchToggle");
  const searchDropdown = document.getElementById("searchDropdown");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  
  if (!searchToggle || !searchDropdown) return;
  
  searchToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isVisible = searchDropdown.classList.toggle("active");
    if (isVisible) {
      searchInput?.focus();
    }
  });
  
  document.addEventListener("click", (e) => {
    if (searchDropdown && !searchDropdown.contains(e.target) && searchToggle && !searchToggle.contains(e.target)) {
      searchDropdown.classList.remove("active");
    }
  });
  
  searchBtn?.addEventListener("click", performNavbarSearch);
  searchInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performNavbarSearch();
    }
  });
  
  function performNavbarSearch() {
    const query = searchInput?.value?.trim();
    if (query) {
      sessionStorage.setItem('searchQuery', query);
      window.location.href = 'search-results.html';
    }
  }
}

// Initialize sidebar search
function initSidebarSearch() {
  const sidebarSearchBtn = document.getElementById("sidebarSearch");
  const sidebarSearchContainer = document.getElementById("sidebarSearchContainer");
  const sidebarSearchInput = document.getElementById("sidebarSearchInput");
  const sidebarSearchGo = document.getElementById("sidebarSearchGo");
  
  if (!sidebarSearchBtn || !sidebarSearchContainer) return;
  
  sidebarSearchGo?.addEventListener("click", performSidebarSearch);
  sidebarSearchInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSidebarSearch();
    }
  });
  
  function performSidebarSearch() {
    const query = sidebarSearchInput?.value?.trim();
    if (query) {
      sessionStorage.setItem('searchQuery', query);
      window.location.href = 'search-results.html';
    }
  }
}