document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const passwordInput = document.getElementById("password");
    const togglePasswordBtn = document.querySelector(".password-toggle");

    // 1. CHỨC NĂNG ẨN/HIỆN MẬT KHẨU (Điểm cộng UI/UX)
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener("click", () => {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            
            togglePasswordBtn.classList.toggle("fa-eye");
            togglePasswordBtn.classList.toggle("fa-eye-slash");
        });
    }

    // 2. XỬ LÝ GỬI FORM ĐĂNG NHẬP (Chấp nhận cả Email hoặc Số điện thoại)
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault(); // Ngăn trình duyệt reload lại trang

            // Lấy giá trị từ ô nhập tài khoản (Nhận cả Email hoặc SĐT)
            const usernameInput = document.getElementById("phone").value.trim();
            const password = passwordInput.value.trim();

            if (!usernameInput || !password) {
                alert("Vui lòng nhập đầy đủ thông tin tài khoản và mật khẩu!");
                return;
            }

            // Đóng gói payload gửi lên server qua key 'email' định danh
            const loginData = {
                email: usernameInput, 
                password: password
            };

            // Gọi API POST tới Node.js Server
            fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Tài khoản hoặc mật khẩu không chính xác!");
                }
                return response.json();
            })
            .then(data => {
                alert("Đăng nhập thành công!");
                
                // Lưu Token, userId và quyền hạn role tách biệt vào LocalStorage
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("userId", data.user.id);
                localStorage.setItem("role", data.user.role || "customer");
                localStorage.setItem("user", JSON.stringify(data.user));

                // Phân quyền điều hướng trang giao diện (UI)
                if (data.user.role === "admin") {
                    window.location.href = "admin.html"; // Tài khoản quản trị vào Dashboard
                } else {
                    window.location.href = "index.html"; // Khách hàng về trang chủ mua sắm
                }
            })
            .catch(error => {
                alert(error.message);
                console.error("Lỗi đăng nhập hệ thống:", error);
            });
        });
    }
});