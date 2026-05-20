document.addEventListener("DOMContentLoaded", () => {
    const ordersContainer = document.getElementById("orders-container");

    // Lấy thông tin user hiện tại từ LocalStorage
    const userJson = localStorage.getItem("user");
    if (!userJson) return; // Nếu chưa đăng nhập thì file auth.js đã xử lý chuyển hướng rồi

    const user = JSON.parse(userJson);

    // 1. GỌI API LẤY DANH SÁCH ĐƠN HÀNG
    function fetchOrders() {
        // Query param ?userId=... giúp lọc đúng đơn hàng của tài khoản đang đăng nhập
        fetch(`http://localhost:3000/orders?userId=${user.id}`)
            .then(response => {
                if (!response.ok) throw new Error("Lỗi khi tải lịch sử mua hàng");
                return response.json();
            })
            .then(orders => {
                renderOrders(orders);
            })
            .catch(error => {
                console.error(error);
                ordersContainer.innerHTML = `<p style="text-align: center; color: red;">Không thể tải lịch sử mua hàng lúc này.</p>`;
            });
    }

    // 2. RENDER ĐƠN HÀNG RA GIAO DIỆN
    function renderOrders(orders) {
        if (orders.length === 0) {
            ordersContainer.innerHTML = `<p style="text-align: center; padding: 32px; color: #6b7280;">Bạn chưa có đơn hàng nào.</p>`;
            return;
        }

        // Đảo ngược mảng để đơn hàng mới nhất hiện lên đầu tiên
        orders.reverse();

        let html = "";
        orders.forEach(order => {
            const formattedTotal = order.totalPrice.toLocaleString('vi-VN') + 'đ';
            
            // Render danh sách sản phẩm bên trong 1 đơn hàng (vì 1 đơn có thể mua nhiều món)
            let itemsHtml = "";
            order.items.forEach(item => {
                const itemPrice = item.price.toLocaleString('vi-VN') + 'đ';
                itemsHtml += `
                    <div class="product-info-block" style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #e5e7eb;">
                        <div class="product-img-wrapper">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="product-text-details">
                            <h3 class="order-product-title">${item.name}</h3>
                            <span class="order-product-price">${itemPrice} x ${item.quantity}</span>
                            <div class="vat-badge">Đã xuất VAT</div>
                        </div>
                    </div>
                `;
            });

            // Gắn class CSS tương ứng với trạng thái đơn hàng
            let statusClass = "status-success";
            // Bạn có thể tự thêm class .status-warning vào style_pages.css với màu cam/vàng
            if (order.status === "Đang xử lý") statusClass = "status-warning"; 
            
            html += `
                <div class="order-card">
                    <div class="order-card-header">
                        <div class="order-meta">
                            <span class="order-id">Đơn hàng: <strong>#${order.id}</strong></span>
                            <span class="dot"></span>
                            <span class="order-date">Ngày đặt: <strong>${order.createdAt}</strong></span>
                        </div>
                        <span class="status-badge ${statusClass}">${order.status}</span>
                    </div>
                    
                    <div class="order-card-body" style="display: flex; flex-direction: column;">
                        <div class="order-items-container">
                            ${itemsHtml}
                        </div>
                        
                        <div class="order-summary-block" style="align-self: flex-end; margin-top: 8px;">
                            <div class="total-row">Tổng thanh toán: <span class="total-amount">${formattedTotal}</span></div>
                            <a href="#" class="view-detail-link" style="margin-top: 8px; display: inline-block;">Xem chi tiết <i class="fa-solid fa-chevron-right"></i></a>
                        </div>
                    </div>
                </div>
            `;
        });

        ordersContainer.innerHTML = html;
    }

    // Kích hoạt việc lấy dữ liệu khi trang vừa tải xong
    fetchOrders();
});