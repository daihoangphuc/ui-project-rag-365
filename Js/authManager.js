import { API_BASE_URL } from './apiConfig.js';

let authToken = null;
let currentUser = null;

async function loadUserInfo() {
    try {
        const token = localStorage.getItem('authToken');
        console.log('loadUserInfo: Token from localStorage:', token ? 'EXISTS' : 'NOT_FOUND');
        
        if (token) {
            setAuthToken(token);
        }
        
        const apiUrl = `${API_BASE_URL}/api/auths/me`;
        console.log('loadUserInfo: Making request to:', apiUrl);
        
        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('loadUserInfo: Success, user data:', response.data);
        
        // Endpoint /api/auths/me trả về trực tiếp UserInfoResponse
        // Vì vậy, response.data đã là đối tượng người dùng
        currentUser = response.data;
        
        return currentUser;
    } catch (error) {
        console.error('Error loading user info:', error);
        console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url
        });
        
        // Nếu có lỗi xác thực, xóa token và chuyển hướng đến trang đăng nhập
        if (error.response && error.response.status === 401) {
            console.log('loadUserInfo: 401 error, clearing token and redirecting to login');
            localStorage.removeItem('authToken');
            authToken = null;
            window.location.href = 'login.html';
        }
        throw error;
    }
}

function setAuthToken(token) {
    authToken = token;
}

function getAuthToken() {
    return authToken;
}

function getCurrentUser() {
    return currentUser;
}

async function logout() {
    try {
        // Xóa token xác thực
        localStorage.removeItem('authToken');
        authToken = null;
        
        // Chuyển hướng đến trang đăng nhập
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// Xuất các hàm để sử dụng trong các module khác
export { loadUserInfo, setAuthToken, getAuthToken, getCurrentUser, logout };