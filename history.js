document.addEventListener("DOMContentLoaded", () => {
    const ordersContainer = document.getElementById("orders-container");

    const userJson = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    // Nếu chưa đăng nhập hoặc mất token thì đẩy về trang login
    if (!userJson || !token) {
        window.location.href = "login.html";
        return; 
    }

    // Chuyển đổi thông tin chuỗi JSON của user sang Object để lấy id
    const user = JSON.parse(userJson);

    // 1. GỌI API LẤY DANH SÁCH ĐƠN HÀNG THEO USERID (CÓ BẢO MẬT TOKEN)
    function fetchOrders() {
        // Thêm tham số lọc query string ?userId=... để json-server chỉ trả về đơn hàng của user này
        fetch(`http://localhost:3000/orders?userId=${user.id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}` // Gửi kèm token theo chuẩn Bearer
            }
        })
        .then(async response => {
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Lỗi khi tải lịch sử mua hàng");
            }
            return response.json();
        })
        .then(orders => {
            renderOrders(orders);
        })
        .catch(error => {
            console.error(error);
            ordersContainer.innerHTML = `<p style="text-align: center; color: red; padding: 20px;">${error.message}</p>`;
        });
    }

    // 2. RENDER ĐƠN HÀNG RA GIAO DIỆN
    function renderOrders(orders) {
        if (orders.length === 0) {
            ordersContainer.innerHTML = `<p style="text-align: center; padding: 32px; color: #6b7280;">Bạn chưa có đơn hàng nào.</p>`;
            return;
        }

        orders.reverse(); // Mới nhất lên đầu

        let html = "";
        orders.forEach(order => {
            const formattedTotal = order.totalPrice.toLocaleString('vi-VN') + 'đ';
            
            // Xử lý hiển thị ngày tháng thân thiện nếu createdAt sử dụng chuỗi ISO chuẩn
            let displayDate = order.createdAt;
            if (order.createdAt && order.createdAt.includes("T")) {
                const dateObj = new Date(order.createdAt);
                displayDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
            }

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

            // Đồng bộ class giao diện dựa trên 3 trạng thái mới trong db.json
            let statusClass = "status-success"; // Mặc định màu xanh cho "Hoàn thành"
            if (order.status === "Chờ duyệt") {
                statusClass = "status-warning"; // Màu cam/vàng báo hiệu đang chờ
            } else if (order.status === "Đang giao") {
                statusClass = "status-info"; // Màu xanh dương/màu phụ trách đang vận chuyển (nếu css của bạn hỗ trợ)
            }
            
            html += `
                <div class="order-card">
                    <div class="order-card-header">
                        <div class="order-meta">
                            <span class="order-id">Đơn hàng: <strong>#${order.id}</strong></span>
                            <span class="dot"></span>
                            <span class="order-date">Ngày đặt: <strong>${displayDate}</strong></span>
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

    fetchOrders();
});