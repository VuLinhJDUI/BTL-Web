// Chờ giao diện HTML tải xong thì mới chạy code JS
document.addEventListener("DOMContentLoaded", () => {
    renderProducts();
});

// Hàm gọi API và hiển thị sản phẩm quạt điện lên trang chủ
function renderProducts() {
    const productList = document.getElementById("product-list");

    // Dùng fetch để gọi danh sách sản phẩm từ json-server
    fetch("http://localhost:3000/products")
        .then(response => {
            if (!response.ok) {
                throw new Error("Không thể lấy dữ liệu sản phẩm");
            }
            return response.json();
        })
        .then(products => {
            let htmlContent = "";

            products.forEach(product => {
                // Định dạng tiền tệ Việt Nam (VND) cho dễ nhìn
                const formattedPrice = product.price.toLocaleString('vi-VN') + 'đ';
                const formattedOldPrice = product.oldPrice ? product.oldPrice.toLocaleString('vi-VN') + 'đ' : '';

                // Xử lý hiển thị tag "Hàng mới về" hoặc "Quà tặng" nếu có
                const tagHTML = product.tag ? `<div class="badge-new">${product.tag}</div>` : '';
                const giftHTML = product.gift ? `<div class="product-gift">${product.gift}</div>` : '';
                const badgeHTML = product.badge ? `<div class="badge discount">${product.badge}</div>` : '';

                // Tạo chuỗi HTML cho từng sản phẩm
                htmlContent += `
                    <div class="product-card" onclick="goToDetail('${product.id}')">
                        ${badgeHTML}
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.name}">
                        </div>
                        <div class="product-specs">
                            <span><i class="fa-solid fa-wind"></i> ${product.specs.speeds}</span>
                            <span><i class="fa-solid fa-bolt"></i> ${product.specs.power}</span>
                        </div>
                        <h3 class="product-title">${product.name}</h3>
                        ${tagHTML}
                        <div class="product-price">
                            <span class="current-price">${formattedPrice}</span>
                            <span class="old-price">${formattedOldPrice}</span>
                        </div>
                        ${giftHTML}
                        <div class="product-footer">
                            <div class="rating">
                                ${generateStars(product.rating)}
                            </div>
                            <button class="wishlist-btn" onclick="event.stopPropagation();"><i class="fa-regular fa-heart"></i> Yêu thích</button>
                        </div>
                    </div>
                `;
            });

            // Bơm toàn bộ chuỗi HTML vừa tạo vào vùng chứa
            productList.innerHTML = htmlContent;
        })
        .catch(error => {
            console.error("Lỗi:", error);
            productList.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Đã xảy ra lỗi khi tải danh sách sản phẩm.</p>`;
        });
}

// Hàm bổ trợ sinh số sao đánh giá động
function generateStars(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars += `<i class="fa-solid fa-star"></i>`;
        } else if (i - 0.5 === rating) {
            stars += `<i class="fa-solid fa-star-half-stroke"></i>`;
        } else {
            stars += `<i class="fa-regular fa-star" style="color: #9ca3af;"></i>`;
        }
    }
    return stars;
}

// Hàm giả lập chuyển hướng trang chi tiết (bổ sung cho đủ luồng bài tập)
function goToDetail(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// Bổ sung vào cuối file main.js
document.addEventListener("DOMContentLoaded", () => {
    const authBtn = document.getElementById("header-auth-btn");
    const userJson = localStorage.getItem("user");

    if (authBtn && userJson) {
        const user = JSON.parse(userJson);
        
        // Đổi nội dung hiển thị thành tên User + Nút đăng xuất
        authBtn.innerHTML = `<i class="fa-regular fa-user"></i> Xin chào, ${user.name} | Đăng xuất`;
        authBtn.setAttribute("href", "#"); // Huỷ link login.html
        authBtn.style.color = "#d70018"; // Đổi màu cho nổi bật

        // Lắng nghe sự kiện click để Đăng xuất
        authBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                alert("Đã đăng xuất tài khoản!");
                window.location.reload(); 
            }
        });
    }
});