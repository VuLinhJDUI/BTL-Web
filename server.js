const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json()); 

const dbPath = path.join(__dirname, 'db.json');

const readDB = () => {
    const rawData = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(rawData);
};

const writeDB = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

// Lấy danh sách toàn bộ sản phẩm
app.get('/products', (req, res) => {
    const db = readDB();
    res.json(db.products);
});

// BỔ SUNG: API GET lấy thông tin chi tiết của 1 sản phẩm theo ID (Dùng cho trang Chi tiết)
app.get('/products/:id', (req, res) => {
    const productId = req.params.id; // Lấy mã ID từ URL (Ví dụ: 'sp02')
    const db = readDB();

    // Tìm sản phẩm trong mảng dựa vào ID
    const product = db.products.find(p => p.id === productId);

    if (product) {
        // Nếu tìm thấy, trả về dữ liệu của sản phẩm đó
        res.status(200).json(product);
    } else {
        // Nếu không tìm thấy, trả về lỗi 404
        res.status(404).json({ error: "Không tìm thấy thông tin sản phẩm này." });
    }
});

// Xử lý Đăng nhập
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email === email && u.password === password);

    if (user) {
        const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + Date.now();
        res.status(200).json({ accessToken: fakeToken, user: user });
    } else {
        res.status(401).json({ error: "Sai số điện thoại hoặc mật khẩu!" });
    }
});

// Lấy lịch sử đơn hàng
app.get('/orders', (req, res) => {
    const userId = parseInt(req.query.userId); 
    const db = readDB();

    if (userId) {
        const userOrders = db.orders.filter(order => order.userId === userId);
        res.json(userOrders);
    } else {
        res.json(db.orders);
    }
});

// Tạo đơn hàng mới
app.post('/orders', (req, res) => {
    const newOrder = req.body;
    const db = readDB();
    db.orders.push(newOrder);
    writeDB(db);
    res.status(201).json(newOrder);
});

app.listen(PORT, () => {
    console.log(`\n🚀 Máy chủ Node.js Backend đang chạy tại: http://localhost:${PORT}`);
});