// === BẢO VỆ ROUTE: Kiểm tra quyền Admin ===
if (localStorage.getItem("role") !== "admin") {
    window.location.replace("login.html");
}

const API_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
    loadOrders();
    loadCategories();
    loadUsers();

    // 🌟 KHẮC PHỤC LỖI NHẢY TAB: Lấy lại tab đang xem trước khi bị Live Server reload
    const activeTab = localStorage.getItem("activeAdminTab") || "books";
    switchTab(activeTab);
});

function switchTab(tabName) {
    // Ẩn tất cả nội dung
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    // Hiện tab được chọn
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    // Reset style tất cả các nút
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = "tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white font-medium text-left";
    });
    
    // Highlight nút đang active
    const activeBtn = document.getElementById(`btn-${tabName}`);
    if(activeBtn) {
        activeBtn.className = "tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 text-white font-semibold border-l-4 border-primary text-left";
    }
    
    // Cập nhật tiêu đề
    const titles = {
        books: "Quản lý Quạt / Sản phẩm",
        categories: "Quản lý Danh mục",
        users: "Quản lý Tài khoản",
        orders: "Quản lý Đơn hàng"
    };
    document.getElementById('page-title').innerText = titles[tabName];

    // 🌟 LƯU TAB VÀO BỘ NHỚ: Ghi nhớ lại vị trí để chống việc reload bị mất dấu
    localStorage.setItem("activeAdminTab", tabName);
}

// ======================== QUẢN LÝ SẢN PHẨM ========================

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
                            <button type="button" onclick="editBook('${book.id}')" class="text-blue-600 hover:text-blue-800 px-2 py-1"><i class="fa-solid fa-pen"></i></button>
                            <button type="button" onclick="deleteBook('${book.id}')" class="text-primary hover:text-red-700 px-2 py-1"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        });
}

function deleteBook(id) {
    if (confirm("Xác nhận xoá sản phẩm này?")) {
        fetch(`${API_URL}/products/${id}`, { 
            method: "DELETE",
            headers: { "Authorization": "Bearer " + localStorage.getItem("accessToken") }
        }).then(res => {
            if(res.ok) {
                loadBooks();
            } else alert("Lỗi phân quyền hệ thống!");
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

function editBook(id) { openModal('book', id); }

// Sửa lỗi: Hàm đóng modal sản phẩm bị thiếu
function closeModal() { document.getElementById("form-modal").classList.add("hidden"); }

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

    fetch(endpoint, {
        method: method,
        headers: { 
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("accessToken")
        },
        body: JSON.stringify(bookData)
    }).then(res => {
        if(res.ok) {
            closeModal();
            loadBooks();
        } else alert("Lỗi hệ thống khi lưu sản phẩm!");
    });
}

// ======================== QUẢN LÝ DANH MỤC ========================

function loadCategories() {
    fetch(`${API_URL}/categories`)
        .then(res => res.json())
        .then(categories => {
            const tableBody = document.getElementById("category-list-table");
            tableBody.innerHTML = "";
            categories.forEach(cat => {
                tableBody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3 font-semibold text-gray-700">${cat.id}</td>
                        <td class="p-3 font-medium text-gray-900">${cat.name}</td>
                        <td class="p-3 text-right">
                            <button type="button" onclick="editCategory('${cat.id}', '${cat.name}')" class="text-blue-600 hover:text-blue-800 px-2 py-1"><i class="fa-solid fa-pen"></i></button>
                            <button type="button" onclick="deleteCategory('${cat.id}')" class="text-primary hover:text-red-700 px-2 py-1"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        });
}

function openCategoryModal() {
    document.getElementById("category-modal").classList.remove("hidden");
    document.getElementById("cat-modal-title").innerText = "Thêm Danh Mục Mới";
    document.getElementById("category-form").reset();
    document.getElementById("edit-cat-id").value = "";
    document.getElementById("input-cat-id").disabled = false;
    document.getElementById("input-cat-id").classList.remove("bg-gray-200");
}

function editCategory(id, name) {
    document.getElementById("category-modal").classList.remove("hidden");
    document.getElementById("cat-modal-title").innerText = "Chỉnh Sửa Danh Mục";
    document.getElementById("edit-cat-id").value = id;
    document.getElementById("input-cat-id").value = id;
    document.getElementById("input-cat-id").disabled = true; 
    document.getElementById("input-cat-id").classList.add("bg-gray-200");
    document.getElementById("input-cat-name").value = name;
}

function closeCategoryModal() { document.getElementById("category-modal").classList.add("hidden"); }

function handleCategorySubmit(e) {
    e.preventDefault();
    const editId = document.getElementById("edit-cat-id").value;
    const catName = document.getElementById("input-cat-name").value.trim();
    
    if(editId) {
        fetch(`${API_URL}/categories/${editId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            body: JSON.stringify({ name: catName })
        }).then(res => {
            if (res.ok) {
                closeCategoryModal();
                loadCategories();
            }
        });
    } else {
        const customId = document.getElementById("input-cat-id").value.trim();
        const bodyData = { name: catName };
        if(customId) bodyData.id = customId;

        fetch(`${API_URL}/categories`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            body: JSON.stringify(bodyData)
        }).then(res => {
            if (res.ok) {
                closeCategoryModal();
                loadCategories();
            } else {
                alert("Mã danh mục đã tồn tại hoặc biểu mẫu lỗi!");
            }
        });
    }
}

function deleteCategory(id) {
    if(confirm(`Xác nhận xóa danh mục [${id}]?`)) {
        fetch(`${API_URL}/categories/${id}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + localStorage.getItem("accessToken") }
        }).then(res => {
            if (res.ok) {
                loadCategories();
            }
        });
    }
}

// ======================== QUẢN LÝ TÀI KHOẢN (READ / DELETE) ========================

function loadUsers() {
    fetch(`${API_URL}/users`, {
        headers: { "Authorization": "Bearer " + localStorage.getItem("accessToken") }
    })
    .then(res => res.json())
    .then(users => {
        const tableBody = document.getElementById("user-list-table");
        tableBody.innerHTML = "";
        
        users.forEach((user, index) => {
            const roleBadge = user.role === "admin" 
                ? `<span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold border border-red-200">Quản trị viên</span>` 
                : `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold border border-blue-200">Khách hàng</span>`;
            
            const deleteAction = user.role === "admin" 
                ? `<span class="text-gray-400 text-xs italic">Bảo vệ hệ thống</span>` 
                : `<button type="button" onclick="deleteUser(${user.id})" class="text-primary hover:text-red-700 font-medium"><i class="fa-solid fa-user-xmark"></i> Xóa tài khoản</button>`;

            tableBody.innerHTML += `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-3 font-semibold text-lg text-gray-800">${index + 1}</td>
                    <td class="p-3 font-medium text-gray-900">${user.name || 'Chưa cập nhật'}</td>
                    <td class="p-3 text-gray-600 font-mono">${user.email}</td>
                    <td class="p-3 text-gray-600">${user.phone || 'Chưa khai báo'}</td>
                    <td class="p-3">${roleBadge}</td>
                    <td class="p-3 text-right">${deleteAction}</td>
                </tr>
            `;
        });
    })
    .catch(err => console.error(err));
}

function deleteUser(id) {
    if(confirm("Xác nhận xóa vĩnh viễn tài khoản người dùng này?")) {
        fetch(`${API_URL}/users/${id}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + localStorage.getItem("accessToken") }
        }).then(res => {
            if (res.ok) {
                loadUsers(); 
            } else {
                alert("Lỗi phân quyền hệ thống!");
            }
        });
    }
}

// ======================== QUẢN LÝ ĐƠN HÀNG ========================

function loadOrders() {
    const token = localStorage.getItem("accessToken");
    
    Promise.all([
        fetch(`${API_URL}/orders`, { headers: { "Authorization": `Bearer ${token}` } }).then(res => res.json()),
        fetch(`${API_URL}/users`, { headers: { "Authorization": `Bearer ${token}` } }).then(res => res.json())
    ])
    .then(([orders, users]) => {
        const tableBody = document.getElementById("order-list-table");
        tableBody.innerHTML = "";
        
        const displayOrders = [...orders].reverse();

        displayOrders.forEach(order => {
            try {
                const customer = users.find(u => u.id == order.userId);
                const customerName = customer ? customer.name : "Khách ẩn danh";
                
                let productNames = "Chưa rõ sản phẩm";
                if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                    productNames = order.items.map(item => {
                        const itemName = item.name || "Sản phẩm không xác định";
                        const itemQty = item.quantity || 1;
                        return `<div class="truncate w-48" title="${itemName}">${itemName} <span class="text-xs text-gray-500 font-medium">x${itemQty}</span></div>`;
                    }).join("");
                }

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
                    quickApproveBtn = `<button type="button" onclick="approveOrder('${order.id}')" class="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1 rounded text-xs transition-colors">Duyệt đơn</button>`;
                } else {
                    quickApproveBtn = `<span class="text-xs text-gray-400 font-medium italic">Đã xử lý</span>`;
                }

                tableBody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3 font-semibold text-gray-700 text-xs">${order.id}</td>
                        <td class="p-3 text-gray-600">ID: ${order.userId}</td>
                        <td class="p-3 font-medium text-gray-900">${customerName}</td>
                        <td class="p-3 text-gray-800 text-xs font-medium">${productNames}</td>
                        <td class="p-3 text-gray-500 text-xs">${displayDate}</td>
                        <td class="p-3 text-primary font-bold">${Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ</td>
                        <td class="p-3"><span class="px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${badgeClass}">${order.status}</span></td>
                        <td class="p-3 text-center">${quickApproveBtn}</td>
                        <td class="p-3 text-right">
                            <select onchange="updateOrderStatus('${order.id}', this.value)" class="border rounded p-1 text-xs outline-none bg-white cursor-pointer hover:border-gray-400">
                                <option value="">-- Sửa --</option>
                                <option value="Chờ duyệt" ${order.status === 'Chờ duyệt' ? 'selected' : ''}>Chờ duyệt</option>
                                <option value="Đang giao" ${order.status === 'Đang giao' ? 'selected' : ''}>Đang giao</option>
                                <option value="Hoàn thành" ${order.status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
                                <option value="Đã hủy" ${order.status === 'Đã hủy' ? 'selected' : ''}>Hủy đơn</option>
                            </select>
                        </td>
                    </tr>
                `;
            } catch (err) {
                console.error("Lỗi khi render đơn hàng: ", order.id, err);
            }
        });
    })
    .catch(err => {
        console.error("Lỗi khi tải dữ liệu đơn hàng:", err);
        document.getElementById("order-list-table").innerHTML = `<tr><td colspan="9" class="p-4 text-center text-red-500">Lỗi kết nối máy chủ!</td></tr>`;
    });
}

function approveOrder(orderId) {
    if (confirm(`Xác nhận duyệt và chuyển đơn hàng [${orderId}] sang trạng thái "Đang giao"?`)) {
        fetch(`${API_URL}/orders/${orderId}`, {
            method: "PATCH",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            body: JSON.stringify({ status: "Đang giao" })
        })
        .then(res => {
            if (res.ok) {
                alert("Duyệt đơn hàng thành công!");
                loadOrders(); 
            } else {
                alert("Duyệt đơn thất bại. Lỗi từ máy chủ!");
            }
        });
    }
}

function updateOrderStatus(orderId, newStatus) {
    if (!newStatus) return;
    
    fetch(`${API_URL}/orders/${orderId}`, {
        method: "PATCH",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("accessToken")
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(res => {
        if (res.ok) {
            loadOrders(); 
        } else {
            alert("Thay đổi trạng thái thất bại.");
        }
    });
}

function logoutAdmin() {
    localStorage.clear(); 
    window.location.replace("login.html");
}