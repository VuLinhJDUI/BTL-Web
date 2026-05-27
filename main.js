// Các biến toàn cục để lưu trữ trạng thái hiển thị
let allProducts = [];
let filteredProducts = [];
let currentCategory = "all";
let currentSearchKeyword = "";
let currentSort = "popular"; // Mặc định: Phổ biến (số sao)
let displayedCount = 8; // Số lượng hiển thị mặc định

document.addEventListener("DOMContentLoaded", () => {
    // 1. Cập nhật số lượng giỏ hàng trên header
    const cartCountElement = document.getElementById("header-cart-count");
    if (cartCountElement) {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        cartCountElement.textContent = cart.length;
    }

    // 2. Kiểm tra trạng thái đăng nhập
    const authBtn = document.getElementById("header-auth-btn");
    const userJson = localStorage.getItem("user");

    if (authBtn && userJson) {
        const user = JSON.parse(userJson);
        authBtn.innerHTML = `<i class="fa-regular fa-user"></i> Xin chào, ${user.name} | Đăng xuất`;
        authBtn.setAttribute("href", "#");
        authBtn.style.color = "#d70018";

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

    // 3. XỬ LÝ THANH TÌM KIẾM
    const searchInput = document.getElementById("search-input");
    const searchIcon = document.querySelector(".search-icon");

    if (searchInput) {
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                currentSearchKeyword = searchInput.value.trim().toLowerCase();
                applyAllFilters();
                document.getElementById('product-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        if(searchIcon) {
            searchIcon.addEventListener("click", () => {
                currentSearchKeyword = searchInput.value.trim().toLowerCase();
                applyAllFilters();
                document.getElementById('product-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            searchIcon.style.cursor = "pointer";
        }
    }

    // 4. LẮNG NGHE SỰ KIỆN TỪ BỘ LỌC (SELECT / CHECKBOX)
    document.getElementById("filter-stock").addEventListener("change", applyAllFilters);
    document.getElementById("filter-price").addEventListener("change", applyAllFilters);
    document.getElementById("filter-power").addEventListener("change", applyAllFilters);
    document.getElementById("filter-select-speeds").addEventListener("change", applyAllFilters);

    // 5. LẮNG NGHE SỰ KIỆN TỪ NÚT SẮP XẾP
    document.querySelectorAll(".sort-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            // Đổi hiệu ứng active màu đỏ
            document.querySelectorAll(".sort-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            
            // Cập nhật trạng thái sắp xếp
            currentSort = e.target.getAttribute("data-sort");
            applySorting(); // Chỉ cần sắp xếp lại mảng đã lọc
        });
    });

    // 6. NÚT XEM THÊM (Load More)
    document.getElementById("load-more-btn").addEventListener("click", () => {
        displayedCount += 8; // Tải thêm 8 sản phẩm mỗi lần bấm
        renderProductsToHTML();
    });

    // Gọi API để lấy Danh mục và Sản phẩm
    fetchCategories();
    fetchProducts();
});


// ==================== CÁC HÀM XỬ LÝ CHÍNH ====================

// Hàm lấy Danh mục và đổ vào Dropdown Header
function fetchCategories() {
    fetch("http://localhost:3000/categories")
        .then(res => res.json())
        .then(categories => {
            const dropdown = document.getElementById("category-dropdown");
            // Thêm mục "Tất cả danh mục" lên đầu
            let html = `<a href="javascript:void(0)" onclick="filterByCategory('all')">Tất cả sản phẩm</a>`;
            html += categories.map(cat => `<a href="javascript:void(0)" onclick="filterByCategory('${cat.id}')">${cat.name}</a>`).join("");
            dropdown.innerHTML = html;
        })
        .catch(err => console.error("Lỗi tải danh mục: ", err));
}

// Hàm kích hoạt khi bấm vào 1 danh mục trên Header
function filterByCategory(categoryId) {
    currentCategory = categoryId;
    applyAllFilters();
    // Cuộn xuống danh sách sản phẩm
    document.getElementById('product-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Lấy toàn bộ sản phẩm 1 lần từ máy chủ
function fetchProducts() {
    fetch("http://localhost:3000/products")
        .then(response => response.json())
        .then(products => {
            allProducts = products;
            applyAllFilters(); // Gọi hàm lọc lần đầu tiên
        })
        .catch(error => {
            console.error("Lỗi:", error);
            document.getElementById("product-list").innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Đã xảy ra lỗi khi tải danh sách sản phẩm.</p>`;
        });
}

// HÀM LỌC TỔNG HỢP KẾT HỢP TẤT CẢ TIÊU CHÍ
function applyAllFilters() {
    filteredProducts = allProducts.filter(product => {
        let isMatch = true;

        // 1. Lọc theo Từ khóa tìm kiếm
        if (currentSearchKeyword) {
            const nameMatch = product.name.toLowerCase().includes(currentSearchKeyword);
            const brandMatch = product.brand && product.brand.toLowerCase().includes(currentSearchKeyword);
            const idMatch = product.id.toLowerCase().includes(currentSearchKeyword);
            if (!nameMatch && !brandMatch && !idMatch) isMatch = false;
        }

        // 2. Lọc theo Danh mục
        if (currentCategory !== "all" && product.categoryId !== currentCategory) {
            isMatch = false;
        }

        // 3. Lọc theo Tình trạng kho (Sẵn hàng)
        const checkStock = document.getElementById("filter-stock").checked;
        if (checkStock && product.stock <= 0) {
            isMatch = false;
        }

        // 4. Lọc theo Mức Giá
        const priceVal = document.getElementById("filter-price").value;
        const pPrice = product.price;
        if (priceVal === "under1m" && pPrice >= 1000000) isMatch = false;
        if (priceVal === "1m-to-2m" && (pPrice < 1000000 || pPrice > 2000000)) isMatch = false;
        if (priceVal === "2m-to-3m" && (pPrice < 2000000 || pPrice > 3000000)) isMatch = false;
        if (priceVal === "above3m" && pPrice <= 3000000) isMatch = false;

        // 5. Lọc theo Công suất
        const powerVal = document.getElementById("filter-power").value;
        if (powerVal !== "all" && product.specs.power !== powerVal) {
            isMatch = false;
        }

        // 6. Lọc theo Tiện ích
        const speedsVal = document.getElementById("filter-select-speeds").value;
        if (speedsVal !== "all" && product.specs.speeds !== speedsVal) {
            isMatch = false;
        }

        return isMatch;
    });

    // Reset lại số lượng hiển thị về 8 mỗi khi bộ lọc thay đổi
    displayedCount = 8;
    applySorting(); // Lọc xong thì phải Sắp xếp lại
}

// HÀM SẮP XẾP DỮ LIỆU
function applySorting() {
    if (currentSort === "popular") {
        // Phổ biến: Ưu tiên số Sao (Rating) từ cao xuống thấp
        filteredProducts.sort((a, b) => b.rating - a.rating);
    } 
    else if (currentSort === "promo") {
        // Khuyến mãi HOT: Những sản phẩm có oldPrice (Đang giảm giá) sẽ được đưa lên đầu
        filteredProducts.sort((a, b) => {
            const aHasPromo = a.oldPrice ? 1 : 0;
            const bHasPromo = b.oldPrice ? 1 : 0;
            return bHasPromo - aHasPromo; 
        });
    } 
    else if (currentSort === "price-asc") {
        // Giá từ Thấp đến Cao
        filteredProducts.sort((a, b) => a.price - b.price);
    } 
    else if (currentSort === "price-desc") {
        // Giá từ Cao đến Thấp
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    renderProductsToHTML(); // Sau khi sắp xếp, tiến hành vẽ ra HTML
}

// HÀM VẼ GIAO DIỆN SẢN PHẨM VỚI PHÂN TRANG (LOAD MORE)
function renderProductsToHTML() {
    const productList = document.getElementById("product-list");
    const loadMoreContainer = document.getElementById("load-more-container");

    if (filteredProducts.length === 0) {
        productList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6b7280; background: #f9fafb; border-radius: 8px;">
                <i class="fa-solid fa-magnifying-glass" style="font-size: 40px; margin-bottom: 16px; color: #d1d5db;"></i>
                <h3>Rất tiếc, không tìm thấy sản phẩm nào phù hợp</h3>
                <p style="margin-top: 8px;">Vui lòng điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>`;
        loadMoreContainer.style.display = "none";
        return;
    }

    // Cắt mảng để chỉ lấy đủ số lượng `displayedCount` (Mặc định là 8)
    const itemsToDisplay = filteredProducts.slice(0, displayedCount);
    
    let htmlContent = "";

    itemsToDisplay.forEach(product => {
        const formattedPrice = product.price.toLocaleString('vi-VN') + 'đ';
        const formattedOldPrice = product.oldPrice ? product.oldPrice.toLocaleString('vi-VN') + 'đ' : '';

        const tagHTML = product.tag ? `<div class="badge-new">${product.tag}</div>` : '';
        const giftHTML = product.gift ? `<div class="product-gift">${product.gift}</div>` : '';
        const badgeHTML = product.badge ? `<div class="badge discount">${product.badge}</div>` : '';

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

    productList.innerHTML = htmlContent;

    // Xử lý ẩn/hiển thị nút Xem thêm
    if (displayedCount < filteredProducts.length) {
        loadMoreContainer.style.display = "block"; // Nếu còn sản phẩm chưa hiện -> Hiện nút
    } else {
        loadMoreContainer.style.display = "none"; // Nếu đã hiện hết -> Ẩn nút
    }
}

// Sinh sao đánh giá
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

// Chuyển hướng trang chi tiết
function goToDetail(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}