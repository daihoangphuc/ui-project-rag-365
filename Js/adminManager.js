// Trình quản lý quản trị JavaScript
import { API_BASE_URL } from './apiConfig.js';

class AdminManager {
    constructor() {
        this.apiUrl = `${API_BASE_URL}/api/admins`;
        this.authToken = localStorage.getItem('authToken');
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.bindEvents();
        this.loadInitialData();
        this.startStatusRefresh();
    }

    checkAuthentication() {
        if (!this.authToken) {
            window.location.href = 'login.html';
            return;
        }
        
        // Xác minh tính hợp lệ của token
        this.verifyToken();
    }

    async verifyToken() {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/auths/me`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            
            if (response.data) {
                document.getElementById('adminName').textContent = response.data.display_name || response.data.email || 'Quản trị viên';
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
    }

    bindEvents() {
        console.log('Binding events...');
        
        // Nút đăng xuất
        const logoutBtn = document.getElementById('logoutBtn');
        console.log('Logout button:', logoutBtn);
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }
        
        // Nút đồng bộ
        const syncBtn = document.getElementById('syncBtn');
        console.log('Sync button:', syncBtn);
        if (syncBtn) {
            syncBtn.addEventListener('click', this.startSync.bind(this));
        }
        
        // Nút làm mới
        const refreshBtn = document.getElementById('refreshBtn');
        console.log('Refresh button:', refreshBtn);
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.refreshStatus.bind(this));
        }
        
        // Nút reset
        const resetBtn = document.getElementById('resetBtn');
        console.log('Reset button:', resetBtn);
        if (resetBtn) {
            resetBtn.addEventListener('click', this.resetAllArticles.bind(this));
            console.log('Reset button event listener added successfully');
        } else {
            console.error('Reset button not found!');
        }
        
        // Nút tìm kiếm
        const searchBtn = document.getElementById('searchBtn');
        console.log('Search button:', searchBtn);
        if (searchBtn) {
            searchBtn.addEventListener('click', this.searchArticles.bind(this));
        }
        
        // Tìm kiếm bằng phím Enter
        const searchQuery = document.getElementById('searchQuery');
        if (searchQuery) {
            searchQuery.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchArticles();
                }
            });
        }
        
        // Đóng thông báo
        const toastClose = document.getElementById('toastClose');
        if (toastClose) {
            toastClose.addEventListener('click', this.hideToast.bind(this));
        }
        
        console.log('Event binding completed');
    }

    async loadInitialData() {
        // Tải trạng thái đồng bộ khi trang tải
        await this.loadSyncStatus();
    }

    startStatusRefresh() {
        // Làm mới trạng thái mỗi 30 giây
        setInterval(() => {
            this.loadSyncStatus();
        }, 30000);
    }

    async loadSyncStatus() {
        try {
            const response = await axios.get(`${this.apiUrl}/sync-status`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            const data = response.data;
            this.updateStatusCards(data);
            
        } catch (error) {
            console.error('Error loading sync status:', error);
            this.showToast('Failed to load sync status', 'error');
        }
    }

    updateStatusCards(data) {
        const syncStatus = data.sync_status;
        
        // Cập nhật các chỉ số
        document.getElementById('totalArticles').textContent = syncStatus.total_articles || '0';
        document.getElementById('processedArticles').textContent = syncStatus.processed_articles || '0';
        document.getElementById('pendingArticles').textContent = syncStatus.pending_articles || '0';
        
        // Định dạng thời gian đồng bộ lần cuối
        if (syncStatus.last_sync) {
            const lastSyncDate = new Date(syncStatus.last_sync);
            document.getElementById('lastSync').textContent = this.formatRelativeTime(lastSyncDate);
        }
    }

    async startSync() {
        const syncBtn = document.getElementById('syncBtn');
        const syncBtnText = document.getElementById('syncBtnText');
        const syncSpinner = document.getElementById('syncSpinner');
        const batchSize = document.getElementById('batchSize').value;
        
        if (!batchSize || batchSize < 1 || batchSize > 100) {
            this.showToast('Please enter a valid batch size (1-100)', 'error');
            return;
        }

        try {
            // Cập nhật giao diện người dùng
            syncBtn.disabled = true;
            syncBtnText.innerHTML = '<i class="fas fa-sync-alt fa-spin mr-1"></i>Đang đồng bộ...';
            
            // Thực hiện cuộc gọi API
            const response = await axios.post(`${this.apiUrl}/sync?batch_size=${batchSize}`, {}, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            const result = response.data;
            
            if (result.success) {
                this.showToast('Hoàn thành đồng bộ thành công!', 'success');
                await this.loadSyncStatus(); // Làm mới trạng thái
            } else {
                this.showToast('Thất bại khi đồng bộ', 'error');
            }
            
        } catch (error) {
            console.error('Sync error:', error);
            this.showToast('Thất bại khi đồng bộ: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            // Đặt lại giao diện người dùng
            syncBtn.disabled = false;
            syncBtnText.innerHTML = '<i class="fas fa-sync-alt mr-1"></i>Đồng Bộ';
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
    }

    async refreshStatus() {
        const refreshBtn = document.getElementById('refreshBtn');
        const refreshBtnText = document.getElementById('refreshBtnText');
        
        try {
            // Cập nhật giao diện người dùng để hiển thị trạng thái tải
            refreshBtn.disabled = true;
            refreshBtnText.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang làm mới...';
            
            // Gọi API sync-status
            await this.loadSyncStatus();
            
            // Hiển thị thông báo thành công
            this.showToast('Trạng thái đã được làm mới thành công!', 'success');
            
        } catch (error) {
            console.error('Refresh status error:', error);
            this.showToast('Làm mới trạng thái thất bại: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            // Đặt lại giao diện người dùng
            setTimeout(() => {
                refreshBtn.disabled = false;
                refreshBtnText.innerHTML = '<i class="fas fa-refresh mr-1"></i>Làm Mới';
            }, 1000); // Hiển thị trạng thái tải ít nhất 1 giây để có trải nghiệm người dùng tốt hơn
        }
    }

    async resetAllArticles() {
        console.log('Reset button clicked!'); // Debug log
        
        // Xác nhận với người dùng trước khi tiếp tục
        const confirmed = confirm('Bạn có chắc chắn muốn reset toàn bộ dữ liệu? Thao tác này không thể hoàn tác!');
        if (!confirmed) {
            console.log('Reset cancelled by user');
            return;
        }

        console.log('User confirmed reset, proceeding...');
        const resetBtn = document.getElementById('resetBtn');
        const resetBtnText = document.getElementById('resetBtnText');
        const resetSpinner = document.getElementById('resetSpinner');
        
        console.log('Reset button elements:', { resetBtn, resetBtnText, resetSpinner });
        
        try {
            // Cập nhật giao diện người dùng để hiển thị trạng thái tải
            resetBtn.disabled = true;
            resetBtnText.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang reset...';
            resetSpinner.classList.remove('hidden');
            
            console.log('Making API call to:', `${this.apiUrl}/articles/reset`);
            console.log('Auth token:', this.authToken ? 'Present' : 'Missing');
            
            // Gọi API reset
            const response = await axios.post(`${this.apiUrl}/articles/reset`, {}, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            console.log('API response:', response);
            const result = response.data;
            
            if (result.success) {
                this.showToast('Reset toàn bộ dữ liệu thành công!', 'success');
                // Làm mới trạng thái để cập nhật số lượng
                await this.loadSyncStatus();
            } else {
                this.showToast('Reset dữ liệu thất bại', 'error');
            }
            
        } catch (error) {
            console.error('Reset articles error:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            this.showToast('Reset dữ liệu thất bại: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            // Đặt lại giao diện người dùng
            resetBtn.disabled = false;
            resetBtnText.innerHTML = '<i class="fas fa-trash mr-1"></i>Reset';
            resetSpinner.classList.add('hidden');
            console.log('Reset operation completed');
        }
    }

    async searchArticles() {
        const query = document.getElementById('searchQuery').value.trim();
        const topK = document.getElementById('searchTopK').value;
        
        if (!query) {
            this.showToast('Vui lòng nhập từ khóa tìm kiếm', 'error');
            return;
        }

        try {
            const searchBtn = document.getElementById('searchBtn');
            searchBtn.disabled = true;
            searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang tìm kiếm...';
            
            const response = await axios.get(`${this.apiUrl}/search-articles`, {
                params: { query, top_k: topK },
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            const results = response.data.results;
            this.displaySearchResults(query, results);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showToast('Tìm kiếm thất bại: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            const searchBtn = document.getElementById('searchBtn');
            searchBtn.disabled = false;
            searchBtn.innerHTML = '<i class="fas fa-search mr-2"></i>Tìm Kiếm';
        }
    }

    displaySearchResults(query, results) {
        const searchResults = document.getElementById('searchResults');
        const searchResultsList = document.getElementById('searchResultsList');
        
        if (results.length === 0) {
            searchResultsList.innerHTML = '<p class="text-gray-500 italic">Không tìm thấy kết quả nào cho từ khóa của bạn.</p>';
        } else {
            searchResultsList.innerHTML = results.map(result => {
                const articleId = result.metadata?.source_id || result.id || result.article_id;
                return `
                <div class="search-result-item p-4 border border-gray-200 rounded-lg">
                    <div class="flex justify-between items-start mb-2">
                        <h5 class="font-medium text-gray-900 flex-1">${result.metadata?.article_title || 'Không có tiêu đề'}</h5>
                        <div class="flex items-center gap-2 ml-4">
                            <button 
                                onclick="adminManager.deleteArticle('${articleId}')" 
                                class="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                title="Xóa bài viết"
                            >
                                <i class="fas fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">${this.truncateText(result.content, 200)}</p>
                    <div class="flex justify-between items-center text-xs text-gray-500">
                        <span>ID Bài viết: ${articleId}</span>
                        <span>Phần: ${result.chunk_index || 'N/A'}</span>
                    </div>
                </div>
                `;
            }).join('');
        }
        
        searchResults.classList.remove('hidden');
    }

    async deleteArticle(articleId) {
        if (!articleId) {
            this.showToast('ID bài viết không hợp lệ', 'error');
            return;
        }

        if (!confirm(`Bạn có chắc chắn muốn xóa bài viết ID ${articleId}?`)) {
            return;
        }

        try {
            console.log(`Deleting article with ID: ${articleId}`);
            
            const response = await axios.delete(`${this.apiUrl}/articles/${articleId}`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            const result = response.data;
            
            if (result.success) {
                this.showToast(`Xóa bài viết ID ${articleId} thành công!`, 'success');
                
                // Làm mới kết quả tìm kiếm nếu có tìm kiếm đang hoạt động
                const query = document.getElementById('searchQuery').value.trim();
                if (query) {
                    await this.searchArticles();
                }
                
                // Làm mới trạng thái để cập nhật số lượng
                await this.loadSyncStatus();
            } else {
                this.showToast('Xóa bài viết thất bại', 'error');
            }
            
        } catch (error) {
            console.error('Delete article error:', error);
            
            let message = 'Xóa bài viết thất bại';
            if (error.response?.status === 404) {
                message = 'Không tìm thấy bài viết với ID này';
            } else if (error.response?.data?.message) {
                message = `Xóa bài viết thất bại: ${error.response.data.message}`;
            } else if (error.message) {
                message = `Xóa bài viết thất bại: ${error.message}`;
            }
            
            this.showToast(message, 'error');
        }
    }

    // Các hàm tiện ích
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toastIcon');
        const toastMessage = document.getElementById('toastMessage');
        
        const iconClasses = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            info: 'fas fa-info-circle text-blue-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500'
        };
        
        toastIcon.className = iconClasses[type] || iconClasses.info;
        toastMessage.textContent = message;
        
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            this.hideToast();
        }, 5000);
    }

    hideToast() {
        document.getElementById('toast').classList.add('hidden');
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// Khởi tạo trình quản lý quản trị khi trang tải
let adminManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing AdminManager');
    try {
        adminManager = new AdminManager();
        // Làm cho nó có thể truy cập toàn cục cho các trình xử lý onclick nội tuyến
        window.adminManager = adminManager;
        console.log('AdminManager initialized successfully');
    } catch (error) {
        console.error('Error initializing AdminManager:', error);
    }
});