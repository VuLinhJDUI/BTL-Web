(function checkAuth() {
    const token = localStorage.getItem("accessToken");

    // Nếu không tìm thấy Token trong localStorage
    if (!token) {
        alert("Bạn cần phải đăng nhập để truy cập tính năng này!");
        window.location.href = "login.html";
    }
})();