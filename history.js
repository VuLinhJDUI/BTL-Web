document.addEventListener("DOMContentLoaded", () => {
    const ordersContainer = document.getElementById("orders-container");

    const userJson = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    // Nếu chưa đăng nhập hoặc mất token thì đẩy về trang login
    if (!userJson || !token) {
        window.location.href = "login.html";
        return; 
    }

    // 1. GỌI API LẤY DANH SÁCH ĐƠN HÀNG (CÓ BẢO MẬT TOKEN)
    function fetchOrders() {
        fetch("http://localhost:3000/orders", {
            method: "GET",
            headers: {
                "Authorization": token // Gửi token thay vì truyền URL
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
            ordersContainer.innerHTML = `<p style="text-align: center; color: red;">${error.message}</p>`;
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

            let statusClass = "status-success";
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

    fetchOrders();
});