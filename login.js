document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const passwordInput = document.getElementById("password");
    const togglePasswordBtn = document.querySelector(".password-toggle");

    // 1. CHỨC NĂNG ẨN/HIỆN MẬT KHẨU (Điểm cộng UI/UX)
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener("click", () => {
            // Kiểm tra type hiện tại và đảo ngược nó
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            
            // Đổi icon con mắt
            togglePasswordBtn.classList.toggle("fa-eye");
            togglePasswordBtn.classList.toggle("fa-eye-slash");
        });
    }

    // 2. XỬ LÝ GỬI FORM ĐĂNG NHẬP
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault(); // Ngăn trình duyệt reload lại trang

            // Lấy giá trị từ các ô input
            const phone = document.getElementById("phone").value.trim();
            const password = passwordInput.value.trim();

            // Validate dữ liệu trống
            if (!phone || !password) {
                alert("Vui lòng nhập đầy đủ Số điện thoại và Mật khẩu!");
                return;
            }

            // Tạo payload dữ liệu. 
            // Do json-server-auth dùng "email" làm key đăng nhập mặc định, 
            // ta map (gắn) giá trị phone vào trường email.
            const loginData = {
                email: phone, 
                password: password
            };

            // Gọi API POST lên json-server-auth
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
                // Xử lý khi đăng nhập thành công
                alert("Đăng nhập thành công!");
                
                // Lưu Token và Thông tin User vào LocalStorage để dùng cho các trang khác
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("user", JSON.stringify(data.user));

                // Chuyển hướng người dùng về trang chủ
                window.location.href = "index.html";
            })
            .catch(error => {
                // Xử lý khi đăng nhập thất bại
                alert(error.message);
                console.error("Lỗi đăng nhập:", error);
            });
        });
    }
});