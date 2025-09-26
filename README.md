# RAG Chatbot UI

Giao diện web cho hệ thống RAG (Retrieval-Augmented Generation) Chatbot.

## 🚀 Demo

Truy cập ứng dụng tại: [GitHub Pages URL sẽ được cập nhật sau khi deploy]

## 📋 Tính năng

- **Đăng nhập/Đăng ký**: Hệ thống xác thực người dùng
- **Chat Interface**: Giao diện chat thân thiện với người dùng
- **Admin Panel**: Quản lý hệ thống cho admin
- **Responsive Design**: Tương thích với mọi thiết bị
- **Modern UI**: Sử dụng Tailwind CSS

## 🛠️ Công nghệ sử dụng

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Icons**: Font Awesome
- **HTTP Client**: Axios
- **Backend**: Python HTTP Server (development)

## 📁 Cấu trúc thư mục

```
UI/
├── Html/                 # Các trang HTML
│   ├── login.html       # Trang đăng nhập
│   ├── register.html    # Trang đăng ký
│   ├── chat.html        # Trang chat chính
│   ├── admin.html       # Trang quản trị
│   └── forgot-password.html
├── Css/                 # Stylesheets
│   └── styles.css
├── Js/                  # JavaScript modules
│   ├── apiConfig.js     # Cấu hình API
│   ├── authManager.js   # Quản lý xác thực
│   ├── messageManager.js # Quản lý tin nhắn
│   ├── uiManager.js     # Quản lý giao diện
│   └── ...
└── index.html         # Trang chủ (chuyển hướng)
```

## 🚀 Hướng dẫn sử dụng

### Development (Local)

1. Clone repository:
```bash
git clone [repository-url]
cd UI
```

2. Mở file `index.html` bằng Live Server hoặc serve bằng HTTP server:
```bash
# Sử dụng Python
python -m http.server 8080

# Hoặc sử dụng Node.js
npx serve .

# Hoặc mở trực tiếp index.html bằng trình duyệt
```

3. Truy cập: `http://localhost:8080`

### Production (GitHub Pages)

Ứng dụng được tự động deploy lên GitHub Pages khi push code lên branch `main`.

## 🔧 Cấu hình

- API endpoint được cấu hình trong `Js/apiConfig.js`
- Hiện tại sử dụng: `https://external.365sharing.org/test-chatbot-api`

## 📝 Ghi chú

- Đây là giao diện frontend, cần kết nối với backend API để hoạt động đầy đủ
- Ứng dụng sử dụng external API, không cần backend server riêng
- Hoàn toàn tương thích với GitHub Pages (static hosting)

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License.
