const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json()); 

const dbPath = path.join(__dirname, 'db.json');

const readDB = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const writeDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');


// MIDDLEWARE PHÂN QUYỀN

// 1. Kiểm tra xem người dùng đã đăng nhập chưa
const requireAuth = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: "Vui lòng đăng nhập để thực hiện thao tác này!" });
    
    req.token = token; 
    next();
};

// 2. Kiểm tra xem tài khoản có phải là Admin không
const requireAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token || !token.includes('role:admin')) {
        return res.status(403).json({ error: "Từ chối truy cập. Chỉ Admin mới có quyền này!" });
    }
    next();
};


// ROUTES: AUTHENTICATION (ĐĂNG NHẬP)

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const db = readDB();
    // Tìm user theo email (Frontend gửi phone qua trường email)
    const user = db.users.find(u => u.email === email && u.password === password);

    if (user) {
        // Tạo chuỗi token giả lập chứa Role và ID để Middleware dễ dàng giải mã
        const fakeToken = `Bearer role:${user.role}-id:${user.id}-${Date.now()}`;
        const { password, ...userInfo } = user; 
        res.status(200).json({ accessToken: fakeToken, user: userInfo });
    } else {
        res.status(401).json({ error: "Sai số điện thoại hoặc mật khẩu!" });
    }
});


// ROUTES: PRODUCTS (QUẠT ĐIỆN)

// Lấy danh sách toàn bộ sản phẩm quạt (Ai cũng xem được)
app.get('/products', (req, res) => {
    const db = readDB();
    res.json(db.products);
});

// Lấy thông tin chi tiết của 1 sản phẩm quạt theo ID
app.get('/products/:id', (req, res) => {
    const db = readDB();
    const product = db.products.find(p => p.id === req.params.id);
    
    if (product) {
        res.status(200).json(product);
    } else {
        res.status(404).json({ error: "Không tìm thấy thông tin sản phẩm quạt này." });
    }
});

// Thêm một sản phẩm quạt mới (Chỉ ADMIN)
app.post('/products', requireAdmin, (req, res) => {
    const db = readDB();
    const newProduct = { id: "sp" + Date.now(), ...req.body };
    
    db.products.push(newProduct);
    writeDB(db);
    res.status(201).json({ message: "Thêm sản phẩm thành công", product: newProduct });
});

// Xóa một sản phẩm quạt theo ID (Chỉ ADMIN)
app.delete('/products/:id', requireAdmin, (req, res) => {
    const db = readDB();
    const initialLength = db.products.length;
    db.products = db.products.filter(p => p.id !== req.params.id);
    
    if (db.products.length < initialLength) {
        writeDB(db);
        res.json({ message: "Đã xóa sản phẩm quạt thành công!" });
    } else {
        res.status(404).json({ error: "Không tìm thấy mã sản phẩm này để xóa." });
    }
});

// ROUTES: CATEGORIES (DANH MỤC QUẠT)

app.get('/categories', (req, res) => {
    res.json(readDB().categories);
});

// ROUTES: ORDERS (ĐƠN HÀNG)

// Tạo đơn hàng mới (Bắt buộc phải đăng nhập)
app.post('/orders', requireAuth, (req, res) => {
    const newOrder = req.body;
    const db = readDB();
    
    db.orders.push(newOrder);
    writeDB(db);
    res.status(201).json({ message: "Đặt hàng thành công", order: newOrder });
});

// Lấy lịch sử đơn hàng (Bắt buộc đăng nhập)
// - Admin: Xem được tất cả đơn hàng của hệ thống
// - Customer: Chỉ lọc và xem được đơn hàng của chính mình
app.get('/orders', requireAuth, (req, res) => {
    const db = readDB();
    const token = req.token;
    
    if (token.includes('role:admin')) {
        res.json(db.orders);
    } else {
        // Trích xuất User ID từ chuỗi token giả lập (ví dụ: id:2)
        const userIdMatch = token.match(/id:(\d+)/);
        const userId = userIdMatch ? parseInt(userIdMatch[1]) : null;
        
        const userOrders = db.orders.filter(order => order.userId === userId);
        res.json(userOrders);
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Máy chủ Node.js (ONLYFAN) đang chạy tại: http://localhost:${PORT}`);
});