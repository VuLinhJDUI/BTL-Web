// === BẢO VỆ ROUTE (DÒNG ĐẦU TIÊN): Kiểm tra quyền Admin, nếu sai lập tức chặn vào UI ===
if (localStorage.getItem("role") !== "admin") {
    window.location.href = "login.html";
}

const API_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
    loadOrders();
});

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = "tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white font-medium text-left";
    });
    
    const activeBtn = document.getElementById(`btn-${tabName}`);
    activeBtn.className = "tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 text-white font-semibold border-l-4 border-primary text-left";
    
    const titles = {
        books: "Quản lý Quạt / Sản phẩm",
        categories: "Quản lý Danh mục",
        users: "Quản lý Tài khoản",
        orders: "Quản lý Đơn hàng"
    };
    document.getElementById('page-title').innerText = titles[tabName];
}

// ======================== QUẢN LÝ SẢN PHẨM (CRUD) ========================

function loadBooks() {
    fetch(`${API_URL}/products`)
        .then(res => res.json())
        .then(books => {
            const tableBody = document.getElementById("book-list-table");
            tableBody.innerHTML = "";
            books.forEach(book => {
                tableBody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3 font-semibold">#${book.id}</td>
                        <td class="p-3"><img src="${book.image || 'images/fan-fujihome.webp'}" class="w-10 h-10 object-contain border p-1 rounded bg-white"></td>
                        <td class="p-3 font-medium text-gray-900">${book.name}</td>
                        <td class="p-3 text-gray-500">${book.categoryId || ''}</td>
                        <td class="p-3 text-primary font-semibold">${Number(book.price).toLocaleString('vi-VN')}đ</td>
                        <td class="p-3 text-right">
                            <button onclick="editBook('${book.id}')" class="text-blue-600 hover:text-blue-800 px-2 py-1"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteBook('${book.id}')" class="text-primary hover:text-red-700 px-2 py-1"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        });
}

// [DELETE] - Xóa sản phẩm bảo mật bằng Token
function deleteBook(id) {
    if (confirm("Xác nhận xoá?")) {
        // === BẢO MẬT API: Bổ sung Authorization Header ===
        fetch(`${API_URL}/products/${id}`, { 
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            }
        })
        .then(res => {
            if(res.ok) {
                alert("Xóa thành công!");
                loadBooks();
            } else {
                alert("Lỗi phân quyền hệ thống!");
            }
        });
    }
}

function openModal(type, id = null) {
    document.getElementById("form-modal").classList.remove("hidden");
    if(id) {
        document.getElementById("modal-title").innerText = "Chỉnh sửa Quạt / SP";
        fetch(`${API_URL}/products/${id}`)
            .then(res => res.json())
            .then(data => {
                document.getElementById("edit-id").value = data.id;
                document.getElementById("input-name").value = data.name;
                document.getElementById("input-price").value = data.price;
                document.getElementById("input-category").value = data.categoryId || "";
                document.getElementById("input-image").value = data.image || "";
            });
    } else {
        document.getElementById("modal-title").innerText = "Thêm Quạt / SP";
        document.getElementById("crud-form").reset();
        document.getElementById("edit-id").value = "";
    }
}

function editBook(id) {
    openModal('book', id);
}

function closeModal() {
    document.getElementById("form-modal").classList.add("hidden");
}

// [POST/PUT] - Thêm mới/Chỉnh sửa sản phẩm bảo mật bằng Token
function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("edit-id").value;
    const bookData = {
        name: document.getElementById("input-name").value,
        price: Number(document.getElementById("input-price").value),
        categoryId: document.getElementById("input-category").value,
        image: document.getElementById("input-image").value || "images/fan-fujihome.webp"
    };

    const method = id ? "PUT" : "POST";
    const endpoint = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;

    // === BẢO MẬT API: Bổ sung Authorization Header ===
    fetch(endpoint, {
        method: method,
        headers: { 
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("accessToken")
        },
        body: JSON.stringify(bookData)
    }).then(res => {
        if(res.ok) {
            alert("Lưu dữ liệu thành công!");
            closeModal();
            loadBooks();
        } else {
            alert("Lỗi: Phiên đăng nhập hết hạn hoặc không đủ quyền quản trị!");
        }
    });
}

// ======================== QUẢN LÝ ĐƠN HÀNG ========================

function loadOrders() {
    fetch(`${API_URL}/orders`)
        .then(res => res.json())
        .then(orders => {
            const tableBody = document.getElementById("order-list-table");
            tableBody.innerHTML = "";
            orders.forEach(order => {
                let badgeClass = "bg-yellow-100 text-yellow-800";
                if (order.status === "Hoàn thành") badgeClass = "bg-green-100 text-green-800";
                if (order.status === "Đang giao") badgeClass = "bg-blue-100 text-blue-800";
                if (order.status === "Đã hủy") badgeClass = "bg-red-100 text-red-800";

                let displayDate = order.createdAt || '';
                if (displayDate.includes("T")) {
                    const d = new Date(displayDate);
                    displayDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                }

                let quickApproveBtn = "";
                if (order.status === "Chờ duyệt") {
                    quickApproveBtn = `
                        <button onclick="approveOrder('${order.id}')" class="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1 rounded text-xs">
                            Duyệt đơn
                        </button>
                    `;
                } else {
                    quickApproveBtn = `<span class="text-xs text-gray-400 font-medium italic">Đã xử lý</span>`;
                }

                tableBody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3 font-semibold">#${order.id}</td>
                        <td class="p-3 text-gray-600">ID: ${order.userId}</td>
                        <td class="p-3 text-gray-500">${displayDate}</td>
                        <td class="p-3 text-primary font-bold">${Number(order.totalPrice).toLocaleString('vi-VN')}đ</td>
                        <td class="p-3"><span class="px-2 py-1 rounded text-xs font-bold ${badgeClass}">${order.status}</span></td>
                        <td class="p-3 text-center">${quickApproveBtn}</td>
                        <td class="p-3 text-right">
                            <select onchange="updateOrderStatus('${order.id}', this.value)" class="border rounded p-1 text-xs outline-none bg-white">
                                <option value="">-- Thay đổi --</option>
                                <option value="Chờ duyệt" ${order.status === 'Chờ duyệt' ? 'selected' : ''}>Chờ duyệt</option>
                                <option value="Đang giao" ${order.status === 'Đang giao' ? 'selected' : ''}>Đang giao</option>
                                <option value="Hoàn thành" ${order.status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
                                <option value="Đã hủy" ${order.status === 'Đã hủy' ? 'selected' : ''}>Hủy đơn</option>
                            </select>
                        </td>
                    </tr>
                `;
            });
        });
}

// [PATCH] - Nút duyệt đơn nhanh sang trạng thái "Đang giao" bảo mật bằng Token
function approveOrder(orderId) {
    if (confirm(`Xác nhận phê duyệt và chuyển trạng thái đơn hàng #${orderId} sang "Đang giao"?`)) {
        // === BẢO MẬT API: Bổ sung Authorization Header ===
        fetch(`${API_URL}/orders/${orderId}`, {
            method: "PATCH",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            body: JSON.stringify({ status: "Đang giao" })
        }).then(res => {
            if (res.ok) {
                alert("Đã duyệt đơn hàng thành công!");
                loadOrders();
            } else {
                alert("Không thể duyệt đơn. Vui lòng đăng nhập lại tài khoản Admin!");
            }
        });
    }
}

// [PATCH] - Thay đổi trạng thái bất kỳ qua thẻ select bảo mật bằng Token
function updateOrderStatus(orderId, newStatus) {
    if (!newStatus) return;
    // === BẢO MẬT API: Bổ sung Authorization Header ===
    fetch(`${API_URL}/orders/${orderId}`, {
        method: "PATCH",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("accessToken")
        },
        body: JSON.stringify({ status: newStatus })
    }).then(res => {
        if (res.ok) {
            loadOrders();
        } else {
            alert("Thao tác thất bại. Lỗi phân quyền quản trị!");
        }
    });
}

function logoutAdmin() {
    localStorage.clear(); // Xóa sạch dữ liệu phiên cũ phòng ngừa rò rỉ token
    window.location.href = "login.html";
}