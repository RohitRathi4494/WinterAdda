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

        container.innerHTML = `
            <div class="image-grid">
                <div class="main-image">
                    <img src="${getImageUrl(p.image)}" alt="${p.name}" onerror="this.src='images/logo.png'">
                </div>
                <!-- Placeholder for more images if array exists later -->
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
                    <button class="btn-bag" onclick="addToCart('${p.name.replace(/'/g, "\\'")}', ${p.price}, '${getImageUrl(p.image).replaceAll('\\', '/')}')">
                        <span style="margin-right:8px">🛍️</span> ADD TO BAG
                    </button>
                    <button class="btn-wishlist">
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
    return colors.map(c => `<span class="color-btn">${c}</span>`).join('');
}
