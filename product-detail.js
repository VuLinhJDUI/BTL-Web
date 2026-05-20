document.addEventListener("DOMContentLoaded", () => {
    // 1. LẤY ID SẢN PHẨM SÁCH TỪ URL (Ví dụ: product-detail.html?id=b01)
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    const qtyInput = document.getElementById("qty-input");
    const btnMinus = document.getElementById("btn-minus");
    const btnPlus = document.getElementById("btn-plus");
    
    let currentBook = null;

    // 2. LOGIC TĂNG GIẢM SỐ LƯỢNG (QUANTITY CONTROL)
    btnPlus.addEventListener("click", () => {
        let currentQty = parseInt(qtyInput.value) || 1;
        qtyInput.value = currentQty + 1;
    });

    btnMinus.addEventListener("click", () => {
        let currentQty = parseInt(qtyInput.value) || 1;
        if (currentQty > 1) {
            qtyInput.value = currentQty - 1;
        }
    });

    // 3. GỌI API ĐỂ LẤY CHI TIẾT SÁCH TỪ NODE.JS SERVER
    if (bookId) {
        fetch(`http://localhost:3000/products/${bookId}`)
            .then(res => {
                if (!res.ok) throw new Error("Không tìm thấy thông tin sách này.");
                return res.json();
            })
            .then(book => {
                currentBook = book;
                // Render dữ liệu sách lên HTML
                document.getElementById("book-title").textContent = book.name;
                document.getElementById("book-cover").src = book.image;
                document.getElementById("book-cover").alt = book.name;
                
                // Các trường tùy biến của sách (sẽ null nếu bạn chưa update db.json thành sách)
                document.getElementById("book-author").textContent = book.author || "Đang cập nhật";
                document.getElementById("book-translator").textContent = book.translator || "Không có / Nguyên tác";
                document.getElementById("book-pages").textContent = book.pages || "N/A";
                document.getElementById("book-cover-type").textContent = book.coverType || "Bìa mềm";
                document.getElementById("book-description").textContent = book.description || "Nội dung tóm tắt đang được cập nhật.";
                
                // Giá sách
                document.getElementById("book-price").textContent = book.price.toLocaleString('vi-VN') + 'đ';
                if (book.oldPrice) {
                    document.getElementById("book-old-price").textContent = book.oldPrice.toLocaleString('vi-VN') + 'đ';
                } else {
                    document.getElementById("book-old-price").style.display = 'none';
                }

                // Kích hoạt tính năng mua hàng sau khi đã tải xong dữ liệu sách
                initPurchaseEvents();
            })
            .catch(err => {
                console.error(err);
                document.querySelector(".detail-wrapper").innerHTML = `<p style="text-align: center; color: red; padding: 40px; width:100%; font-weight:600;">${err.message}</p>`;
            });
    }

    // 4. XỬ LÝ LƯU SẢN PHẨM VÀO GIỎ HÀNG (LOCALSTORAGE)
    function initPurchaseEvents() {
        const btnAddCart = document.getElementById("btn-add-to-cart");
        const btnBuyNow = document.getElementById("btn-buy-now");

        if (btnAddCart && btnBuyNow) {
            btnAddCart.addEventListener("click", () => handleAddToCart(false));
            btnBuyNow.addEventListener("click", () => handleAddToCart(true));
        }
    }

    function handleAddToCart(shouldRedirect) {
        if (!currentBook) return;

        const quantity = parseInt(qtyInput.value) || 1;
        // Đọc giỏ hàng cũ từ localStorage
        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        // Kiểm tra xem cuốn sách này đã nằm trong giỏ hàng chưa
        const existingIndex = cart.findIndex(item => item.id === currentBook.id);

        if (existingIndex > -1) {
            // Đã có thì cộng dồn số lượng
            cart[existingIndex].quantity += quantity;
        } else {
            // Chưa có thì thêm mới Object sách vào mảng giỏ hàng
            cart.push({
                id: currentBook.id,
                name: currentBook.name,
                price: currentBook.price,
                oldPrice: currentBook.oldPrice,
                image: currentBook.image,
                quantity: quantity
            });
        }

        // Lưu ngược lại mảng mới vào localStorage
        localStorage.setItem("cart", JSON.stringify(cart));

        if (shouldRedirect) {
            // Mua ngay -> Chuyển hướng sang trang giỏ hàng thanh toán
            window.location.href = "cart.html";
        } else {
            // Thêm vào giỏ -> Chỉ thông báo mượt mà cho user
            alert(`Đã thêm thành công ${quantity} cuốn "${currentBook.name}" vào giỏ hàng!`);
        }
    }
});