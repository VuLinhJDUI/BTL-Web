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

// ======================== API SẢN PHẨM (PRODUCTS) ========================

// 1. Lấy danh sách toàn bộ sản phẩm
app.get('/products', (req, res) => {
    const db = readDB();
    res.json(db.products);
});

// 2. Lấy thông tin chi tiết của 1 sản phẩm
app.get('/products/:id', (req, res) => {
    const productId = req.params.id;
    const db = readDB();
    const product = db.products.find(p => p.id === productId);

    if (product) {
        res.status(200).json(product);
    } else {
        res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }
});

// Thêm mới sản phẩm (POST)
app.post('/products', (req, res) => {
    const db = readDB();
    const newProduct = req.body;
    
    // Tự sinh mã sản phẩm dạng số tăng dần (sp01, sp02, sp03...)
    const maxIdNum = db.products.reduce((max, p) => {
        const num = parseInt(p.id.replace('sp', ''));
        return num > max ? num : max;
    }, 0);
    newProduct.id = `sp${String(maxIdNum + 1).padStart(2, '0')}`;
    
    // Bổ sung các trường spec/mô tả mặc định nếu form để trống để tránh lỗi giao diện client
    if (!newProduct.specs) {
        newProduct.specs = { speeds: "3 cấp độ", power: "60W" };
    }
    newProduct.rating = 5;
    newProduct.stock = 50;

    db.products.push(newProduct);
    writeDB(db);
    res.status(201).json(newProduct);
});

// Chỉnh sửa sản phẩm (PUT)
app.put('/products/:id', (req, res) => {
    const productId = req.params.id;
    const db = readDB();
    const index = db.products.findIndex(p => p.id === productId);

    if (index !== -1) {
        // Giữ nguyên ID, các trường cấu hình sâu và cập nhật dữ liệu từ form
        db.products[index] = { ...db.products[index], ...req.body, id: productId };
        writeDB(db);
        res.status(200).json(db.products[index]);
    } else {
        res.status(404).json({ error: "Không tìm thấy sản phẩm cần sửa" });
    }
});

// Xóa sản phẩm (DELETE)
app.delete('/products/:id', (req, res) => {
    const productId = req.params.id;
    const db = readDB();
    const index = db.products.findIndex(p => p.id === productId);

    if (index !== -1) {
        db.products.splice(index, 1);
        writeDB(db);
        res.status(200).json({ message: "Xóa sản phẩm thành công" });
    } else {
        res.status(404).json({ error: "Sản phẩm không tồn tại" });
    }
});


// ======================== API DANH MỤC (CATEGORIES) ========================

// Lấy danh sách danh mục
app.get('/categories', (req, res) => {
    const db = readDB();
    res.json(db.categories);
});

// Thêm mới danh mục (POST)
app.post('/categories', (req, res) => {
    const db = readDB();
    const newCategory = req.body;

    // Nếu người dùng không nhập mã danh mục custom, hệ thống tự sinh dạng (cat01, cat02...)
    if (!newCategory.id) {
        const maxIdNum = db.categories.reduce((max, c) => {
            const num = parseInt(c.id.replace('cat', ''));
            return num > max ? num : max;
        }, 0);
        newCategory.id = `cat${String(maxIdNum + 1).padStart(2, '0')}`;
    }

    // Kiểm tra trùng ID danh mục
    const existingCat = db.categories.find(c => c.id === newCategory.id);
    if (existingCat) {
        return res.status(400).json({ error: "Mã danh mục này đã tồn tại!" });
    }

    db.categories.push(newCategory);
    writeDB(db);
    res.status(201).json(newCategory);
});

// Chỉnh sửa danh mục (PUT)
app.put('/categories/:id', (req, res) => {
    const catId = req.params.id;
    const db = readDB();
    const index = db.categories.findIndex(c => c.id === catId);

    if (index !== -1) {
        db.categories[index].name = req.body.name;
        writeDB(db);
        res.status(200).json(db.categories[index]);
    } else {
        res.status(404).json({ error: "Không tìm thấy danh mục" });
    }
});

// Xóa danh mục (DELETE)
app.delete('/categories/:id', (req, res) => {
    const catId = req.params.id;
    const db = readDB();
    const index = db.categories.findIndex(c => c.id === catId);

    if (index !== -1) {
        db.categories.splice(index, 1);
        writeDB(db);
        res.status(200).json({ message: "Xóa danh mục thành công" });
    } else {
        res.status(404).json({ error: "Danh mục không tồn tại" });
    }
});


// ======================== API TÀI KHOẢN (USERS) ========================

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

app.post('/users', (req, res) => {
    const { email, password, name, phone } = req.body;
    const db = readDB();

    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: "Email này đã được đăng ký!" });
    }

    const maxId = db.users.reduce((max, user) => user.id > max ? user.id : max, 0);

    const newUser = {
        id: maxId + 1,
        email: email,
        password: password,
        name: name,
        phone: phone,
        role: "customer"
    };

    db.users.push(newUser);
    writeDB(db);
    res.status(201).json({ message: "Đăng ký thành công!", user: newUser });
});

app.get('/users', (req, res) => {
    const db = readDB();
    const safeUsers = db.users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
    });
    res.json(safeUsers);
});

app.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
        db.users.splice(userIndex, 1);
        writeDB(db);
        res.status(200).json({ message: "Xóa tài khoản thành công" });
    } else {
        res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
});


// ======================== API ĐƠN HÀNG (ORDERS) ========================

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

app.post('/orders', (req, res) => {
    const newOrder = req.body;
    const db = readDB();
    db.orders.push(newOrder);
    writeDB(db);
    res.status(201).json(newOrder);
});

app.patch('/orders/:id', (req, res) => {
    const orderId = req.params.id;
    const newStatus = req.body.status;
    const db = readDB();
    const orderIndex = db.orders.findIndex(o => o.id === orderId);

    if (orderIndex !== -1) {
        db.orders[orderIndex].status = newStatus;
        writeDB(db);
        res.status(200).json(db.orders[orderIndex]);
    } else {
        res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Máy chủ đang chạy tại: http://localhost:${PORT}`);
});