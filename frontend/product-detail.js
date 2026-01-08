document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const container = document.getElementById('product-listing');

    if (!productId) {
        container.innerHTML = '<h2 style="text-align:center">Product not found</h2><p style="text-align:center"><a href="products.html" class="btn">Browse Products</a></p>';
        return;
    }

    try {
        const res = await fetch(`${API_URL.replace('/auth', '/products')}/${productId}`);
        if (!res.ok) throw new Error('Product not found');

        const p = await res.json();

        // Helper to resolve image URL
        function getImageUrl(path) {
            if (!path) return 'images/logo.png';
            if (path.startsWith('http')) return path;
            if (path.startsWith('uploads/') || path.includes('\\')) {
                const baseUrl = API_URL.replace('/api/auth', '');
                return `${baseUrl}/${path.replace(/\\/g, '/')}`;
            }
            return path;
        }

        // Fake MSRP logic: Price + 20% or random overhead
        const mrp = Math.round(p.price * 1.4);
        const discount = Math.round(((mrp - p.price) / mrp) * 100);

        // Handle Images - MOVED OUTSIDE template literal
        let images = p.images && p.images.length > 0 ? p.images : [p.image];

        // Store product info globally for cart function (AFTER images is defined)
        currentProduct = {
            name: p.name,
            price: p.price,
            image: getImageUrl(images[0])
        };

        // Generate Thumbnails HTML
        const thumbnailsHtml = images.length > 1 ? `
            <div class="thumbnail-strip">
                ${images.map((img, index) => `
                    <img src="${getImageUrl(img)}" 
                         class="thumbnail ${index === 0 ? 'active' : ''}" 
                         onclick="changeImage('${getImageUrl(img).replace(/'/g, "\\'")}', this)">
                `).join('')}
            </div>
        ` : '';

        container.innerHTML = `
            <div class="image-gallery">
                <div class="main-image">
                    <img id="main-img" src="${getImageUrl(images[0])}" alt="${p.name}" onerror="this.src='images/logo.png'">
                </div>
                ${thumbnailsHtml}
            </div>

            <div class="product-details">
                <h1 class="pdp-title">${p.name}</h1>
                <span class="pdp-name">${p.description ? p.description.substring(0, 50) + '...' : 'Winter Collection 2025'}</span>
                
                <div class="pdp-price-container">
                    <span class="pdp-price">₹${p.price}</span>
                    <span class="pdp-mrp">MRP ₹${mrp}</span>
                    <span class="pdp-discount">(${discount}% OFF)</span>
                    <span class="pdp-tax-note">inclusive of all taxes</span>
                </div>

                <!-- SELECT SIZE -->
                <div class="size-selector">
                    <div class="size-header">
                        Select Size
                        <span style="color:#ff3e6c; font-size:12px; margin-left:15px; cursor:pointer">SIZE CHART ></span>
                    </div>
                    <div class="size-buttons">
                        ${renderSizes(p.sizes)}
                    </div>
                </div>

                <!-- SELECT COLOR -->
                ${p.colors && p.colors.length > 0 ? `
                <div class="color-selector">
                     <div class="size-header">Select Color</div>
                     <div>
                        ${renderColors(p.colors)}
                     </div>
                </div>` : ''}

                <div class="pdp-actions">
                    <button class="btn-bag" onclick="addToCartWithOptions()">
                        <span style="margin-right:8px">🛍️</span> ADD TO BAG
                    </button>
                    <button class="btn-wishlist" onclick="addToWishlist('${p.name.replace(/'/g, "\\'")}', ${p.price}, '${getImageUrl(images[0]).replaceAll('\\', '/')}')">
                        <span>♡</span> WISHLIST
                    </button>
                </div>

                <div class="product-spec">
                    <div class="spec-title">Product Details <span style="margin-left:auto">+</span></div>
                    <div class="spec-content">
                        ${p.description || 'No additional details available.'}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for size selection
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
            });
        });

        // Add event listeners for color selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
            });
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = '<h2 style="text-align:center">Product not found</h2><p style="text-align:center"><a href="products.html" class="btn">Browse Products</a></p>';
    }
});

function renderSizes(sizes) {
    if (!sizes || sizes.length === 0) {
        // Fallback or empty
        return '<span style="color:#666">One Size</span>';
    }
    return sizes.map(s => `<button class="size-btn">${s}</button>`).join('');
}

function renderColors(colors) {
    if (!colors) return '';

    // Color name to hex mapping
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

    return colors.map(c => {
        const colorName = c.toLowerCase().trim();
        const hexColor = colorMap[colorName] || '#CCCCCC'; // Default gray if color not found
        const borderStyle = colorName === 'white' ? 'border: 2px solid #ddd;' : '';

        return `<span class="color-btn" 
                     style="background-color: ${hexColor}; ${borderStyle}" 
                     title="${c}"
                     data-color="${c}"></span>`;
    }).join('');
}

function changeImage(src, thumbnail) {
    document.getElementById('main-img').src = src;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbnail.classList.add('active');
}

// Global variables to store product info for adding to cart
let currentProduct = null;

// Function to add to cart with selected color and size
function addToCartWithOptions() {
    if (!currentProduct) {
        alert('Product information not loaded');
        return;
    }

    // Get selected size
    const selectedSizeBtn = document.querySelector('.size-btn.selected');
    const size = selectedSizeBtn ? selectedSizeBtn.textContent.trim() : '';

    // Get selected color from data-color attribute
    const selectedColorBtn = document.querySelector('.color-btn.selected');
    const color = selectedColorBtn ? selectedColorBtn.getAttribute('data-color') : '';

    // Add to cart with color and size
    addToCart(currentProduct.name, currentProduct.price, currentProduct.image, color, size);
}
