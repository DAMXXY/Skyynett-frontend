// =====================
// SEARCH FUNCTIONALITY
// Handles search across all pages with real product filtering
// =====================

// Get all products from the page (both index and categories pages)
function getAllProducts() {
  const products = [];
  
  // Get products from index.html (Best Sellers section)
  document.querySelectorAll(".product-item").forEach((item) => {
    const titleEl = item.querySelector(".product-title");
    const priceEl = item.querySelector(".prod-price");
    if (titleEl && priceEl) {
      products.push({
        name: titleEl.textContent.trim(),
        price: priceEl.textContent.trim(),
        element: item
      });
    }
  });
  
  return products;
}

// Search products and highlight/filter
function searchProducts(query) {
  if (!query || query.length < 1) return;
  
  const allProducts = getAllProducts();
  const results = allProducts.filter(product => 
    product.name.toLowerCase().includes(query.toLowerCase())
  );
  
  return results;
}

// Render a results list into a container (dropdown or sidebar). Each item has a quick-jump.
function renderSearchResults(results, container, query) {
  if (!container) return;

  // find or create results wrapper
  let wrapper = container.querySelector('.search-results');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'search-results';
    container.appendChild(wrapper);
  }

  // header
  wrapper.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'search-results-header';
  header.textContent = `Results for "${query}" (${results.length})`;
  wrapper.appendChild(header);

  const list = document.createElement('ul');
  list.className = 'search-results-list';

  const max = Math.min(results.length, 8);
  for (let i = 0; i < max; i++) {
    const r = results[i];
    const li = document.createElement('li');
    li.className = 'search-result-item';

    const info = document.createElement('div');
    info.className = 'result-info';
    const name = document.createElement('div');
    name.className = 'result-name';
    name.textContent = r.name;
    const price = document.createElement('div');
    price.className = 'result-price';
    price.textContent = r.price || '';
    info.appendChild(name);
    info.appendChild(price);

    const go = document.createElement('button');
    go.className = 'result-go';
    go.type = 'button';
    go.textContent = 'Go';
    go.addEventListener('click', (e) => {
      e.stopPropagation();
      if (r.element) {
        r.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        r.element.style.border = '2px solid var(--primary)';
        setTimeout(() => { r.element.style.border = ''; }, 2000);
      }
      // close dropdown if applicable
      if (container.classList.contains('search-dropdown')) container.classList.remove('active');
    });

    li.appendChild(info);
    li.appendChild(go);

    // clicking the whole item should also navigate
    li.addEventListener('click', () => go.click());

    list.appendChild(li);
  }

  wrapper.appendChild(list);

  // If there are more results, add a "See all" button that navigates to search-results with query
  if (results.length > max) {
    const more = document.createElement('div');
    more.className = 'search-results-more';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `Show all ${results.length} results`;
    btn.addEventListener('click', () => {
      sessionStorage.setItem('searchQuery', query);
      window.location.href = 'search-results.html';
    });
    more.appendChild(btn);
    wrapper.appendChild(more);
  }
}

// Perform a search programmatically. If no results on this page, optionally navigate
// to the categories page and pass the query there via sessionStorage so the categories
// page can render products and run the search.
function performSearch(query, options = { navigateIfMissing: true, filterResults: false, container: null }) {
  if (!query || !query.trim()) return [];
  const results = searchProducts(query);

  if (results && results.length > 0) {
    // If caller provided a container, render full result list there.
    if (options.container) {
      renderSearchResults(results, options.container, query);
    }

    // If filterResults is requested, hide non-matching products on page
    if (options.filterResults) {
      const allProducts = getAllProducts();
      const matchNames = new Set(results.map(r => r.name));
      allProducts.forEach(p => {
        if (matchNames.has(p.name)) {
          p.element.style.display = '';
        } else {
          p.element.style.display = 'none';
        }
      });
      // Scroll to first matching element
      results[0].element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      results[0].element.style.border = '2px solid var(--primary)';
      setTimeout(() => { results[0].element.style.border = ''; }, 2000);
    } else {
      // Scroll and highlight first result by default
      results[0].element.scrollIntoView({ behavior: "smooth", block: "center" });
      results[0].element.style.border = "2px solid var(--primary)";
      setTimeout(() => { results[0].element.style.border = ""; }, 2000);
    }
    return results;
  }

  // If nothing found here and navigation is allowed, send user to search-results page
  if (options.navigateIfMissing) {
    // If already on search-results page, just alert; otherwise navigate to search-results
    const current = window.location.pathname.split('/').pop();
    if (current !== 'search-results.html') {
      sessionStorage.setItem('searchQuery', query);
      window.location.href = 'search-results.html';
      return [];
    } else {
      // On search-results page but no results: alert user
      alert(`No products found matching "${query}"`);
      return [];
    }
  }

  return [];
}

// Expose performSearch globally for other scripts to call
window.performSearch = performSearch;

// Initialize navbar search
function initNavbarSearch() {
  const searchToggle = document.getElementById("searchToggle");
  const searchDropdown = document.getElementById("searchDropdown");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  
  if (!searchToggle || !searchDropdown) return;
  
  // Toggle dropdown visibility
  searchToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isVisible = searchDropdown.classList.toggle("active");
    if (isVisible) {
      searchInput?.focus();
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (searchDropdown && !searchDropdown.contains(e.target) && searchToggle && !searchToggle.contains(e.target)) {
      searchDropdown.classList.remove("active");
    }
  });
  
  // Handle search button click
  searchBtn?.addEventListener("click", performNavbarSearch);
  
  // Handle Enter key in search input
  searchInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performNavbarSearch();
    }
  });
  
  function performNavbarSearch() {
    const query = searchInput?.value?.trim();
    if (query) {
      // Use global performSearch which will navigate to categories page if needed
      const results = window.performSearch ? window.performSearch(query, { navigateIfMissing: true, container: searchDropdown }) : searchProducts(query);
      // keep dropdown open to show results if any
      if (results && results.length > 0) {
        // ensure dropdown visible
        searchDropdown.classList.add('active');
      }
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
  
  // Toggle search container
  sidebarSearchBtn.addEventListener("click", () => {
    const isVisible = sidebarSearchContainer.classList.toggle("active");
    if (isVisible) {
      sidebarSearchInput?.focus();
    }
  });
  
  // Handle search button click
  sidebarSearchGo?.addEventListener("click", performSidebarSearch);
  
  // Handle Enter key in search input
  sidebarSearchInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSidebarSearch();
    }
  });
  
  function performSidebarSearch() {
    const query = sidebarSearchInput?.value?.trim();
    if (query) {
      const results = window.performSearch ? window.performSearch(query, { navigateIfMissing: true, container: sidebarSearchContainer }) : searchProducts(query);
      if (results && results.length > 0) {
        // keep container open so results are visible (sidebar-based)
        sidebarSearchContainer.classList.add('active');
      }
    } else {
      alert("Please enter a search term.");
    }
  }
}

// Initialize search on page load
document.addEventListener("DOMContentLoaded", () => {
  initNavbarSearch();
  initSidebarSearch();
});
