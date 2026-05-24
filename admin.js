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
        books: "Quản lý Sản phẩm / Sách",
        categories: "Quản lý Danh mục",
        users: "Quản lý Tài khoản",
        orders: "Quản lý Đơn hàng"
    };
    document.getElementById('page-title').innerText = titles[tabName];
}

function loadBooks() {
    fetch(`${API_URL}/products`)
        .then(res => res.json())
        .then(books => {
            const tableBody = document.getElementById("book-list-table");
            tableBody.innerHTML = "";
            books.forEach(book => {
                tableBody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3">#${book.id}</td>
                        <td class="p-3"><img src="${book.image || 'images/fan-fujihome.webp'}" class="w-10 h-10 object-contain border p-1 rounded bg-white"></td>
                        <td class="p-3 font-medium">${book.name}</td>
                        <td class="p-3">${book.category || ''}</td>
                        <td class="p-3 text-primary font-semibold">${Number(book.price).toLocaleString('vi-VN')}đ</td>
                        <td class="p-3 text-right">
                            <button onclick="editBook(${book.id})" class="text-blue-600 px-2 py-1"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteBook(${book.id})" class="text-primary px-2 py-1"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        });
}

function deleteBook(id) {
    if (confirm("Xác nhận xoá?")) {
        fetch(`${API_URL}/products/${id}`, { method: "DELETE" })
            .then(() => loadBooks());
    }
}

function openModal(type, id = null) {
    document.getElementById("form-modal").classList.remove("hidden");
    if(id) {
        document.getElementById("modal-title").innerText = "Chỉnh sửa Sách / SP";
        fetch(`${API_URL}/products/${id}`)
            .then(res => res.json())
            .then(data => {
                document.getElementById("edit-id").value = data.id;
                document.getElementById("input-name").value = data.name;
                document.getElementById("input-price").value = data.price;
                document.getElementById("input-category").value = data.category || "";
                document.getElementById("input-image").value = data.image || "";
            });
    } else {
        document.getElementById("modal-title").innerText = "Thêm Sách / SP";
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

function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("edit-id").value;
    const bookData = {
        name: document.getElementById("input-name").value,
        price: Number(document.getElementById("input-price").value),
        category: document.getElementById("input-category").value,
        image: document.getElementById("input-image").value || "images/fan-fujihome.webp"
    };

    const method = id ? "PUT" : "POST";
    const endpoint = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;

    fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)
    }).then(() => {
        closeModal();
        loadBooks();
    });
}

function loadOrders() {
    fetch(`${API_URL}/orders`)
        .then(res => res.json())
        .then(orders => {
            const tableBody = document.getElementById("order-list-table");
            tableBody.innerHTML = "";
            orders.forEach(order => {
                let badgeClass = "bg-yellow-100 text-yellow-800";
                if (order.status === "Đã nhận hàng" || order.status === "Thành công") badgeClass = "bg-green-100 text-green-800";
                if (order.status === "Đã hủy") badgeClass = "bg-red-100 text-red-800";

                tableBody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3">#${order.id}</td>
                        <td class="p-3">${order.customerName || ''}</td>
                        <td class="p-3">${order.date || ''}</td>
                        <td class="p-3 font-medium">${Number(order.totalAmount).toLocaleString('vi-VN')}đ</td>
                        <td class="p-3"><span class="px-2 py-1 rounded text-xs font-semibold ${badgeClass}">${order.status}</span></td>
                        <td class="p-3 text-right">
                            <select onchange="updateOrderStatus(${order.id}, this.value)" class="border rounded p-1 text-xs outline-none">
                                <option value="">Thay đổi</option>
                                <option value="Chờ xác nhận">Chờ xác nhận</option>
                                <option value="Đang xử lý">Đang xử lý</option>
                                <option value="Đang vận chuyển">Đang vận chuyển</option>
                                <option value="Đã nhận hàng">Đã nhận hàng</option>
                                <option value="Đã hủy">Hủy</option>
                            </select>
                        </td>
                    </tr>
                `;
            });
        });
}

function updateOrderStatus(orderId, newStatus) {
    if(!newStatus) return;
    fetch(`${API_URL}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
    }).then(res => {
        if(res.ok) loadOrders();
    });
}

function logoutAdmin() {
    localStorage.removeItem("accessToken");
    window.location.href = "login.html";
}