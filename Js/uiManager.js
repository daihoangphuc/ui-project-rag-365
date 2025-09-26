import { deleteSession, createNewSession, setSessionBeingRenamed, clearSessionBeingRenamed, getCurrentSessionId } from './sessionManager.js';
import { renderChatMessages } from './messageManager.js';

function renderSessionsList(sessions, sessionsList, loadSession) {
    sessionsList.innerHTML = '';
    
    sessions.forEach(session => {
        const sessionElement = document.createElement('div');
        const isActive = session.session_id === getCurrentSessionId();
        sessionElement.className = `p-3 hover:bg-gray-50 rounded-lg cursor-pointer flex justify-between items-center session-item transition-colors ${isActive ? 'bg-primary-50 border border-primary-200' : 'bg-white border border-gray-200'} shadow-sm`;
        sessionElement.innerHTML = '' +
            '<div class="flex-1 truncate">' +
                '<div class="font-medium text-sm text-gray-800">' + session.title + '</div>' +
                '<div class="text-xs text-gray-500 mt-1">' + session.message_count + ' messages</div>' +
            '</div>' +
            '<div class="flex items-center">' +
                '<div class="text-xs text-gray-400 mr-2">' +
                    new Date(session.updated_at).toLocaleDateString() +
                '</div>' +
                '<div class="dropdown relative">' +
                    '<button class="dropdown-btn text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-200" data-session-id="' + session.session_id + '">' +
                        '<i class="fas fa-ellipsis-v"></i>' +
                    '</button>' +
                    '<div class="dropdown-menu absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg py-1 hidden z-50 border border-gray-200">' +
                        '<button class="rename-session-btn block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left rounded-t-lg" data-session-id="' + session.session_id + '">' +
                            '<i class="fas fa-edit mr-2 text-gray-500"></i>Rename' +
                        '</button>' +
                        '<button class="delete-session-btn block px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-b-lg" data-session-id="' + session.session_id + '">' +
                            '<i class="fas fa-trash-alt mr-2"></i>Delete' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        
        sessionElement.addEventListener('click', (e) => {
            // Only load session if the click wasn't on the dropdown button
            if (!e.target.closest('.dropdown-btn')) {
                // Remove active class from all sessions
                document.querySelectorAll('.session-item').forEach(item => {
                    item.classList.remove('active', 'bg-primary-50', 'border-primary-200');
                    item.classList.add('bg-white', 'border-gray-200');
                });
                
                // Add active class to clicked session
                sessionElement.classList.add('active', 'bg-primary-50', 'border-primary-200');
                sessionElement.classList.remove('bg-white', 'border-gray-200');
                
                // Get the chatMessages element to pass to loadSession
                const chatMessages = document.getElementById('chatMessages');
                loadSession(session.session_id, chatMessages, renderChatMessages);
            }
        });
        
        sessionsList.appendChild(sessionElement);
    });
    
    // Remove existing event listener if it exists
    if (sessionsList._dropdownClickListener) {
        sessionsList.removeEventListener('click', sessionsList._dropdownClickListener);
    }
    
    // Define the event listener function
    const dropdownClickListener = (e) => {
        console.log('Click event on sessionsList:', e.target);
        
        // Handle dropdown button clicks
        if (e.target.closest('.dropdown-btn')) {
            console.log('Dropdown button clicked');
            const button = e.target.closest('.dropdown-btn');
            const dropdownMenu = button.nextElementSibling;
            // Hide all other dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== dropdownMenu) {
                    menu.classList.add('hidden');
                }
            });
            // Toggle current dropdown
            dropdownMenu.classList.toggle('hidden');
            
            // Stop propagation to prevent other handlers from interfering
            e.stopPropagation();
            return;
        }
        
        // Handle rename button clicks
        if (e.target.closest('.rename-session-btn')) {
            console.log('Rename button clicked');
            const button = e.target.closest('.rename-session-btn');
            e.stopPropagation();
            const sessionId = button.getAttribute('data-session-id');
            console.log('Rename session ID:', sessionId);
            // Find the session title in the DOM
            const sessionElement = button.closest('.session-item');
            const sessionTitle = sessionElement.querySelector('.font-medium').textContent;
            openRenameModalForSession(sessionId, sessionTitle);
            return;
        }
        
        // Handle delete button clicks
        console.log('Checking for delete button click');
        console.log('e.target:', e.target);
        console.log('e.target.closest(.delete-session-btn):', e.target.closest('.delete-session-btn'));
        if (e.target.closest('.delete-session-btn')) {
            console.log('Delete button clicked');
            const button = e.target.closest('.delete-session-btn');
            e.stopPropagation();
            const sessionId = button.getAttribute('data-session-id');
            console.log('Delete session ID:', sessionId);
            
            // Confirm deletion
            if (confirm('Are you sure you want to delete this chat session?')) {
                // Get the chatMessages element to pass to deleteSession
                const chatMessages = document.getElementById('chatMessages');
                console.log('Calling deleteSession with:', { sessionId, chatMessages });
                
                // Call deleteSession and handle UI update
                deleteSession(sessionId, chatMessages).then((success) => {
                    if (success) {
                        console.log('Session deleted successfully, refreshing UI');
                        // Immediately remove the session from the UI
                        const sessionElement = button.closest('.session-item');
                        if (sessionElement) {
                            sessionElement.remove();
                        }
                        
                        // Reload the sessions list to ensure consistency
                        import('./sessionManager.js').then(({ loadChatSessions }) => {
                            loadChatSessions(sessionsList, (sessions) => {
                                renderSessionsList(sessions, sessionsList, loadSession);
                            });
                        });
                    }
                }).catch((error) => {
                    console.error('Failed to delete session:', error);
                });
            }
            return;
        }
    };
    
    // Store the event listener function for later removal
    sessionsList._dropdownClickListener = dropdownClickListener;
    
    // Use event delegation for dropdown buttons
    sessionsList.addEventListener('click', dropdownClickListener);
}

function openRenameModalForSession(sessionId, currentTitle) {
    if (!sessionId) return;
    
    // Get the required DOM elements
    const renameModal = document.getElementById('renameModal');
    const sessionTitleInput = document.getElementById('sessionTitleInput');
    
    setSessionBeingRenamed(sessionId); // Set the session ID for the rename operation
    sessionTitleInput.value = currentTitle;
    renameModal.classList.remove('hidden');
    renameModal.classList.add('flex');
    sessionTitleInput.focus();
}

function closeRenameModal(renameModal) {
    console.log("Close rename modal called");
    renameModal.classList.add('hidden');
    renameModal.classList.remove('flex');
    clearSessionBeingRenamed(); // Reset when closing modal
}

function openRenameModal(currentSessionId, sessionTitleInput, renameModal) {
    if (!currentSessionId) return;
    
    // Get the current session title from the active session in the sidebar
    const activeSessionElement = document.querySelector('.session-item.active');
    if (activeSessionElement) {
        const sessionTitle = activeSessionElement.querySelector('.font-medium').textContent;
        sessionTitleInput.value = sessionTitle;
    } else {
        sessionTitleInput.value = 'New Chat';
    }
    
    renameModal.classList.remove('hidden');
    renameModal.classList.add('flex');
    sessionTitleInput.focus();
}

// Export functions for use in other modules
export { renderSessionsList, openRenameModalForSession, closeRenameModal, openRenameModal };