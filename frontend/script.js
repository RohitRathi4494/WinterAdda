// Add item to cart (localStorage)
function addToCart(name, price, image, color = '', size = '') {
  let cart = JSON.parse(localStorage.getItem("wa_cart")) || [];

  // Check if exact same item (name, color, size) exists
  const existingIndex = cart.findIndex(item =>
    item.name === name && item.color === color && item.size === size
  );

  if (existingIndex !== -1) {
    cart[existingIndex].qty += 1;
  } else {
    cart.push({ image, name, price, color, size, qty: 1 });
  }

  localStorage.setItem('wa_cart', JSON.stringify(cart));
  alert(name + " added to cart");
}

// ===== WISHLIST FUNCTIONS =====
function addToWishlist(name, price, image) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

  // Check if item already in wishlist
  const existingItem = wishlist.find(item => item.name === name);

  if (existingItem) {
    alert('This item is already in your wishlist!');
    return;
  }

  // Add new item
  wishlist.push({ name, price, image });
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  alert('Added to Wishlist!');
}

function removeFromWishlist(name) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  wishlist = wishlist.filter(item => item.name !== name);
  localStorage.setItem('wishlist', JSON.stringify(wishlist));

  // Reload wishlist display if on wishlist page
  if (typeof loadWishlist === 'function') {
    loadWishlist();
  }
}

function getWishlist() {
  return JSON.parse(localStorage.getItem('wishlist')) || [];
}

function moveToCart(name) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const item = wishlist.find(i => i.name === name);

  if (item) {
    // Add to cart
    addToCart(item.name, item.price, item.image);
    // Remove from wishlist
    removeFromWishlist(name);
  }
}


// Load cart items on cart page
function loadCart() {
  const tableBody = document.getElementById("cart-body");
  const totalEl = document.getElementById("cart-total");
  const emptyMsg = document.getElementById("empty-cart-msg");

  let cart = JSON.parse(localStorage.getItem("wa_cart")) || [];

  if (!cart.length) {
    emptyMsg.style.display = "block";
    if (tableBody) tableBody.innerHTML = "";
    if (totalEl) totalEl.textContent = "₹0";
    return;
  }

  emptyMsg.style.display = "none";

  let rows = "";
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    // Color name to hex mapping (same as in product-detail.js)
    const colorMap = {
      'burgundy': '#800020',
      'maroon': '#800000',
      'dark brown': '#5C4033',
      'brown': '#964B00',
      'black': '#000000',
      'white': '#FFFFFF',
      'navy': '#000080',
      'blue': '#0000FF',
      'gray': '#808080',
      'grey': '#808080',
      'red': '#FF0000',
      'green': '#008000',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'pink': '#FFC0CB',
      'purple': '#800080',
      'beige': '#F5F5DC',
      'cream': '#FFFDD0',
      'khaki': '#C3B091',
      'olive': '#808000',
      'tan': '#D2B48C'
    };

    // Display color as swatch if available
    let colorDisplay = '-';
    if (item.color) {
      const colorName = item.color.toLowerCase().trim();
      const hexColor = colorMap[colorName] || '#CCCCCC';
      const borderStyle = colorName === 'white' ? 'border: 2px solid #ddd;' : '';
      colorDisplay = `<span style="display: inline-block; width: 30px; height: 30px; border-radius: 50%; background-color: ${hexColor}; ${borderStyle} vertical-align: middle;" title="${item.color}"></span>`;
    }

    const sizeDisplay = item.size ? item.size : '-';

    rows += `
      <tr>
        <td><img src="${item.image}" class="cart-img" alt="${item.name}"></td>
        <td>${item.name}</td>
        <td>${colorDisplay}</td>
        <td>${sizeDisplay}</td>
        <td>₹${item.price}</td>
        <td>${item.qty}</td>
        <td>₹${itemTotal}</td>
        <td><button class="btn btn-outline" onclick="removeItem(${index})">Remove</button></td>
      </tr>
    `;
  });

  tableBody.innerHTML = rows;
  totalEl.textContent = "₹" + total;
}

function removeItem(index) {
  let cart = JSON.parse(localStorage.getItem("wa_cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("wa_cart", JSON.stringify(cart));
  loadCart();
}

function clearCart() {
  localStorage.removeItem("wa_cart");
  loadCart();
}
function loadCheckoutSummary() {
  let cart = JSON.parse(localStorage.getItem("wa_cart")) || [];
  const itemsContainer = document.getElementById("checkout-items");
  const subtotalEl = document.getElementById("checkout-subtotal");
  const shippingEl = document.getElementById("checkout-shipping");
  const totalEl = document.getElementById("checkout-total");

  if (!cart.length) {
    itemsContainer.innerHTML = "<p>Your cart is empty.</p>";
    subtotalEl.textContent = "₹0";
    shippingEl.textContent = "₹0";
    totalEl.textContent = "₹0";
    return;
  }

  let subtotal = 0;
  let html = "";

  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    html += `
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span>${item.name} x ${item.qty}</span>
        <span>₹${itemTotal}</span>
      </div>
    `;
  });

  const shipping = subtotal >= 5000 ? 0 : 199;
  const total = subtotal + shipping;

  itemsContainer.innerHTML = html;
  subtotalEl.textContent = "₹" + subtotal;
  shippingEl.textContent = "₹" + shipping;
  totalEl.textContent = "₹" + total;
}

function proceedToCheckout() {
  let cart = JSON.parse(localStorage.getItem("wa_cart")) || [];

  // If cart is empty, prevent checkout
  if (!cart.length) {
    alert("Your cart is empty. Add items before checking out.");
    return;
  }

  // Redirect to checkout page
  window.location.href = "checkout.html";
}
function placeOrder() {
  alert("✅ Order placed successfully!\nThank you for shopping with Winter Adda!");
  localStorage.removeItem("wa_cart");
  window.location.href = "index.html";
}
function filterProducts(category) {
  const products = document.querySelectorAll(".product-card");
  const buttons = document.querySelectorAll(".filter-btn");

  // remove active state from all buttons
  buttons.forEach(btn => btn.classList.remove("active"));

  // add active to clicked button
  event.target.classList.add("active");

  products.forEach(product => {
    const cat = product.getAttribute("data-category");

    if (category === "all" || cat === category) {
      product.style.display = "block";
    } else {
      product.style.display = "none";
    }
  });
}

