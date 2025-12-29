// Checkout page logic
document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    }
    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }

  // Hamburger menu
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.add('active');
      overlay.classList.add('active');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar?.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  // Load cart from localStorage and populate checkout
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartItemsCheckout = document.getElementById('cartItemsCheckout');
  const subtotalCheckout = document.getElementById('subtotalCheckout');
  const taxCheckout = document.getElementById('taxCheckout');
  const totalCheckout = document.getElementById('totalCheckout');

  let subtotal = 0;
  cart.forEach((item) => {
    subtotal += (item.price || 0) * (item.quantity || 1);
    const itemEl = document.createElement('div');
    itemEl.className = 'checkout-item';
    itemEl.innerHTML = `
      <span class="checkout-item-name">${item.name}</span>
      <span class="checkout-item-qty">x${item.quantity}</span>
      <span class="checkout-item-price">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
    `;
    cartItemsCheckout.appendChild(itemEl);
  });

  const shipping = 10.00;
  const tax = (subtotal * 0.08).toFixed(2);
  const total = (subtotal + shipping + parseFloat(tax)).toFixed(2);

  subtotalCheckout.textContent = `$${subtotal.toFixed(2)}`;
  taxCheckout.textContent = `$${tax}`;
  totalCheckout.textContent = `$${total}`;

  // Form submission
  const checkoutForm = document.getElementById('checkoutForm');
  const submitBtn = document.getElementById('submitCheckout');

  if (checkoutForm && submitBtn) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate form
      if (!checkoutForm.checkValidity()) {
        alert('Please fill in all required fields.');
        return;
      }

      // Format card number for display
      const cardNumber = document.getElementById('cardNumber').value;
      const lastFour = cardNumber.slice(-4);

      // Success feedback
      submitBtn.textContent = 'Processing...';
      submitBtn.disabled = true;

      // Simulate processing
      setTimeout(() => {
        // Clear cart
        localStorage.removeItem('cart');

        // Show success message
        alert(`Order placed successfully!\n\nOrder Total: $${total}\nCard ending in: ${lastFour}\n\nYou will receive a confirmation email shortly.`);

        // Redirect to home
        window.location.href = 'index.html';
      }, 1500);
    });
  }

  // Format card number input
  const cardNumber = document.getElementById('cardNumber');
  if (cardNumber) {
    cardNumber.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\s+/g, '');
      let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
      e.target.value = formatted;
    });
  }

  // Format expiry input (MM/YY)
  const expiry = document.getElementById('expiry');
  if (expiry) {
    expiry.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D+/g, '');
      if (val.length >= 2) {
        val = val.substring(0, 2) + '/' + val.substring(2, 4);
      }
      e.target.value = val;
    });
  }

  // CVV numbers only
  const cvv = document.getElementById('cvv');
  if (cvv) {
    cvv.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D+/g, '');
    });
  }
});
