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

    // 3. XỬ LÝ THANH TOÁN (TẠO ĐƠN HÀNG LÊN SERVER)
    checkoutBtn.addEventListener("click", () => {
        if (checkoutBtn.classList.contains("disabled")) return;

        // Lấy thông tin user và token hiện tại
        const userJson = localStorage.getItem("user");
        const token = localStorage.getItem("accessToken");

        // Kiểm tra an toàn: Nếu mất token thì bắt đăng nhập lại
        if (!userJson || !token) {
            alert("Vui lòng đăng nhập để thực hiện thanh toán!");
            window.location.href = "login.html";
            return;
        }
        
        const user = JSON.parse(userJson);
        const selectedItems = [];
        let totalPrice = 0;
        
        // Lọc ra các sản phẩm được chọn mua dựa trên trạng thái checked của checkbox
        const itemCheckboxes = document.querySelectorAll(".item-checkbox");
        itemCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const index = checkbox.getAttribute("data-index");
                selectedItems.push(cart[index]);
                totalPrice += cart[index].price * cart[index].quantity;
            }
        });

        // Tạo chuỗi định dạng thời gian ISO chuẩn cho việc sắp xếp/lọc dữ liệu
        const today = new Date();
        const formattedDate = today.toISOString();

        // Tạo dữ liệu Đơn hàng đồng bộ với thiết kế DB yêu cầu
        const newOrder = {
            id: "ORD" + Date.now(), 
            userId: user.id,
            items: selectedItems,
            totalPrice: totalPrice,
            createdAt: formattedDate,
            status: "Chờ duyệt" // Thay đổi từ "Đang xử lý" sang "Chờ duyệt" theo yêu cầu bài học phân quyền
        };

        // Gửi lệnh lên máy chủ kèm theo Token bảo mật
        fetch("http://localhost:3000/orders", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Chuẩn hóa Header JWT Auth
            },
            body: JSON.stringify(newOrder)
        })
        .then(async res => {
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Thanh toán thất bại");
            }
            return res.json();
        })
        .then(() => {
            alert("Đặt hàng và thanh toán thành công!");
            
            // Lọc loại bỏ những sản phẩm đã được thanh toán thành công khỏi LocalStorage
            const remainingCart = cart.filter((_, index) => !itemCheckboxes[index].checked);
            localStorage.setItem("cart", JSON.stringify(remainingCart));
            
            // Điều hướng sang trang lịch sử đơn hàng của khách hàng
            window.location.href = "history.html";
        })
        .catch(err => {
            console.error(err);
            alert("Lỗi hệ thống: " + err.message);
        });
    });

    // Khởi chạy khi load trang
    renderCart();
});