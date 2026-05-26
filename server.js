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
const requireAuth = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: "Vui lòng đăng nhập để thực hiện thao tác này!" });
    req.token = token; 
    next();
};

const requireAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token || !token.includes('role:admin')) {
        return res.status(403).json({ error: "Từ chối truy cập. Chỉ Admin mới có quyền này!" });
    }
    next();
};

// ROUTES: AUTHENTICATION
app.post('/register', (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const db = readDB();

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ các thông tin yêu cầu!" });
        }

        const isDuplicate = db.users.some(u => u.email === email || u.phone === phone);
        if (isDuplicate) {
            return res.status(400).json({ error: "Địa chỉ email hoặc Số điện thoại này đã được đăng ký tài khoản!" });
        }

        const nextId = db.users.length > 0 ? Math.max(...db.users.map(u => Number(u.id) || 0)) + 1 : 1;

        const newUser = {
            id: nextId,
            email: email,
            phone: phone,
            password: password,
            name: name,
            role: "customer"
        };

        db.users.push(newUser);
        writeDB(db);

        return res.status(201).json({ message: "Đăng ký thành công!", userId: nextId });
    } catch (error) {
        return res.status(500).json({ error: "Lỗi xử lý dữ liệu trên máy chủ!" });
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body; 
    const db = readDB();
    
    const user = db.users.find(u => 
        (u.email === email || u.phone === email) && u.password === password
    );

    if (user) {
        const fakeToken = `Bearer role:${user.role}-id:${user.id}-${Date.now()}`;
        const { password: _, ...userInfo } = user; 
        res.status(200).json({ accessToken: fakeToken, user: userInfo });
    } else {
        res.status(401).json({ error: "Tài khoản hoặc mật khẩu không chính xác!" });
    }
});

// ROUTES: PRODUCTS
app.get('/products', (req, res) => { res.json(readDB().products); });

app.get('/products/:id', (req, res) => {
    const product = readDB().products.find(p => p.id === req.params.id);
    if (product) res.status(200).json(product);
    else res.status(404).json({ error: "Không tìm thấy sản phẩm." });
});

app.post('/products', requireAdmin, (req, res) => {
    const db = readDB();
    const newProduct = { id: "sp" + Date.now(), ...req.body };
    db.products.push(newProduct);
    writeDB(db);
    res.status(201).json({ message: "Thêm sản phẩm thành công", product: newProduct });
});

app.put('/products/:id', requireAdmin, (req, res) => {
    const db = readDB();
    const index = db.products.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        db.products[index] = { ...db.products[index], ...req.body, id: req.params.id };
        writeDB(db);
        res.json({ message: "Cập nhật thành công", product: db.products[index] });
    } else { res.status(404).json({ error: "Không tìm thấy sản phẩm." }); }
});

app.delete('/products/:id', requireAdmin, (req, res) => {
    const db = readDB();
    const initialLength = db.products.length;
    db.products = db.products.filter(p => p.id !== req.params.id);
    if (db.products.length < initialLength) {
        writeDB(db);
        res.json({ message: "Đã xóa sản phẩm thành công!" });
    } else { res.status(404).json({ error: "Không tìm thấy mã sản phẩm." }); }
});

// ROUTES: CATEGORIES & ORDERS
app.get('/categories', (req, res) => { res.json(readDB().categories); });

app.post('/orders', requireAuth, (req, res) => {
    const db = readDB();
    db.orders.push(req.body);
    writeDB(db);
    res.status(201).json({ message: "Đặt hàng thành công", order: req.body });
});

app.get('/orders', requireAuth, (req, res) => {
    const db = readDB();
    if (req.token.includes('role:admin')) { res.json(db.orders); }
    else {
        const userIdMatch = req.token.match(/id:(\d+)/);
        const userId = userIdMatch ? parseInt(userIdMatch[1]) : null;
        res.json(db.orders.filter(order => Number(order.userId) === Number(userId)));
    }
});

app.patch('/orders/:id', requireAdmin, (req, res) => {
    const db = readDB();
    const order = db.orders.find(o => o.id === req.params.id);
    if (order) {
        order.status = req.body.status;
        writeDB(db);
        res.status(200).json({ message: "Cập nhật đơn hàng thành công", order });
    } else { res.status(404).json({ error: "Không tìm thấy thông tin đơn hàng." }); }
});

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`\n🚀 Máy chủ Node.js (ONLYFAN) đang chạy tại: http://localhost:${PORT}`);
});