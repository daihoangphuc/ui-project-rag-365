import { API_BASE_URL } from './apiConfig.js';
import { getAuthToken } from './authManager.js';
import { renderChatMessages } from './messageManager.js';

let currentSessionId = null;
let sessionBeingRenamed = null;

async function loadChatSessions(sessionsList, renderSessionsList) {
    try {
        const authToken = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/api/chats/sessions?page=1&page_size=10`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = response.data;
        renderSessionsList(data.sessions);
    } catch (error) {
        console.error('Error loading chat sessions:', error);
        // Nếu có lỗi xác thực, xóa token và chuyển hướng đến trang đăng nhập
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
    }
}

async function createNewSession(chatMessages) {
    try {
        const authToken = getAuthToken();
        const response = await axios.post(`${API_BASE_URL}/api/chats/sessions`, 
            { title: 'New Chat' },
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const session = response.data;
        currentSessionId = session.session_id;
        
        // Xóa tin nhắn trò chuyện
        chatMessages.innerHTML = '' +
            '<div class="max-w-4xl mx-auto space-y-6">' +
                '<div class="flex justify-center py-10 welcome-message-container">' +
                    '<div class="bg-white p-6 rounded-xl shadow-sm max-w-2xl border border-gray-100">' +
                        '<div class="flex items-center mb-4">' +
                            '<div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white mr-3">' +
                                '<i class="fas fa-robot"></i>' +
                            '</div>' +
                            '<div>' +
                                '<h3 class="font-semibold text-gray-800">RAG Assistant</h3>' +
                                '<p class="text-xs text-gray-500">AI Assistant</p>' +
                            '</div>' +
                        '</div>' +
                        '<div class="mt-2 text-gray-700">' +
                            '<p>Xin chào! Tôi là trợ lý RAG. Tôi có thể giúp gì cho bạn??</p>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        
        return session;
    } catch (error) {
        console.error('Error creating new session:', error);
        // Nếu có lỗi xác thực, xóa token và chuyển hướng đến trang đăng nhập
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
        throw error;
    }
}

async function loadSession(sessionId, chatMessages, renderChatMessages) {
    try {
        console.log('Loading session:', sessionId);
        
        // Cập nhật ID phiên hiện tại trước
        currentSessionId = sessionId;
        
        const authToken = getAuthToken();
        
        const response = await axios.get(`${API_BASE_URL}/api/chats/history?sessionId=${sessionId}&limit=50`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = response.data;
        renderChatMessages(data.messages, chatMessages);
        
        // Cập nhật giao diện người dùng để hiển thị phiên đang hoạt động
        document.querySelectorAll('.session-item').forEach(item => {
            const dropdownBtn = item.querySelector('.dropdown-btn');
            if (dropdownBtn && dropdownBtn.getAttribute('data-session-id') === sessionId) {
                item.classList.add('active', 'bg-primary-50', 'border-primary-200');
                item.classList.remove('bg-white', 'border-gray-200');
            } else {
                item.classList.remove('active', 'bg-primary-50', 'border-primary-200');
                item.classList.add('bg-white', 'border-gray-200');
            }
        });
        
        console.log('Session loaded successfully:', sessionId);
        return sessionId;
    } catch (error) {
        console.error('Error loading session:', error);
        // Nếu có lỗi xác thực, xóa token và chuyển hướng đến trang đăng nhập
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
        throw error;
    }
}

async function deleteSession(sessionId, chatMessages) {
    console.log('deleteSession called with sessionId:', sessionId);
    if (!sessionId) {
        console.log('No sessionId provided');
        return;
    }
    
    try {
        console.log('Attempting to delete session with API call');
        const authToken = getAuthToken();
        console.log('Auth token:', authToken);
        console.log('API URL:', `${API_BASE_URL}/api/chats/${sessionId}`);
        const response = await axios.delete(`${API_BASE_URL}/api/chats/${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        });
        console.log('Delete API response:', response);
        
        // Nếu đang xóa phiên hiện tại, hãy xóa tin nhắn trò chuyện và đặt lại phiên hiện tại
        console.log('Checking if current session needs to be replaced');
        console.log('Current session ID:', currentSessionId);
        console.log('Deleted session ID:', sessionId);
        if (currentSessionId === sessionId) {
            console.log('Clearing current session after deletion');
            currentSessionId = null; // Đặt lại phiên hiện tại
            
            // Xóa tin nhắn trò chuyện
            chatMessages.innerHTML = '' +
                '<div class="max-w-4xl mx-auto space-y-6">' +
                    '<div class="flex justify-center py-10 welcome-message-container">' +
                        '<div class="bg-white p-6 rounded-xl shadow-sm max-w-2xl border border-gray-100">' +
                            '<div class="flex items-center mb-4">' +
                                '<div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white mr-3">' +
                                    '<i class="fas fa-robot"></i>' +
                                '</div>' +
                                '<div>' +
                                    '<h3 class="font-semibold text-gray-800">RAG Assistant</h3>' +
                                    '<p class="text-xs text-gray-500">AI Assistant</p>' +
                                '</div>' +
                            '</div>' +
                            '<div class="mt-2 text-gray-700">' +
                                '<p>Xin chào! Tôi là trợ lý RAG. Tôi có thể giúp gì cho bạn??</p>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        } else {
            console.log('Not clearing chat messages, deleted session was not current');
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting session:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response,
            status: error.response ? error.response.status : 'No response',
            data: error.response ? error.response.data : 'No response data'
        });
        
        // Xử lý các trường hợp lỗi cụ thể
        if (error.response) {
            if (error.response.status === 404) {
                alert('Không tìm thấy phiên hoặc bạn không có quyền xóa phiên đó.');
            } else if (error.response.status === 401) {
                // Nếu có lỗi xác thực, xóa token và chuyển hướng đến trang đăng nhập
                localStorage.removeItem('authToken');
                window.location.href = 'login.html';
            } else {
                alert('Lỗi xóa phiên. Vui lòng thử lại.');
            }
        } else {
            alert('Lỗi xóa phiên. Vui lòng thử lại.');
        }
        
        throw error;
    }
}

async function renameSession(sessionId, newTitle) {
    if (!newTitle || !sessionId) return;
    
    try {
        const authToken = getAuthToken();
        const response = await axios.put(`${API_BASE_URL}/api/chats/${sessionId}/rename`, 
            { title: newTitle },
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const session = response.data;
        return session;
    } catch (error) {
        console.error('Error renaming session:', error);
        // Nếu có lỗi xác thực, xóa token và chuyển hướng đến trang đăng nhập
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
        throw error;
    }
}

function getCurrentSessionId() {
    return currentSessionId;
}

function setCurrentSessionId(sessionId) {
    currentSessionId = sessionId;
}

function setSessionBeingRenamed(sessionId) {
    sessionBeingRenamed = sessionId;
}

function getSessionBeingRenamed() {
    return sessionBeingRenamed;
}

function clearSessionBeingRenamed() {
    sessionBeingRenamed = null;
}

// Xuất các hàm để sử dụng trong các module khác
export { 
    loadChatSessions, 
    createNewSession, 
    loadSession, 
    deleteSession, 
    renameSession,
    getCurrentSessionId,
    setCurrentSessionId,
    setSessionBeingRenamed,
    getSessionBeingRenamed,
    clearSessionBeingRenamed
};