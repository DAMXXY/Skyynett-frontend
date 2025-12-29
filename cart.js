// =====================
// SHARED CART FUNCTIONALITY
// Handles cart operations across all pages (index.html, categories.html)
// =====================

let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function getCartElements() {
  return {
    cartBtn: document.getElementById("cartBtn"),
    cartSidebar: document.getElementById("cartSidebar"),
    closeCart: document.getElementById("closeCart"),
    cartItemsList: document.getElementById("cartItems"),
    cartCount: document.getElementById("cartCount"),
    cartTotal: document.getElementById("cartTotal"),
    overlay: document.getElementById("overlay"),
    checkoutBtn: document.getElementById("checkoutBtn")
  };
}

function updateCartUI() {
  const { cartItemsList, cartTotal, cartCount } = getCartElements();
  if (!cartItemsList) return;
  
  cartItemsList.innerHTML = "";
  let total = 0;
  let itemCount = 0;
  
  if (cart.length === 0) {
    cartItemsList.innerHTML = "<li style='text-align:center; padding:20px; color:#999;'>Your cart is empty</li>";
    cartTotal && (cartTotal.textContent = "0.00");
    cartCount && (cartCount.textContent = "0");
    return;
  }
  
  cart.forEach((item, index) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    total += itemTotal;
    itemCount += item.quantity || 1;
    
    const li = document.createElement("li");
    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <div>
          <strong>${item.name}</strong><br/>
          <small>$${(item.price || 0).toFixed(2)} × ${item.quantity || 1} = $${itemTotal.toFixed(2)}</small>
        </div>
        <div class="cart-controls" style="display:flex; gap:5px;">
          <button class="decrease" data-index="${index}" style="padding:4px 8px; font-size:12px;"><i class="fas fa-minus"></i></button>
          <span style="min-width:20px; text-align:center;">${item.quantity || 1}</span>
          <button class="increase" data-index="${index}" style="padding:4px 8px; font-size:12px;"><i class="fas fa-plus"></i></button>
          <button class="remove" data-index="${index}" style="padding:4px 8px; font-size:12px; color:#e74c3c;"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
    cartItemsList.appendChild(li);
  });
  
  cartTotal && (cartTotal.textContent = total.toFixed(2));
  if (cartCount) {
    cartCount.textContent = itemCount;
    cartCount.style.display = itemCount > 0 ? "inline-block" : "none";
  }
  localStorage.setItem("cart", JSON.stringify(cart));
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
}

function initializeCart() {
  const { cartBtn, cartSidebar, closeCart, cartItemsList, checkoutBtn, overlay } = getCartElements();
  
  // Cart sidebar open/close
  cartBtn?.addEventListener("click", () => {
    cartSidebar?.classList.add("open");
    overlay?.classList.add("active");
  });
  
  function closeCartSidebar() {
    cartSidebar?.classList.remove("open");
    overlay?.classList.remove("active");
  }
  
  closeCart?.addEventListener("click", closeCartSidebar);
  
  // Cart controls delegation (increase, decrease, remove)
  cartItemsList?.addEventListener("click", (e) => {
    const index = parseInt(e.target.closest("button")?.dataset?.index, 10);
    if (isNaN(index)) return;
    
    if (e.target.closest(".increase")) {
      cart[index].quantity++;
    } else if (e.target.closest(".decrease")) {
      if (cart[index].quantity > 1) {
        cart[index].quantity--;
      } else {
        cart.splice(index, 1);
      }
    } else if (e.target.closest(".remove")) {
      cart.splice(index, 1);
    }
    saveCart();
  });
  
  // Checkout
  checkoutBtn?.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemList = cart.map(item => `${item.name} (×${item.quantity})`).join(", ");
    alert(`Order placed!\n\nItems: ${itemList}\nTotal: $${total.toFixed(2)}\n\nThank you for your purchase!`);
    cart = [];
    saveCart();
    closeCartSidebar();
  });
  
  updateCartUI();
}

function addToCart(name, price) {
  const existingItem = cart.find((p) => p.name === name);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  saveCart();
}

function addAddToCartButtons() {
  // Add buttons to product items (index.html)
  document.querySelectorAll(".product-item").forEach((productEl) => {
    const titleEl = productEl.querySelector(".product-title");
    const priceEl = productEl.querySelector(".prod-price");
    
    if (titleEl && priceEl && !productEl.querySelector(".add-to-cart-btn")) {
      const addBtn = document.createElement("button");
      addBtn.className = "add-to-cart-btn";
      addBtn.textContent = "Add to Cart";
      
      addBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const name = titleEl.textContent.trim();
        const priceText = priceEl.textContent.replace(/[^\d.]/g, "");
        const price = parseFloat(priceText) || 0;
        
        addToCart(name, price);
        
        // Show feedback
        addBtn.textContent = "Added!";
        addBtn.style.background = "#27ae60";
        setTimeout(() => {
          addBtn.textContent = "Add to Cart";
          addBtn.style.background = "var(--primary)";
        }, 1500);
      });
      
      productEl.querySelector(".product-meta").appendChild(addBtn);
    }
  });

  // Add buttons to category cards (categories.html product grid)
  document.querySelectorAll("#productGrid .product-item").forEach((productEl) => {
    const titleEl = productEl.querySelector(".product-title");
    const priceEl = productEl.querySelector(".prod-price");
    
    if (titleEl && priceEl && !productEl.querySelector(".add-to-cart-btn")) {
      const addBtn = document.createElement("button");
      addBtn.className = "add-to-cart-btn";
      addBtn.textContent = "Add to Cart";
      
      addBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const name = titleEl.textContent.trim();
        const priceText = priceEl.textContent.replace(/[^\d.]/g, "");
        const price = parseFloat(priceText) || 0;
        
        addToCart(name, price);
        
        // Show feedback
        addBtn.textContent = "Added!";
        addBtn.style.background = "#27ae60";
        setTimeout(() => {
          addBtn.textContent = "Add to Cart";
          addBtn.style.background = "var(--primary)";
        }, 1500);
      });
      
      productEl.querySelector(".product-meta").appendChild(addBtn);
    }
  });

  // Attach product detail modal click listeners if available
  if (window.attachProductClickListeners) {
    window.attachProductClickListeners();
  }
}

// Expose addAddToCartButtons globally for dynamic content (categories.js)
window.addAddToCartButtons = addAddToCartButtons;

// Expose addToCart globally for product detail modal
window.addToCart = addToCart;

// Initialize cart when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initializeCart();
  addAddToCartButtons();
});
