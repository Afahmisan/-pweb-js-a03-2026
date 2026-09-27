const userFirstName = localStorage.getItem('userFirstName');

if (!userFirstName) {
  window.location.replace('login.html');
}

let allProducts = [];
let filteredProducts = [];
const BATCH_SIZE = 8;
let currentLimit = BATCH_SIZE;

let currentSearchQuery = '';
let currentCategory = 'all';
let currentSortOrder = 'default';

let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

const userGreeting = document.getElementById('user-greeting');
const btnLogout = document.getElementById('btn-logout');
const productGrid = document.getElementById('product-grid');
const loadingSpinner = document.getElementById('loading-spinner');
const globalError = document.getElementById('global-error');
const errorText = document.getElementById('error-text');
const btnLoadMore = document.getElementById('btn-load-more');
const categoryFilter = document.getElementById('category-filter');
const sortFilter = document.getElementById('sort-filter');
const searchInput = document.getElementById('search-input');

const btnCart = document.getElementById('btn-cart');
const cartBadge = document.getElementById('cart-badge');
const cartModal = document.getElementById('cart-modal');
const btnCloseCart = document.getElementById('btn-close-cart');
const cartContent = document.getElementById('cart-content');
const cartTotalPrice = document.getElementById('cart-total-price');
const btnClearCart = document.getElementById('btn-clear-cart');

const btnBurger = document.getElementById('btn-burger');
const burgerDropdown = document.getElementById('burger-dropdown');

const productModal = document.getElementById('product-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const modalContent = document.getElementById('modal-content');

if (userGreeting && userFirstName) {
  userGreeting.textContent = userFirstName;
}

btnLogout.addEventListener('click', () => {
  localStorage.removeItem('userFirstName');
  window.location.replace('login.html');
});

if (btnBurger && burgerDropdown) {
  btnBurger.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = burgerDropdown.style.display === 'block';
    burgerDropdown.style.display = isOpen ? 'none' : 'block';
    btnBurger.setAttribute('aria-expanded', !isOpen);
  });

  document.addEventListener('click', (event) => {
    if (!burgerDropdown.contains(event.target) && event.target !== btnBurger) {
      burgerDropdown.style.display = 'none';
      btnBurger.setAttribute('aria-expanded', 'false');
    }
  });
}

function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

function applyFiltersAndSort() {
  let result = [...allProducts];

  if (currentCategory !== 'all') {
    result = result.filter((product) => product.category === currentCategory);
  }

  if (currentSearchQuery.trim() !== '') {
    const query = currentSearchQuery.toLowerCase().trim();
    result = result.filter((product) => {
      const matchTitle = product.title.toLowerCase().includes(query);
      const matchCategory = product.category.toLowerCase().includes(query);
      return matchTitle || matchCategory;
    });
  }

  switch (currentSortOrder) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'rating-desc':
      result.sort((a, b) => b.rating - a.rating);
      break;
    case 'default':
    default:
      result.sort((a, b) => a.id - b.id);
      break;
  }

  filteredProducts = result;
  currentLimit = BATCH_SIZE;
  renderProducts();
}

function formatRupiah(priceUSD) {
  const priceIDR = Math.round(priceUSD * 15500);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(priceIDR);
}

async function fetchProducts() {
  loadingSpinner.style.display = 'flex';
  globalError.style.display = 'none';

  try {
    const response = await fetch('https://dummyjson.com/products');

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    allProducts = data.products || [];

    populateCategoryOptions(allProducts);
    applyFiltersAndSort();
    updateCartUI();
  } catch (error) {
    console.error('Fetch Products Error:', error);
    errorText.textContent = 'Failed to load product catalog. Please check your internet connection.';
    globalError.style.display = 'flex';
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

function renderProducts() {
  productGrid.innerHTML = '';

  if (filteredProducts.length === 0) {
    productGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--c-text-muted);">
        <p style="font-size: 1.15rem; font-weight: 600;">No products found.</p>
        <p style="font-size: 0.88rem; margin-top: 4px;">There are no items matching your search or filter criteria.</p>
      </div>
    `;
    btnLoadMore.style.display = 'none';
    return;
  }

  const slicedProducts = filteredProducts.slice(0, currentLimit);

  const cardsHTML = slicedProducts.map((product) => {
    return `
      <article class="product-card" data-id="${product.id}">
        <div class="card-img-wrapper">
          <img src="${product.thumbnail}" alt="${product.title}" loading="lazy">
          ${product.discountPercentage ? `<span class="discount-badge">-${Math.round(product.discountPercentage)}%</span>` : ''}
        </div>
        <div class="card-body">
          <span class="card-category">${product.category}</span>
          <h3 class="card-title">${product.title}</h3>
          <p class="card-price">${formatRupiah(product.price)}</p>
          <div class="card-meta">
            <span class="meta-rating">Rating: ${product.rating.toFixed(1)}</span>
            <span>| Sold: ${Math.floor(product.rating * 18)}+</span>
          </div>
          <button class="btn-add-cart" data-cart-id="${product.id}">
            + Add to Cart
          </button>
        </div>
      </article>
    `;
  }).join('');

  productGrid.innerHTML = cardsHTML;
  updateLoadMoreButton();
}

function updateLoadMoreButton() {
  if (currentLimit < filteredProducts.length) {
    btnLoadMore.style.display = 'inline-block';
  } else {
    btnLoadMore.style.display = 'none';
  }
}

btnLoadMore.addEventListener('click', () => {
  currentLimit += BATCH_SIZE;
  renderProducts();
});

function populateCategoryOptions(products) {
  const uniqueCategories = [...new Set(products.map((p) => p.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  uniqueCategories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categoryFilter.appendChild(option);
  });
}

const handleSearchDebounced = debounce((event) => {
  currentSearchQuery = event.target.value;
  applyFiltersAndSort();
}, 300);

searchInput.addEventListener('input', handleSearchDebounced);

categoryFilter.addEventListener('change', (event) => {
  currentCategory = event.target.value;
  applyFiltersAndSort();
});

sortFilter.addEventListener('change', (event) => {
  currentSortOrder = event.target.value;
  applyFiltersAndSort();
});

productGrid.addEventListener('click', (event) => {
  const addCartButton = event.target.closest('.btn-add-cart');
  if (addCartButton) {
    event.stopPropagation();
    const productId = Number(addCartButton.dataset.cartId);
    addToCart(productId);
    return;
  }

  const card = event.target.closest('.product-card');
  if (card) {
    const productId = Number(card.dataset.id);
    openProductDetailModal(productId);
  }
});

function openProductDetailModal(productId) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  modalContent.innerHTML = `
    <div class="modal-detail-layout">
      <div class="modal-img-box">
        <img src="${product.thumbnail}" alt="${product.title}">
      </div>
      <div class="modal-info-box">
        <div class="modal-badge-group">
          <span class="badge-tag">${product.category}</span>
          <span class="badge-tag">Brand: ${product.brand || 'Original'}</span>
          <span class="badge-tag">Stock: ${product.stock}</span>
        </div>
        <h2 class="modal-title">${product.title}</h2>
        <p class="modal-price">${formatRupiah(product.price)}</p>
        <p class="modal-desc">${product.description}</p>
        <div class="card-meta">
          <span class="meta-rating">Rating: ${product.rating.toFixed(1)}</span>
        </div>
        <button class="btn-add-cart" style="margin-top: 12px;" data-cart-id="${product.id}">
          + Add to Cart
        </button>
      </div>
    </div>
  `;

  const modalAddCartBtn = modalContent.querySelector('.btn-add-cart');
  if (modalAddCartBtn) {
    modalAddCartBtn.addEventListener('click', () => {
      addToCart(product.id);
    });
  }

  productModal.style.display = 'flex';
}

btnCloseModal.addEventListener('click', () => {
  productModal.style.display = 'none';
});

productModal.addEventListener('click', (event) => {
  if (event.target === productModal) {
    productModal.style.display = 'none';
  }
});

function addToCart(productId) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  const existingItemIndex = cart.findIndex((item) => item.id === productId);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      quantity: 1
    });
  }

  saveCartToStorage();
  updateCartUI();
}

function updateCartQuantity(productId, delta) {
  const itemIndex = cart.findIndex((item) => item.id === productId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += delta;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
  }
  saveCartToStorage();
  updateCartUI();
  renderCartModal();
}

function removeCartItem(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCartToStorage();
  updateCartUI();
  renderCartModal();
}

function clearCart() {
  cart = [];
  localStorage.removeItem('shoppingCart');
  updateCartUI();
  renderCartModal();
}

btnClearCart.addEventListener('click', clearCart);

function saveCartToStorage() {
  localStorage.setItem('shoppingCart', JSON.stringify(cart));
}

function updateCartUI() {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  cartBadge.textContent = totalItems;
}

function renderCartModal() {
  if (cart.length === 0) {
    cartContent.innerHTML = `
      <div style="text-align: center; padding: 32px 0; color: var(--c-text-muted);">
        <p style="font-weight: 600;">Your cart is empty.</p>
      </div>
    `;
    cartTotalPrice.textContent = 'Rp 0';
    return;
  }

  const itemsHTML = cart.map((item) => {
    return `
      <div class="cart-item-row">
        <img src="${item.thumbnail}" alt="${item.title}">
        <div class="cart-item-info">
          <p class="cart-item-title">${item.title}</p>
          <span class="cart-item-price">${formatRupiah(item.price)}</span>
        </div>
        <div class="cart-item-actions">
          <button class="btn-qty" onclick="updateCartQuantity(${item.id}, -1)">-</button>
          <span>${item.quantity}</span>
          <button class="btn-qty" onclick="updateCartQuantity(${item.id}, 1)">+</button>
          <button class="btn-remove-item" onclick="removeCartItem(${item.id})">Remove</button>
        </div>
      </div>
    `;
  }).join('');

  cartContent.innerHTML = itemsHTML;

  const totalCalculated = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  cartTotalPrice.textContent = formatRupiah(totalCalculated);
}

window.updateCartQuantity = updateCartQuantity;
window.removeCartItem = removeCartItem;

btnCart.addEventListener('click', () => {
  renderCartModal();
  cartModal.style.display = 'flex';
});

btnCloseCart.addEventListener('click', () => {
  cartModal.style.display = 'none';
});

cartModal.addEventListener('click', (event) => {
  if (event.target === cartModal) {
    cartModal.style.display = 'none';
  }
});

fetchProducts();