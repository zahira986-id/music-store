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

    // Toggle Chat Window
    toggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        chatIcon.classList.toggle('hidden');
        closeIcon.classList.toggle('hidden');

        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
        }
    });

    // Handle Message Submission
    chatInputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        // Add User Message
        addMessage(message, 'user');
        chatInput.value = '';

        // Simulate Bot Response (Delay)
        setTimeout(() => {
            const botResponse = getBotResponse(message);
            addMessage(botResponse, 'bot');
        }, 600);
    });

    // Helper: Add Message to UI
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerText = text;
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Load Product Data for "Training"
    let products = [];
    async function trainBot() {
        try {
            const response = await fetch('/api/instruments');
            if (response.ok) {
                products = await response.json();
                console.log('Bot trained with ' + products.length + ' products.');
            }
        } catch (e) {
            console.error('Bot training failed', e);
        }
    }
    trainBot(); // Train on load

    // Smart Logic
    function getBotResponse(input) {
        const lowerInput = input.toLowerCase();

        // Synonyms / Translation Map
        const synonyms = {
            'guitar': 'guitare',
            'drum': 'batterie',
            'piano': 'piano',
            'violin': 'violon',
            'trumpet': 'trompette',
            'sax': 'saxophone'
        };

        // Extract keywords (words > 2 chars)
        let keywords = lowerInput.match(/\b\w{3,}\b/g) || [];

        // Add translated keywords
        const expandedKeywords = [...keywords];
        keywords.forEach(k => {
            if (synonyms[k]) expandedKeywords.push(synonyms[k]);
        });

        // 1. Search for products matching ANY label
        const matchingProducts = products.filter(p => {
            const pText = `${p.nom} ${p.marque} ${p.type}`.toLowerCase();
            return expandedKeywords.some(k => pText.includes(k) && !['how', 'much', 'what', 'price', 'cost'].includes(k));
        });

        if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
            return "Hello! I've been trained on our current inventory. Ask me about our Guitars, Pianos, or specific brands!";
        }

        // 2. Product Search Responses
        if (matchingProducts.length > 0) {
            // Find the best match (most keywords?) - for now just take the first few
            if (matchingProducts.length === 1) {
                const p = matchingProducts[0];
                return `I found the **${p.nom}** (${p.type}). It's ${p.status} at **${p.prix}€**.`;
            } else {
                const count = matchingProducts.length;
                const names = matchingProducts.slice(0, 3).map(p => p.nom).join(', ');
                return `I found ${count} items. Here are the top ones: ${names}...`;
            }
        }

        // 3. Knowledge Base (General Intents)
        const knowledgeBase = [
            {
                keywords: ['hours', 'open', 'close', 'time'],
                response: "We are open Monday to Saturday, from 9:00 AM to 8:00 PM. We are closed on Sundays."
            },
            {
                keywords: ['delivery', 'ship', 'shipping', 'livraison'],
                response: "We offer shipping across Morocco. Free delivery for orders over 2000€. Standard delivery takes 2-4 business days."
            },
            {
                keywords: ['return', 'refund', 'exchange', 'policy'],
                response: "You can return any item within 30 days of purchase if it's in its original condition. Contact support to initiate a return."
            },
            {
                keywords: ['payment', 'pay', 'card', 'cash'],
                response: "We accept Visa, Mastercard, and Cash on Delivery. You can also pay in installments for expensive items."
            },
            {
                keywords: ['service', 'repair', 'lesson', 'setup'],
                response: "Yes! We offer instrument repair, guitar setup, and even music lessons for beginners. Visit us in store for details."
            },
            {
                keywords: ['warranty', 'guarantee'],
                response: "All new instruments come with a 2-year manufacturer warranty. Used gear has a 6-month store warranty."
            },
            {
                keywords: ['location', 'address', 'where', 'map'],
                response: "We are located at 123 Music Avenue, Casablanca, Morocco. Near the Twin Center."
            },
            {
                keywords: ['contact', 'email', 'phone', 'support'],
                response: "You can email us at contact@musicstore.com, call +212 600 000 000, or use the form on the Contact page."
            },
            {
                keywords: ['price', 'cost', 'expensive', 'cheap'],
                response: "Prices vary by instrument. You can find specific prices by searching for the instrument name here!"
            },
            {
                keywords: ['about', 'who', 'company'],
                response: "MusicStore is Morocco's premier destination for musicians. We've been serving the community since 2010."
            }
        ];

        // Check Knowledge Base
        for (const entry of knowledgeBase) {
            if (entry.keywords.some(k => lowerInput.includes(k))) {
                return entry.response;
            }
        }

        return "I didn't find that in our store. Try searching for 'Guitar', 'Piano', 'Yamaha', or ask about our Hours, Delivery, or Services.";
    }
});
