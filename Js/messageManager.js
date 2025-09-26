import { API_BASE_URL } from './apiConfig.js';
import { getAuthToken } from './authManager.js';

// Cấu hình các tùy chọn đã đánh dấu để bảo mật và định dạng tốt hơn
marked.setOptions({
    gfm: true, // Markdown có hương vị GitHub
    breaks: true, // Chuyển đổi \n thành <br>
    smartypants: true, // Dấu ngoặc kép và dấu gạch ngang đẹp hơn
    sanitize: false, // Chúng tôi sẽ khử trùng thủ công để kiểm soát nhiều hơn
    pedantic: false, // Đừng quá khắt khe về markdown gốc
    silent: false, // Hiển thị cảnh báo
    highlight: function(code, lang) {
        // Tô sáng cú pháp đơn giản - trong một ứng dụng thực tế, bạn có thể muốn sử dụng highlight.js hoặc Prism
        return code;
    }
});

// Hàm khử trùng XSS đơn giản
function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

async function sendMessage(message, sessionId, chatMessages, addAssistantMessageToUI) {
    if (!message || !sessionId) return;
    
    try {
        const authToken = getAuthToken();
        const response = await axios.post(`${API_BASE_URL}/api/chats/messages`, 
            {
                message: message,
                session_id: sessionId
            },
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const data = response.data;
        
        // Thêm phản hồi của trợ lý vào giao diện người dùng
        addAssistantMessageToUI(data.response);
        
        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

function showLoadingMessage(chatMessages) {
    const container = chatMessages.querySelector('.max-w-4xl');
    
    // Xóa mọi tin nhắn đang tải hiện có
    const existingLoading = container.querySelector('.loading-message-container');
    if (existingLoading) {
        existingLoading.remove();
    }
    
    const loadingElement = document.createElement('div');
    loadingElement.className = 'flex justify-start mb-4 loading-message-container';
    
    loadingElement.innerHTML = `
        <div class="max-w-2xl bg-white rounded-2xl rounded-bl-md shadow-sm p-4 border border-gray-100">
            <div class="flex items-center mb-2">
                <div class="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white mr-2">
                    <i class="fas fa-robot text-xs"></i>
                </div>
                <div>
                    <h3 class="font-semibold text-gray-800 text-sm">RAG Chatbot</h3>
                </div>
            </div>
            <div class="mt-1 text-gray-700">
                <p>Đang truy xuất thông tin <span class="loading-dots"></span></p>
                <div class="flex space-x-1 mt-2">
                    <div class="w-2 h-2 bg-gray-300 rounded-full loading-message"></div>
                    <div class="w-2 h-2 bg-gray-300 rounded-full loading-message" style="animation-delay: 0.2s"></div>
                    <div class="w-2 h-2 bg-gray-300 rounded-full loading-message" style="animation-delay: 0.4s"></div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(loadingElement);
    
    // Cuộn xuống dưới cùng
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return loadingElement;
}

function hideLoadingMessage(chatMessages) {
    const container = chatMessages.querySelector('.max-w-4xl');
    const loadingElement = container.querySelector('.loading-message-container');
    if (loadingElement) {
        loadingElement.remove();
    }
}

function addUserMessageToUI(content, chatMessages) {
    const container = chatMessages.querySelector('.max-w-4xl');
    
    // Xóa mọi tin nhắn đang tải hiện có khi người dùng gửi tin nhắn mới
    const existingLoading = container.querySelector('.loading-message-container');
    if (existingLoading) {
        existingLoading.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = 'flex justify-end mb-4';
    
    messageElement.innerHTML = `
        <div class="max-w-2xl bg-primary-500 text-white rounded-2xl rounded-br-md shadow-sm p-4 chat-message user-message">
            <div class="flex items-center mb-2">
                <div class="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white mr-2">
                    <i class="fas fa-user text-xs"></i>
                </div>
                <div>
                    <h3 class="font-semibold text-sm">You</h3>
                </div>
            </div>
            <div class="mt-1">
                <p class="whitespace-pre-wrap">${content}</p>
            </div>
        </div>
    `;
    
    container.appendChild(messageElement);
    
    // Cuộn xuống dưới cùng
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addAssistantMessageToUI(content, chatMessages) {
    const container = chatMessages.querySelector('.max-w-4xl');
    
    const messageElement = document.createElement('div');
    messageElement.className = 'flex justify-start mb-4';
    
    // Hiển thị nội dung markdown
    const renderedContent = marked.parse(content);
    
    messageElement.innerHTML = `
        <div class="max-w-2xl bg-white rounded-2xl rounded-bl-md shadow-sm p-4 chat-message assistant-message border border-gray-100 markdown-content">
            <div class="flex items-center mb-2">
                <div class="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white mr-2">
                    <i class="fas fa-robot text-xs"></i>
                </div>
                <div>
                    <h3 class="font-semibold text-gray-800 text-sm">RAG Chatbot</h3>
                </div>
            </div>
            <div class="mt-1 text-gray-700">
                ${renderedContent}
            </div>
        </div>
    `;
    
    container.appendChild(messageElement);
    
    // Cuộn xuống dưới cùng
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderChatMessages(messages, chatMessages) {
    chatMessages.innerHTML = '<div class="max-w-4xl mx-auto space-y-0"></div>';
    const container = chatMessages.querySelector('.max-w-4xl');
    
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`;
        
        if (message.role === 'user') {
            messageElement.innerHTML = `
                <div class="max-w-2xl bg-primary-500 text-white rounded-2xl rounded-br-md shadow-sm p-4 chat-message">
                    <div class="flex items-center mb-2">
                        <div class="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white mr-2">
                            <i class="fas fa-user text-xs"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-white text-sm">You</h3>
                        </div>
                    </div>
                    <div class="mt-1">
                        <p class="whitespace-pre-wrap text-white">${message.content}</p>
                    </div>
                </div>
            `;
        } else {
            // Hiển thị markdown cho tin nhắn của trợ lý
            const renderedContent = marked.parse(message.content);
            
            messageElement.innerHTML = `
                <div class="max-w-2xl bg-white rounded-2xl rounded-bl-md shadow-sm p-4 chat-message assistant-message border border-gray-100 markdown-content">
                    <div class="flex items-center mb-2">
                        <div class="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white mr-2">
                            <i class="fas fa-robot text-xs"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-800 text-sm">RAG Chatbot</h3>
                        </div>
                    </div>
                    <div class="mt-1 text-gray-700">
                        ${renderedContent}
                    </div>
                </div>
            `;
        }
        
        container.appendChild(messageElement);
    });
    
    // Cuộn xuống dưới cùng
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Xuất các hàm để sử dụng trong các module khác
export { sendMessage, showLoadingMessage, hideLoadingMessage, addUserMessageToUI, addAssistantMessageToUI, renderChatMessages };