/**
 * Chatbot Logic
 * Handles the floating chatbot widget interaction.
 */

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const chatWindow = document.getElementById('chatbot-window');
    const chatIcon = toggleBtn.querySelector('.chat-icon');
    const closeIcon = toggleBtn.querySelector('.close-icon');
    const chatInputForm = document.getElementById('chat-input-form');
    const chatInput = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');

    const headerCloseBtn = document.getElementById('chat-header-close');

    function toggleChat() {
        toggleBtn.classList.toggle('chat-open');
        chatWindow.classList.toggle('hidden');
        chatIcon.classList.toggle('hidden');
        closeIcon.classList.toggle('hidden');

        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
        }
    }

    // Toggle Chat Window
    toggleBtn.addEventListener('click', toggleChat);

    // Header Close Button
    if (headerCloseBtn) {
        headerCloseBtn.addEventListener('click', toggleChat);
    }

    // Handle Message Submission
    chatInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        // Add User Message
        addMessage(message, 'user');
        chatInput.value = '';

        // Add Typing Indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerText = 'typing...';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Remove typing indicator
            messagesContainer.removeChild(typingDiv);

            if (data.response) {
                addMessage(data.response, 'bot');
            } else {
                addMessage("I'm having trouble connecting to my musical brain right now.", 'bot');
            }
        } catch (error) {
            messagesContainer.removeChild(typingDiv);
            addMessage("Error connecting to server.", 'bot');
            console.error('Chat error:', error);
        }
    });

    // Helper: Add Message to UI
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerText = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Removed local training and getBotResponse logic as it is now handled by the backend
});
