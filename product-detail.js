// Product detail modal handler
(function() {
  let currentProduct = null;

  // Initialize the modal when DOM is ready
  function initProductDetail() {
    const modal = document.getElementById('productDetailModal');
    if (!modal) {
      // Modal doesn't exist yet, will try again later
      return;
    }

    const closeBtn = document.getElementById('closeProductDetail');
    const overlay = document.getElementById('overlay');

    // Close modal when close button clicked
    if (closeBtn && !closeBtn._hasListener) {
      closeBtn.addEventListener('click', closeProductDetail);
      closeBtn._hasListener = true;
    }

    // Close modal when overlay clicked (but not if cart sidebar or other modals are open)
    if (overlay && !overlay._hasDetailListener) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && modal.classList && modal.classList.contains('active')) {
          closeProductDetail();
        }
      });
      overlay._hasDetailListener = true;
    }
  }

  // Attach click listeners to all product items on the page
  window.attachProductClickListeners = function() {
    // For dynamic pages it's more robust to use event delegation on the document.
    // This avoids race conditions where product elements are rendered after listeners are attached.
    if (window._productDetailDelegationAttached) return;

    const handleProductClick = (e) => {
      try {
        // guard to ensure modal exists (some pages may load scripts in different order)
        initProductDetail();
      } catch (err) {
        console.warn('product-detail: initProductDetail failed', err);
      }
      try {
      // debug: report click target briefly
      // (these logs help trace why modal may not open; safe to remove later)
      console.debug && console.debug('product-detail: click on', e.target && (e.target.className || e.target.tagName));
      // Ignore clicks on add-to-cart / cart controls
      if (e.target.closest('.add-to-cart') ||
          e.target.closest('.add-to-cart-btn') ||
          e.target.closest('.cart-controls') ||
          e.target.closest('.checkout-btn') ||
          e.target.closest('.cart-icon-btn')) {
        console.debug && console.debug('product-detail: click inside cart/add controls, ignoring');
        return;
      }

      // Find the nearest product container by known selectors
      const productEl = e.target.closest('.product-item, .shop-product, .product-card');
      if (!productEl) {
        console.debug && console.debug('product-detail: clicked outside product container');
        return;
      }

      // Try to find title and price from different possible structures
      let titleEl = productEl.querySelector('.product-title') ||
                    productEl.querySelector('.product-name') ||
                    productEl.querySelector('h3') ||
                    productEl.querySelector('.title');

      let priceEl = productEl.querySelector('.prod-price') ||
                    productEl.querySelector('.price-tag') ||
                    productEl.querySelector('.price');

      const imgEl = productEl.querySelector('img');

      if (!titleEl || !priceEl) {
        // If product data is stored in data- attributes (shop.html), try those
        const dataName = productEl.dataset?.productName || productEl.getAttribute('data-product-name');
        const dataPrice = productEl.dataset?.productPrice || productEl.getAttribute('data-product-price');
        if (!titleEl && dataName) {
          titleEl = { textContent: dataName };
        }
        if (!priceEl && dataPrice) {
          priceEl = { textContent: dataPrice };
        }
      }

      if (!titleEl || !priceEl) {
        console.debug && console.debug('product-detail: missing title or price after fallbacks', {
          titleElExists: !!titleEl,
          priceElExists: !!priceEl,
          dataName: productEl.dataset?.productName,
          dataPrice: productEl.dataset?.productPrice
        });
        return;
      }

      // Try to read a product-specific description from DOM or data- attributes
      const descEl = productEl.querySelector('.product-description');
      const dataDesc = productEl.dataset?.productDescription || productEl.getAttribute('data-product-description');
      const descText = (descEl && (descEl.textContent || '').trim()) || (dataDesc || '').trim();

      const product = {
        name: (titleEl.textContent || '').trim(),
        price: (priceEl.textContent || '').trim(),
        image: imgEl?.src || productEl.dataset?.productImage || productEl.getAttribute('data-product-image') || '',
        priceNum: parseFloat((priceEl.textContent || '').replace(/[^0-9.-]+/g, '')) || parseFloat(productEl.dataset?.productPrice) || 0,
        description: descText
      };

      try {
        openProductDetail(product);
      } catch (err) {
        console.error('product-detail: openProductDetail failed', err, product);
      }
      } catch (err) {
        // If any unexpected error occurs while handling the click, log and continue.
        console.error('product-detail: error handling click', err);
      }
    };

    // Attach in capture phase so product clicks are observed before other bubble-phase handlers
    try {
      document.addEventListener('click', handleProductClick, true);
      console.debug && console.debug('product-detail: delegation attached (capture)');
      window._productDetailDelegationAttached = true;
    } catch (err) {
      // fallback to normal attachment if capture not supported for any reason
      document.addEventListener('click', handleProductClick);
      console.debug && console.debug('product-detail: delegation attached (bubble fallback)');
      window._productDetailDelegationAttached = true;
    }
  };

  // Open the product detail modal
  window.openProductDetail = function(product) {
    console.log('openProductDetail called with:', product);
    currentProduct = product;
    const modal = document.getElementById('productDetailModal');
    const overlay = document.getElementById('overlay');

    // If modal is missing (page may have different markup), create a minimal modal
    let theModal = modal;
    if (!theModal) {
      try {
        const modalHtml = `
          <div class="product-detail-modal" id="productDetailModal">
            <div class="product-detail-content">
              <button class="close-detail" id="closeProductDetail" aria-label="Close">&times;</button>
              <div class="detail-image-section">
                <img id="detailProductImage" src="" alt="Product" class="detail-image">
              </div>
              <div class="detail-info-section">
                <h2 id="detailProductTitle"></h2>
                <p id="detailProductPrice" class="detail-price"></p>
                <p id="detailProductDesc" class="detail-description"></p>
                <button id="detailAddToCart" class="add-to-cart-detail">Checkout</button>
              </div>
            </div>
          </div>`;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHtml;
        document.body.appendChild(wrapper.firstElementChild);
        theModal = document.getElementById('productDetailModal');
        // re-run init to wire close button and overlay listener
        try { initProductDetail(); } catch(e) { /* ignore */ }
      } catch (err) {
        console.error('product-detail: failed to create fallback modal', err);
      }
    }

    if (!theModal) {
      console.error('product-detail: modal not available, aborting open');
      return;
    }
    console.log('Modal found or created, populating...');

    // Populate modal content
    const detailImage = document.getElementById('detailProductImage');
    const detailTitle = document.getElementById('detailProductTitle');
    const detailPrice = document.getElementById('detailProductPrice');
    const detailDesc = document.getElementById('detailProductDesc');
    const addBtn = document.getElementById('detailAddToCart');

    if (detailImage) detailImage.src = product.image;
    if (detailImage) detailImage.alt = product.name;
    if (detailTitle) detailTitle.textContent = product.name;
    if (detailPrice) detailPrice.textContent = product.price;

    // Use product-specific description when available, otherwise fall back to generic copy
    if (detailDesc) {
      if (product.description && product.description.trim().length > 0) {
        detailDesc.textContent = product.description.trim();
      } else {
        detailDesc.textContent = `Experience the latest in tech. High quality, affordable ${product.name} with excellent features and reliability.`;
      }
    }

    // Wire up the add to cart button in the modal
    if (addBtn) {
      addBtn.onclick = () => {
        console.log('Detail modal checkout clicked');
        // Navigate to checkout page
        window.location.href = 'checkout.html';
      };
    }

    // Show modal
    if (modal.classList) {
      modal.classList.add('active');
      console.log('Added active class to modal');
    }
    if (overlay && overlay.classList) {
      overlay.classList.add('active');
      console.log('Added active class to overlay');
    }
  };

  // Close the product detail modal
  window.closeProductDetail = function() {
    const modal = document.getElementById('productDetailModal');
    const overlay = document.getElementById('overlay');

    if (!modal) return;

    if (modal.classList) {
      modal.classList.remove('active');
    }
    
    // Only remove overlay active if no other modals are open
    const cartSidebar = document.getElementById('cartSidebar');
    const sidebar = document.getElementById('sidebar');
    if ((!cartSidebar || !cartSidebar.classList.contains('open')) && 
        (!sidebar || !sidebar.classList.contains('active'))) {
      if (overlay && overlay.classList) {
        overlay.classList.remove('active');
      }
    }

    currentProduct = null;
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initProductDetail();
      window.attachProductClickListeners();
    });
  } else {
    initProductDetail();
    window.attachProductClickListeners();
  }

  // Re-attach listeners when products are dynamically rendered
  // Hook into addAddToCartButtons if it exists
  if (window.addAddToCartButtons) {
    const originalAddButtons = window.addAddToCartButtons;
    window.addAddToCartButtons = function() {
      originalAddButtons.call(window);
      if (window.attachProductClickListeners) {
        window.attachProductClickListeners();
      }
    };
  }

  // Debug helper: force the modal open using the first product on the page or a sample.
  window.forceOpenProductDetail = function() {
    try {
      const productEl = document.querySelector('.product-item, .shop-product, .product-card');
      let product = null;
      if (productEl) {
        const name = productEl.dataset?.productName || productEl.querySelector('.product-title')?.textContent || productEl.querySelector('.product-name')?.textContent || productEl.querySelector('h3')?.textContent || 'Product';
        const priceText = productEl.dataset?.productPrice || productEl.querySelector('.prod-price')?.textContent || productEl.querySelector('.price-tag')?.textContent || '$0';
        const img = productEl.dataset?.productImage || productEl.querySelector('img')?.src || '';
        // description fallback: .product-description element or data attribute
        const descEl = productEl.querySelector('.product-description');
        const dataDesc = productEl.dataset?.productDescription || productEl.getAttribute('data-product-description');
        const descText = (descEl && (descEl.textContent || '').trim()) || (dataDesc || '').trim();
        product = { name: (name||'').trim(), price: (priceText||'').trim(), image: img, priceNum: parseFloat((priceText||'').replace(/[^0-9.-]+/g,'')) || 0, description: descText };
      } else {
        // fallback sample
        product = { name: 'Debug Product', price: '$19.99', image: 'images/iphone2.png', priceNum: 19.99, description: 'Sample product for debugging (no description provided by admin).'};
      }
      openProductDetail(product);
      // briefly highlight modal content for visibility while debugging
      const content = document.querySelector('.product-detail-content');
      if (content) {
        content.style.outline = '4px solid lime';
        setTimeout(() => { content.style.outline = ''; }, 4000);
      }
      console.info('forceOpenProductDetail: opened modal for', product.name);
    } catch (e) {
      console.error('forceOpenProductDetail error', e);
    }
  };
})();
