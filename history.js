document.addEventListener("DOMContentLoaded", () => {
    const ordersContainer = document.getElementById("orders-container");
    const tabLinks = document.querySelectorAll(".tab-link");
    
    // Các DOM Element của bộ lọc ngày
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");
    const filterDateBtn = document.getElementById("filter-date-btn");

    const userJson = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    // Yêu cầu đăng nhập
    if (!userJson || !token) {
        window.location.replace("login.html");
        return; 
    }

    const user = JSON.parse(userJson);
    let allOrders = []; 

    // --- THIẾT LẬP NGÀY MẶC ĐỊNH ---
    const today = new Date();
    // Đặt ngày kết thúc là hôm nay
    endDateInput.value = today.toISOString().split('T')[0]; 
    
    // Đặt ngày bắt đầu là cách đây 30 ngày
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];

    // --- BẤM VÀO CHỮ TỰ ĐỘNG BUNG LỊCH CHỌN NGÀY ---
    [startDateInput, endDateInput].forEach(input => {
        if (input) {
            input.addEventListener("click", function() {
                if (typeof this.showPicker === "function") {
                    this.showPicker(); // Kích hoạt tờ lịch của trình duyệt
                }
            });
        }
    });

    // 🌟 HÀM BỔ TRỢ CHUYỂN NGÀY VỀ DẠNG SỐ (YYYYMMDD) ĐỂ LỌC CHÍNH XÁC
    function getComparableDate(dateStr) {
        if (!dateStr) return 0;
        
        let year, month, day;
        
        // Dạng ngày Việt Nam thủ công (VD: 20/05/2026)
        if (dateStr.includes("/")) {
            const parts = dateStr.split("/");
            if (parts.length === 3) {
                day = parseInt(parts[0]);
                month = parseInt(parts[1]);
                year = parseInt(parts[2]);
            }
        } 
        // Dạng ngày ISO tự sinh của hệ thống mới (VD: 2026-05-25T19:47:26Z)
        else {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                year = d.getFullYear();
                month = d.getMonth() + 1;
                day = d.getDate();
            }
        }

        if (!year) return 0;
        return (year * 10000) + (month * 100) + day;
    }

    // 1. GỌI API LẤY DANH SÁCH ĐƠN HÀNG CỦA USER ĐÓ
    function fetchOrders() {
        fetch(`http://localhost:3000/orders?userId=${user.id}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(async response => {
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Lỗi khi tải lịch sử mua hàng");
            }
            return response.json();
        })
        .then(orders => {
            allOrders = orders; 
            applyFilters(); // Bắt đầu lọc và hiển thị
        })
        .catch(error => {
            console.error(error);
            ordersContainer.innerHTML = `<p style="text-align: center; color: red; padding: 20px;">${error.message}</p>`;
        });
    }

    // 2. HÀM VẼ GIAO DIỆN ĐƠN HÀNG
    function renderOrders(ordersToRender) {
        if (ordersToRender.length === 0) {
            ordersContainer.innerHTML = `<p style="text-align: center; padding: 32px; color: #6b7280; background: #fff; border-radius: 8px;">Không có đơn hàng nào trong khoảng thời gian hoặc trạng thái này.</p>`;
            return;
        }

        // Đảo ngược mảng để đơn hàng mới nhất hiện lên đầu
        const displayOrders = [...ordersToRender].reverse(); 

        let html = "";
        displayOrders.forEach(order => {
            const formattedTotal = order.totalPrice.toLocaleString('vi-VN') + 'đ';
            
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
                        <div class="product-img-wrapper"><img src="${item.image}" alt="${item.name}"></div>
                        <div class="product-text-details">
                            <h3 class="order-product-title">${item.name}</h3>
                            <span class="order-product-price">${itemPrice} x ${item.quantity}</span>
                            <div class="vat-badge">Đã xuất VAT</div>
                        </div>
                    </div>
                `;
            });

            let statusClass = "status-success"; 
            if (order.status === "Chờ duyệt") statusClass = "status-warning"; 
            else if (order.status === "Đang giao") statusClass = "status-info"; 
            else if (order.status === "Đã hủy") statusClass = "status-danger";
            
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
                        <div class="order-items-container">${itemsHtml}</div>
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

    // 3. HÀM LỌC TỔNG HỢP (KẾT HỢP TAB VÀ NGÀY THÁNG)
    function applyFilters() {
        let filteredOrders = allOrders;

        // BƯỚC 1: LỌC THEO TAB
        const activeTab = document.querySelector(".tab-link.active");
        if (activeTab) {
            const statusFilter = activeTab.textContent.trim();
            if (statusFilter !== "Tất cả") {
                let dbStatus = statusFilter;
                if (statusFilter === "Chờ xác nhận" || statusFilter === "Đang xử lý") dbStatus = "Chờ duyệt";
                if (statusFilter === "Đang vận chuyển") dbStatus = "Đang giao";
                if (statusFilter === "Đã nhận hàng") dbStatus = "Hoàn thành";
                if (statusFilter === "Đã huỷ") dbStatus = "Đã hủy";

                filteredOrders = filteredOrders.filter(order => order.status === dbStatus);
            }
        }

        // BƯỚC 2: LỌC THEO THỜI GIAN (Dùng phép so sánh số nguyên chuẩn xác)
        const startDateVal = startDateInput.value; 
        const endDateVal = endDateInput.value;

        if (startDateVal && endDateVal) {
            // Biến "2026-05-01" thành số 20260501
            const startNum = parseInt(startDateVal.replace(/-/g, "")); 
            const endNum = parseInt(endDateVal.replace(/-/g, ""));

            filteredOrders = filteredOrders.filter(order => {
                const orderDateNum = getComparableDate(order.createdAt);
                if (orderDateNum === 0) return false;
                
                return orderDateNum >= startNum && orderDateNum <= endNum;
            });
        }

        renderOrders(filteredOrders);
    }

    // 4. BẮT SỰ KIỆN TƯƠNG TÁC TỪ NGƯỜI DÙNG
    tabLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            tabLinks.forEach(btn => btn.classList.remove("active"));
            e.target.classList.add("active");
            applyFilters(); 
        });
    });

    filterDateBtn.addEventListener("click", () => {
        const startNum = parseInt(startDateInput.value.replace(/-/g, ""));
        const endNum = parseInt(endDateInput.value.replace(/-/g, ""));
        
        if (startNum > endNum) {
            alert("Ngày bắt đầu không được lớn hơn ngày kết thúc!");
            return;
        }
        applyFilters(); 
    });

    // Khởi chạy hệ thống
    fetchOrders();
});