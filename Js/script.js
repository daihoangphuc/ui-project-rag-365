// Nhập các mô-đun
import { API_BASE_URL } from './apiConfig.js';
import { loadUserInfo, setAuthToken, getAuthToken, getCurrentUser, logout } from './authManager.js';
import { loadChatSessions, createNewSession, loadSession, deleteSession, renameSession, getCurrentSessionId, setCurrentSessionId, setSessionBeingRenamed, getSessionBeingRenamed, clearSessionBeingRenamed } from './sessionManager.js';
import { sendMessage, showLoadingMessage, hideLoadingMessage, addUserMessageToUI, addAssistantMessageToUI, renderChatMessages } from './messageManager.js';
import { renderSessionsList, openRenameModalForSession, closeRenameModal, openRenameModal } from './uiManager.js';

// Các phần tử DOM
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const sessionsList = document.getElementById('sessionsList');
const newChatBtn = document.getElementById('newChatBtn');
const renameModal = document.getElementById('renameModal');
const sessionTitleInput = document.getElementById('sessionTitleInput');
const cancelRenameBtn = document.getElementById('cancelRenameBtn');
const saveRenameBtn = document.getElementById('saveRenameBtn');
const closeRenameModalBtn = document.getElementById('closeRenameModalBtn');
// Lưu ý: phần tử currentSessionTitle không còn tồn tại trong HTML vì chúng tôi đã xóa tiêu đề trò chuyện
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

// Trình nghe sự kiện
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Chat page: DOMContentLoaded started');
    
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const token = localStorage.getItem('authToken');
    console.log('Chat page: Token check:', token ? 'EXISTS' : 'NOT_FOUND');
    
    if (token) {
        setAuthToken(token);
        try {
            console.log('Chat page: Attempting to load user info...');
            const user = await loadUserInfo();
            console.log('Chat page: User loaded successfully:', user);
            
            userName.textContent = user.display_name || 'User';
            userEmail.textContent = user.email || 'user@example.com';
            
            // Hiển thị liên kết quản trị nếu người dùng có quyền quản trị
            const adminLink = document.getElementById('adminLink');
            
            // Kiểm tra xem người dùng có phải là quản trị viên dựa trên email hoặc vai trò không
            const isAdmin = user.email && (user.email.toLowerCase().includes('admin') || user.role === 'admin' || user.is_admin === true);
            console.log('Admin check:', { email: user.email, role: user.role, isAdmin });
            
            if (isAdmin) {
                console.log('Showing admin link for user');
                adminLink.classList.remove('hidden');
            }
            await loadChatSessions(sessionsList, async (sessions) => {
                renderSessionsList(sessions, sessionsList, loadSession);
                
                // Chỉ tạo một phiên mới nếu không có phiên nào tồn tại
                if (sessions.length === 0) {
                    console.log('No existing sessions, creating a new one');
                    const newSession = await createNewSession(chatMessages);
                    // Tải lại ngay lập tức các phiên để bao gồm phiên mới trong UI
                    await loadChatSessions(sessionsList, (updatedSessions) => {
                        renderSessionsList(updatedSessions, sessionsList, loadSession);
                    });
                } else {
                    // Tự động chọn phiên đầu tiên nếu hiện tại không có phiên nào được chọn
                    if (!getCurrentSessionId()) {
                        console.log('Loading the first existing session');
                        await loadSession(sessions[0].session_id, chatMessages, renderChatMessages);
                    } else {
                        // Tải phiên hiện tại nếu nó tồn tại
                        const currentSession = sessions.find(s => s.session_id === getCurrentSessionId());
                        if (currentSession) {
                            await loadSession(getCurrentSessionId(), chatMessages, renderChatMessages);
                        } else {
                            // Phiên hiện tại không tồn tại, tải phiên đầu tiên
                            await loadSession(sessions[0].session_id, chatMessages, renderChatMessages);
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Chat page: Error during initialization:', error);
            // Nếu có lỗi xác thực, hãy xóa mã thông báo và chuyển hướng để đăng nhập
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
    } else {
        console.log('Chat page: No token found, redirecting to login');
        // Chuyển hướng đến màn hình đăng nhập
        window.location.href = 'login.html';
    }
    
    // Ghi nhật ký các phần tử để kiểm tra xem chúng có tồn tại không
    console.log("renameModal:", renameModal);
    console.log("sessionTitleInput:", sessionTitleInput);
    console.log("cancelRenameBtn:", cancelRenameBtn);
    console.log("saveRenameBtn:", saveRenameBtn);
    
    // Thêm trình nghe sự kiện cho các nút phương thức sau khi DOM được tải đầy đủ
    if (cancelRenameBtn) {
        cancelRenameBtn.addEventListener('click', () => closeRenameModal(renameModal));
        console.log("Added event listener for cancelRenameBtn");
    } else {
        console.log("cancelRenameBtn not found");
    }
    
    if (saveRenameBtn) {
        saveRenameBtn.addEventListener('click', saveSessionRename);
        console.log("Added event listener for saveRenameBtn");
    } else {
        console.log("saveRenameBtn not found");
    }
    
    if (closeRenameModalBtn) {
        closeRenameModalBtn.addEventListener('click', () => closeRenameModal(renameModal));
        console.log("Added event listener for closeRenameModalBtn");
    } else {
        console.log("closeRenameModalBtn not found");
    }
});

// Thêm trình xử lý nhấp chuột để đóng menu thả xuống khi nhấp bên ngoài
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
    }
});

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessageHandler();
    }
});

sendMessageBtn.addEventListener('click', sendMessageHandler);
newChatBtn.addEventListener('click', () => createNewSessionHandler());
logoutBtn.addEventListener('click', logout);

// Các hàm
async function createNewSessionHandler() {
    try {
        console.log('Creating new session...');
        const session = await createNewSession(chatMessages);
        setCurrentSessionId(session.session_id);
        
        // Tải lại ngay danh sách phiên để bao gồm phiên mới
        await loadChatSessions(sessionsList, (sessions) => {
            renderSessionsList(sessions, sessionsList, loadSession);
            
            // Tìm và kích hoạt phiên mới trong thanh bên ngay lập tức
            setTimeout(() => {
                const newSessionElement = document.querySelector(`.dropdown-btn[data-session-id="${session.session_id}"]`)?.closest('.session-item');
                if (newSessionElement) {
                    // Xóa lớp đang hoạt động khỏi các phiên khác
                    document.querySelectorAll('.session-item').forEach(item => {
                        item.classList.remove('active', 'bg-primary-50', 'border-primary-200');
                        item.classList.add('bg-white', 'border-gray-200');
                    });
                    // Thêm lớp đang hoạt động vào phiên mới
                    newSessionElement.classList.add('active', 'bg-primary-50', 'border-primary-200');
                    newSessionElement.classList.remove('bg-white', 'border-gray-200');
                }
            }, 100);
        });
        
        console.log('New session created successfully:', session.session_id);
    } catch (error) {
        console.error('Error creating new session:', error);
        // Nếu có lỗi xác thực, hãy xóa mã thông báo và chuyển hướng để đăng nhập
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
    }
}

async function sendMessageHandler() {
    const message = messageInput.value.trim();
    const sessionId = getCurrentSessionId();
    if (!message || !sessionId) return;
    
    // Thêm tin nhắn của người dùng vào giao diện người dùng ngay lập tức
    addUserMessageToUI(message, chatMessages);
    
    // Xóa đầu vào
    messageInput.value = '';
    
    // Hiển thị thông báo đang tải
    const loadingElement = showLoadingMessage(chatMessages);
    
    try {
        const data = await sendMessage(message, sessionId, chatMessages, (content) => {
            // Ẩn thông báo đang tải trước khi hiển thị phản hồi
            hideLoadingMessage(chatMessages);
            addAssistantMessageToUI(content, chatMessages);
        });
        
        // Tải lại các phiên để cập nhật số lượng tin nhắn
        await loadChatSessions(sessionsList, (sessions) => {
            renderSessionsList(sessions, sessionsList, loadSession);
        });
    } catch (error) {
        console.error('Error sending message:', error);
        // Ẩn thông báo đang tải và hiển thị thông báo lỗi
        hideLoadingMessage(chatMessages);
        addAssistantMessageToUI("Xin lỗi, tôi đã gặp lỗi khi xử lý yêu cầu của bạn.", chatMessages);
        
        // Nếu có lỗi xác thực, hãy xóa mã thông báo và chuyển hướng để đăng nhập
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
    }
}

async function saveSessionRename() {
    console.log("Save session rename called");
    const newTitle = sessionTitleInput.value.trim();
    // Sử dụng sessionBeingRenamed thay vì currentSessionId để đổi tên menu thả xuống
    const sessionIdToRename = getSessionBeingRenamed() || getCurrentSessionId();
    
    if (!newTitle || !sessionIdToRename) {
        console.log("Missing title or session ID");
        return;
    }
    
    try {
        const session = await renameSession(sessionIdToRename, newTitle);
        
        // Cập nhật tiêu đề phiên trong thanh bên
        const sessionElement = document.querySelector(`.dropdown-btn[data-session-id="${sessionIdToRename}"]`).closest('.session-item');
        if (sessionElement) {
            sessionElement.querySelector('.font-medium').textContent = session.title;
        }
        
        // Đóng phương thức và đặt lại sessionBeingRenamed
        closeRenameModal(renameModal);
        clearSessionBeingRenamed();
        
        // Tải lại danh sách phiên để đảm bảo tính nhất quán
        await loadChatSessions(sessionsList, (sessions) => {
            renderSessionsList(sessions, sessionsList, loadSession);
        });
    } catch (error) {
        console.error('Error renaming session:', error);
        // Hiển thị thông báo lỗi cho người dùng
        alert('Lỗi đổi tên phiên. Vui lòng thử lại.');
        
        // Nếu có lỗi xác thực, hãy xóa mã thông báo và chuyển hướng để đăng nhập
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
    }
}