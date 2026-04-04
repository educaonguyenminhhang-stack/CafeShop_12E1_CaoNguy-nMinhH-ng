document.addEventListener('DOMContentLoaded', () => {
    // --- KHỞI TẠO GIỎ HÀNG ---
    let cart = JSON.parse(localStorage.getItem('mocha_cart')) || [];

    // Scroll Effect cho Header
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }
    });

    // --- LOGIC CHI TIẾT SẢN PHẨM ---
    const productDetailPage = document.querySelector('.product_detail_page');
    if (productDetailPage) {
        const selected = JSON.parse(localStorage.getItem('selected_product'));
        if (selected) {
            document.getElementById('mainProductImg').src = selected.image;
            document.getElementById('mainProductName').textContent = selected.name;
            document.getElementById('mainProductPrice').textContent = selected.price.toLocaleString('vi-VN') + ' VNĐ';
            document.getElementById('breadcrumbName').textContent = selected.name;
            const descEl = document.getElementById('mainProductDesc');
            if (descEl) {
                descEl.textContent = selected.description || "Hương vị tuyệt vời từ những sản phẩm tuyển chọn nhất của Mocha & Co.";
            }
            
            // Xử lý hiển thị "ml" cho đồ uống và ẩn cho bánh
            const sizeBtns = document.querySelectorAll('.size_btn');
            const currentMlEl = document.getElementById('currentMl');
            const mlLabel = document.getElementById('mlLabel');
            const isCake = selected.category === 'cake';

            sizeBtns.forEach(btn => {
                const ml = btn.dataset.ml;
                if (isCake) {
                    btn.textContent = btn.dataset.size; // Chỉ hiển thị S, M, L
                    if (currentMlEl) currentMlEl.parentElement.style.display = 'none'; 
                } else {
                    btn.textContent = `${btn.dataset.size} (${ml})`;
                }
            });

            // Khởi tạo giá gốc để tính toán size
            const basePrice = selected.price;
            let currentExtra = 0;

            sizeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    sizeBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    currentExtra = parseInt(btn.dataset.extra);
                    const newPrice = basePrice + currentExtra;
                    document.getElementById('mainProductPrice').textContent = newPrice.toLocaleString('vi-VN') + ' VNĐ';
                    if (currentMlEl && !isCake) {
                        currentMlEl.textContent = btn.dataset.ml;
                    }
                });
            });

            // Tăng giảm số lượng
            const qtyInput = document.getElementById('productQty');
            const btnPlus = document.querySelector('.qty_plus');
            const btnMinus = document.querySelector('.qty_minus');

            if (btnPlus && btnMinus && qtyInput) {
                btnPlus.addEventListener('click', () => {
                    qtyInput.value = parseInt(qtyInput.value) + 1;
                });
                btnMinus.addEventListener('click', () => {
                    let val = parseInt(qtyInput.value);
                    if (val > 1) qtyInput.value = val - 1;
                });
            }
        }
    }

    // --- LOGIC CLICK TRÊN TOÀN TRANG ---
    document.addEventListener('click', (e) => {
        // 1. Thêm vào giỏ hàng từ icon "+" (Home/Shop)
        if (e.target.classList.contains('fa-plus-circle')) {
            const item = e.target.closest('.product_item');
            if (item) {
                const product = {
                    name: item.querySelector('.name_product').textContent.trim(),
                    price: parseInt(item.querySelector('.price_product span').textContent.replace(/\D/g, '')),
                    image: item.querySelector('.img_product img').src,
                    category: item.dataset.category || "",
                    size: 'S',
                    ml: item.dataset.category === 'cake' ? '' : '250ml',
                    quantity: 1
                };
                addToCart(product);
                showNotification();
            }
            return;
        }

        // 2. Thêm vào giỏ hàng từ nút "THÊM VÀO GIỎ" (Detail)
        if (e.target.classList.contains('add_to_cart')) {
            const name = document.getElementById('mainProductName').textContent;
            const price = parseInt(document.getElementById('mainProductPrice').textContent.replace(/\D/g, ''));
            const image = document.getElementById('mainProductImg').src;
            const quantity = parseInt(document.getElementById('productQty').value);
            const activeSizeBtn = document.querySelector('.size_btn.active');
            const selected = JSON.parse(localStorage.getItem('selected_product'));
            const isCake = selected && selected.category === 'cake';
            
            const size = activeSizeBtn ? activeSizeBtn.dataset.size : 'S';
            const ml = (activeSizeBtn && !isCake) ? activeSizeBtn.dataset.ml : '';
            
            addToCart({ name, price, image, quantity, size, ml, category: selected.category });
            showNotification();
            return;
        }

        // 3. Click vào ảnh hoặc tên để xem chi tiết
        const productItem = e.target.closest('.product_item');
        if (productItem && !e.target.classList.contains('fa-plus-circle')) {
            const product = {
                name: productItem.querySelector('.name_product').textContent.trim(),
                price: parseInt(productItem.querySelector('.price_product span').textContent.replace(/\D/g, '')),
                image: productItem.querySelector('.img_product img').src,
                description: productItem.dataset.description || "",
                category: productItem.dataset.category || ""
            };
            localStorage.setItem('selected_product', JSON.stringify(product));
            
            const link = productItem.querySelector('a');
            if (link) {
                window.location.href = link.getAttribute('href');
            }
        }
    });

    function addToCart(product) {
        const existing = cart.find(item => item.name === product.name && item.size === product.size);
        if (existing) {
            existing.quantity += product.quantity;
        } else {
            cart.push(product);
        }
        localStorage.setItem('mocha_cart', JSON.stringify(cart));
    }

    function showNotification() {
        const noti = document.getElementById('cartNotification');
        if (noti) {
            noti.classList.add('show');
            setTimeout(() => {
                noti.classList.remove('show');
            }, 3000);
        }
    }

    // --- LOGIC TRANG GIỎ HÀNG ---
    const cartTableBody = document.querySelector('.cart_table tbody');
    if (cartTableBody) {
        renderCart();

        cartTableBody.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            const index = row.dataset.index;

            if (e.target.classList.contains('remove_icon')) {
                cart.splice(index, 1);
                saveAndRender();
            }

            if (e.target.tagName === 'BUTTON') {
                if (e.target.textContent === '+') cart[index].quantity++;
                else if (e.target.textContent === '-' && cart[index].quantity > 1) cart[index].quantity--;
                saveAndRender();
            }
        });
    }

    function saveAndRender() {
        localStorage.setItem('mocha_cart', JSON.stringify(cart));
        renderCart();
    }

    function renderCart() {
        if (!cartTableBody) return;
        if (cart.length === 0) {
            cartTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 100px; color: #999;">Giỏ hàng của bạn đang trống. <br><a href="shop.html" style="color: var(--accent-color); text-decoration: none; font-weight: 800; margin-top: 20px; display: inline-block;">TIẾP TỤC MUA SẢM</a></td></tr>';
            updateTotals(0);
            return;
        }

        cartTableBody.innerHTML = cart.map((item, index) => {
            const sizeDisplay = item.ml ? `${item.size} (${item.ml})` : item.size;
            return `
                <tr data-index="${index}" style="border-bottom: 1px solid #f2f2f2;">
                    <td class="cart_product_info" style="padding: 25px 0; display: flex; align-items: center; gap: 20px;">
                        <img src="${item.image}" alt="" style="width: 100px; height: 100px; border-radius: 15px; object-fit: cover;">
                        <div>
                            <div style="font-weight: 800; font-size: 16px; color: var(--primary-color);">${item.name}</div>
                            <div style="font-size: 13px; color: var(--accent-color); font-weight: 600;">Size: ${sizeDisplay}</div>
                        </div>
                    </td>
                    <td style="font-weight: 700;">${item.price.toLocaleString('vi-VN')} VNĐ</td>
                    <td>
                        <div class="quantity_selector">
                            <button>-</button>
                            <input type="number" value="${item.quantity}" readonly>
                            <button>+</button>
                        </div>
                    </td>
                    <td style="font-weight: 800; color: var(--primary-color);">${(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</td>
                    <td><i class="fa-solid fa-trash-can remove_icon"></i></td>
                </tr>
            `;
        }).join('');

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        updateTotals(subtotal);
    }

    // --- LOGIC LỌC SẢN PHẨM TẠI TRANG SHOP ---
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const filterBtns = document.querySelectorAll('.filter_btn');
    const shopProductItems = document.querySelectorAll('.product_item');

    if (filterToggleBtn && filterDropdown) {
        filterToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            if (filterDropdown) filterDropdown.classList.remove('show');
        });

        filterDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const category = btn.dataset.category;
                shopProductItems.forEach(item => {
                    if (category === 'all' || item.dataset.category === category) {
                        item.style.display = 'block';
                        item.style.animation = 'fadeInUp 0.6s ease forwards';
                    } else {
                        item.style.display = 'none';
                    }
                });
                filterDropdown.classList.remove('show');
            });
        });
    }

    function updateTotals(subtotal) {
        const shipping = subtotal > 0 ? 15000 : 0;
        const subtotalEls = document.querySelectorAll('.cart_summary p span:last-child');
        const totalEl = document.querySelector('.cart_summary p strong');

        if (subtotalEls.length > 0) {
            subtotalEls[0].textContent = subtotal.toLocaleString('vi-VN') + ' VNĐ';
        }
        if (totalEl) {
            totalEl.textContent = (subtotal + shipping).toLocaleString('vi-VN') + ' VNĐ';
        }
    }
});

function scrollSlider(direction) {
    const slider = document.getElementById('productSlider');
    if (!slider) return;
    slider.scrollBy({ left: direction * 350, behavior: 'smooth' });
}
