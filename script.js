document.addEventListener('DOMContentLoaded', () => {
    
    let cart = [];

    const cartToggleBtn = document.getElementById('cart-toggle');
    const closeCartBtn = document.getElementById('close-cart');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountSpan = document.querySelector('.cart-count');
    const cartTotalPriceSpan = document.getElementById('cart-total-price');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    const checkoutBtn = document.querySelector('.checkout-btn');

    function openCart() {
        cartDrawer.classList.add('open');
        cartOverlay.classList.add('active');
    }

    function closeCart() {
        cartDrawer.classList.remove('open');
        cartOverlay.classList.remove('active');
    }

    cartToggleBtn.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    // Add Product to Cart
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));

            cart.push({ name, price });
            updateCartUI();
            openCart();
        });
    });

    // Update Cart UI
    function updateCartUI() {
        cartCountSpan.textContent = cart.length;
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-msg">Your cart is currently empty.</p>';
            cartTotalPriceSpan.textContent = '$0.00';
            return;
        }

        let total = 0;

        cart.forEach((item, index) => {
            total += item.price;

            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item-single');
            itemElement.innerHTML = `
                <div>
                    <strong>${item.name}</strong>
                    <div style="font-size:0.85rem; color:#747d8c;">$${item.price.toFixed(2)}</div>
                </div>
                <button class="cart-item-remove" onclick="removeItem(${index})"><i class="fas fa-trash"></i></button>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        cartTotalPriceSpan.textContent = `$${total.toFixed(2)}`;
    }

    window.removeItem = function(index) {
        cart.splice(index, 1);
        updateCartUI();
    };

    // Checkout Request to Backend
    checkoutBtn.addEventListener('click', async () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const total = cart.reduce((sum, item) => sum + item.price, 0);

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cart, total: total })
            });

            const data = await response.json();

            if (data.success) {
                alert(`Order #${data.orderId} placed successfully!`);
                cart = [];
                updateCartUI();
                closeCart();
            } else {
                alert(data.message || 'Error processing checkout.');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Server connection error.');
        }
    });

    // Newsletter Form Request to Backend
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            
            try {
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailInput.value })
                });

                const data = await response.json();
                alert(data.message);

                if (data.success) {
                    newsletterForm.reset();
                }
            } catch (error) {
                console.error('Subscription error:', error);
                alert('Server connection error.');
            }
        });
    }
});