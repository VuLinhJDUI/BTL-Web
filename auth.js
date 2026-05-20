// Hàm tự chạy ngay lập tức khi file script được đọc
(function checkAuth() {
    const token = localStorage.getItem("accessToken");

    // Nếu không tìm thấy Token trong localStorage
    if (!token) {
        alert("Bạn cần phải đăng nhập để truy cập tính năng này!");
        // Trục xuất người dùng về trang đăng nhập
        window.location.href = "login.html";
    }
})();