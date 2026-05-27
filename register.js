document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register-form");

    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault(); // Ngăn trình duyệt reload lại form

            // Lấy giá trị từ các ô nhập liệu
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const password = document.getElementById("password").value;

            // Kiểm tra rỗng
            if (!name || !email || !phone || !password) {
                alert("Vui lòng nhập đầy đủ thông tin!");
                return;
            }

            const userData = { name, email, phone, password };

            // Gửi dữ liệu đăng ký tới Node.js Backend
            fetch("http://localhost:3000/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(errData.error || "Không thể đăng ký tài khoản.");
                    });
                }
                return response.json(); 
            })
            .then(data => {
                // ĐÃ SỬA: Thay vì tự đăng nhập và nhảy sang index.html,
                // hệ thống sẽ yêu cầu người dùng sang trang Đăng nhập
                alert("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.");
                
                // Điều hướng sang trang login.html (Cùng thư mục)
                setTimeout(() => {
                    const currentUrl = window.location.href;
                    const targetUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/')) + '/login.html';
                    window.location.assign(targetUrl);
                }, 100); 
            })
            .catch(error => {
                alert(error.message);
                console.error("Lỗi đăng ký hệ thống:", error);
            });
        });
    }
});