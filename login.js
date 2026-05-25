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

    // 2. XỬ LÝ GỬI FORM ĐĂNG NHẬP
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const phone = document.getElementById("phone").value.trim();
            const password = passwordInput.value.trim();

            if (!phone || !password) {
                alert("Vui lòng nhập đầy đủ Số điện thoại và Mật khẩu!");
                return;
            }

            const loginData = {
                email: phone, 
                password: password
            };

            fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Sai số điện thoại hoặc mật khẩu!");
                }
                return response.json();
            })
            .then(data => {
                alert("Đăng nhập thành công!");
                
                // === BỔ SUNG AUTH: Lưu token, userId và role riêng biệt vào localStorage ===
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("userId", data.user.id);
                localStorage.setItem("role", data.user.role || "customer");
                localStorage.setItem("user", JSON.stringify(data.user));

                // === PHÂN QUYỀN ĐIỀU HƯỚNG UI ===
                if (data.user.role === "admin") {
                    window.location.href = "admin.html"; // Admin vào trang quản trị
                } else {
                    window.location.href = "index.html"; // Khách hàng về trang chủ
                }
            })
            .catch(error => {
                alert(error.message);
                console.error("Lỗi đăng nhập:", error);
            });
        });
    }
});