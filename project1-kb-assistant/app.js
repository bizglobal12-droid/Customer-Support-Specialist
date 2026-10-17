// Local Knowledge Base Mock Dataset (Simulating Vector Database Retrieval)
const knowledgeBase = [
    {
        keywords: ["return", "refund", "policy", "days", "money back"],
        content: "Customers can return any physical product within 30 days of the delivery date for a full refund. Items must be unused and in their original packaging. Digital products and opened consumables are non-refundable.",
        source: "return_policy.md"
    },
    {
        keywords: ["shipping", "delivery", "fee", "cost", "track"],
        content: "Standard shipping takes 3-5 business days and is free for orders over $50. Express shipping is available at checkout for a flat fee of $15.",
        source: "shipping_faq.md"
    },
    {
        keywords: ["password", "reset", "login", "security", "account"],
        content: "To reset your password, click on 'Forgot Password' on the login page. You will receive a secure token link via email valid for 15 minutes.",
        source: "account_security.md"
    }
];

// PII Masking Guardrail Function
function maskPII(text) {
    let sanitized = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
    sanitized = sanitized.replace(/\b\+?[0-9][-e. _0-9]{7,15}\b/g, '[PHONE_REDACTED]');
    sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,19}\b/g, '[CARD_REDACTED]');
    return sanitized;
}

// Client-Side Semantic/Keyword Matcher (RAG Simulator)
function retrieveKnowledge(query) {
    const lowerQuery = query.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    knowledgeBase.forEach(doc => {
        let score = 0;
        doc.keywords.forEach(keyword => {
            if (lowerQuery.includes(keyword)) {
                score += 1;
            }
        });
        if (score > highestScore) {
            highestScore = score;
            bestMatch = doc;
        }
    });

    if (highestScore > 0 && bestMatch) {
        return {
            response: bestMatch.content,
            source: bestMatch.source
        };
    } else {
        return {
            response: "I'm sorry, I can only assist with topics covered in our company policies and FAQs. Please contact human support for specialized assistance.",
            source: null
        };
    }
}

// DOM Elements & Event Handlers
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(text, sender, source = null) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'assistant-message');
    
    let contentHTML = `<div class="message-content">${text}</div>`;
    if (source) {
        contentHTML += `<span class="sources-tag">📚 Source: ${source}</span>`;
    }
    
    messageDiv.innerHTML = contentHTML;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleUserSubmit() {
    const rawText = userInput.value.trim();
    if (!rawText) return;

    appendMessage(rawText, 'user');
    userInput.value = '';

    const sanitizedQuery = maskPII(rawText);

    setTimeout(() => {
        const result = retrieveKnowledge(sanitizedQuery);
        appendMessage(result.response, 'assistant', result.source);
    }, 500);
}

if (sendBtn && userInput) {
    sendBtn.addEventListener('click', handleUserSubmit);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserSubmit();
        }
    });
}
