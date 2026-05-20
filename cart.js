document.addEventListener("DOMContentLoaded", () => {
    const cartContainer = document.getElementById("cart-items-container");
    const selectAllCheckbox = document.getElementById("select-all");
    const totalPriceElement = document.getElementById("total-price");
    const checkoutBtn = document.getElementById("checkout-btn");

    // Lấy dữ liệu giỏ hàng từ localStorage (nếu chưa có thì tạo mảng rỗng)
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Hàm render giao diện giỏ hàng
    function renderCart() {
        if (cart.length === 0) {
            cartContainer.innerHTML = `<p style="text-align: center; padding: 32px; color: #6b7280;">Giỏ hàng của bạn đang trống.</p>`;
            updateSummary();
            return;
        }

        let html = "";
        cart.forEach((item, index) => {
            const formattedPrice = item.price.toLocaleString('vi-VN') + 'đ';
            const formattedOldPrice = item.oldPrice ? item.oldPrice.toLocaleString('vi-VN') + 'đ' : '';
            
            // Render thẻ sản phẩm
            html += `
            <div class="cart-item-card">
                <div class="cart-item-main">
                    <input type="checkbox" class="custom-checkbox item-checkbox" data-index="${index}">
                    
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    
                    <div class="cart-item-details">
                        <div class="item-title-row">
                            <h3 class="item-title">${item.name}</h3>
                            <button class="delete-btn" onclick="removeItem(${index})"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                        
                        <div class="item-price-quantity">
                            <div class="item-prices">
                                <span class="price-current">${formattedPrice}</span>
                                <span class="price-old">${formattedOldPrice}</span>
                            </div>
                            <div class="quantity-control">
                                <button class="qty-btn" onclick="changeQuantity(${index}, -1)">-</button>
                                <input type="text" class="qty-input" value="${item.quantity}" readonly>
                                <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        });

        cartContainer.innerHTML = html;

        // Lắng nghe sự kiện click vào các checkbox sản phẩm con
        const itemCheckboxes = document.querySelectorAll(".item-checkbox");
        itemCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", updateSummary);
        });
    }

    // Biến hàm toàn cục để có thể gọi từ inline onclick=""
    window.changeQuantity = function(index, delta) {
        if (cart[index].quantity + delta > 0) {
            cart[index].quantity += delta;
            saveCart();
            renderCart();
        }
    };

    window.removeItem = function(index) {
        if(confirm("Bạn có chắc chắn muốn bỏ sản phẩm này khỏi giỏ hàng?")) {
            cart.splice(index, 1);
            saveCart();
            renderCart();
        }
    };

    function saveCart() {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    // Hàm tính tổng tiền và cập nhật nút Thanh toán
    function updateSummary() {
        const itemCheckboxes = document.querySelectorAll(".item-checkbox");
        let total = 0;
        let checkedCount = 0;

        itemCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const index = checkbox.getAttribute("data-index");
                total += cart[index].price * cart[index].quantity;
                checkedCount++;
            }
        });

        // Định dạng tiền
        totalPriceElement.textContent = total.toLocaleString('vi-VN') + 'đ';

        // Xử lý Checkbox "Chọn tất cả"
        if (checkedCount > 0 && checkedCount === itemCheckboxes.length) {
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.checked = false;
        }

        // Bật / Tắt nút Mua ngay
        if (checkedCount > 0) {
            checkoutBtn.classList.remove("disabled");
            checkoutBtn.style.backgroundColor = "#d70018";
            checkoutBtn.style.cursor = "pointer";
        } else {
            checkoutBtn.classList.add("disabled");
            checkoutBtn.style.backgroundColor = "#a1a1aa";
            checkoutBtn.style.cursor = "not-allowed";
        }
    }

    // Xử lý sự kiện nút "Chọn tất cả"
    selectAllCheckbox.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        const itemCheckboxes = document.querySelectorAll(".item-checkbox");
        itemCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        updateSummary();
    });

    // 3. XỬ LÝ THANH TOÁN (TẠO ĐƠN HÀNG LÊN JSON-SERVER)
    checkoutBtn.addEventListener("click", () => {
        if (checkoutBtn.classList.contains("disabled")) return;

        // Lấy thông tin user hiện tại
        const user = JSON.parse(localStorage.getItem("user"));
        
        // Lọc ra các sản phẩm được chọn mua
        const selectedItems = [];
        let totalPrice = 0;
        
        const itemCheckboxes = document.querySelectorAll(".item-checkbox");
        itemCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const index = checkbox.getAttribute("data-index");
                selectedItems.push(cart[index]);
                totalPrice += cart[index].price * cart[index].quantity;
            }
        });

        // Tạo chuỗi ngày định dạng DD/MM/YYYY
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

        // Tạo dữ liệu Đơn hàng
        const newOrder = {
            id: "ORD" + Date.now(), // Tạo mã đơn ngẫu nhiên
            userId: user.id,
            items: selectedItems,
            totalPrice: totalPrice,
            createdAt: formattedDate,
            status: "Đang xử lý"
        };

        // Gửi lệnh lên máy chủ
        fetch("http://localhost:3000/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newOrder)
        })
        .then(res => res.json())
        .then(() => {
            alert("Thanh toán thành công!");
            
            // Xóa các sản phẩm đã mua khỏi giỏ hàng
            const remainingCart = cart.filter((_, index) => !itemCheckboxes[index].checked);
            localStorage.setItem("cart", JSON.stringify(remainingCart));
            
            // Chuyển hướng sang trang lịch sử
            window.location.href = "history.html";
        })
        .catch(err => console.error(err));
    });

    // Khởi chạy khi load trang
    renderCart();
});