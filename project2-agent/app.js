// Mock Database for Autonomous Tool Execution
const mockDatabase = {
    orders: {
        "5512": { item: "Wireless Mechanical Keyboard", status: "Shipped", tracking: "TRK-998234", amount: "$120.00" },
        "4021": { item: "Ultra-Wide Gaming Monitor", status: "Delivered", tracking: "TRK-112345", amount: "$349.99" },
        "8830": { item: "Ergonomic Office Chair", status: "Processing", tracking: "Pending Dispatch", amount: "$210.50" }
    }
};

// Simulated Tool Definitions (Function Calling)
const tools = {
    check_order_status: function(orderId) {
        if (mockDatabase.orders[orderId]) {
            const ord = mockDatabase.orders[orderId];
            return {
                success: true,
                output: `Order #${orderId} (${ord.item}) is currently **${ord.status}**. Tracking ID: ${ord.tracking}. Total: ${ord.amount}.`
            };
        } else {
            return {
                success: false,
                output: `Error: Order #${orderId} not found in the customer ledger.`
            };
        }
    },

    issue_refund: function(orderId) {
        if (mockDatabase.orders[orderId]) {
            const ord = mockDatabase.orders[orderId];
            return {
                success: true,
                output: `Successfully processed a full refund of **${ord.amount}** for Order #${orderId}. Funds will reflect in 3-5 business days.`
            };
        } else {
            return {
                success: false,
                output: `Cannot process refund: Order #${orderId} could not be verified.`
            };
        }
    },

    reset_user_password: function() {
        return {
            success: true,
            output: `Password reset link successfully dispatched to alex.morgan@securemail.com. Link expires in 15 minutes.`
        };
    }
};

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(text, sender, toolLog = null) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'assistant-message');
    
    let contentHTML = `<div class="message-content">${text}</div>`;
    if (toolLog) {
        contentHTML += `<div class="tool-execution-card">⚡ Tool Executed: ${toolLog}</div>`;
    }
    
    messageDiv.innerHTML = contentHTML;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Agent Reasoning & Intent Parser
function agentExecute(query) {
    const lower = query.toLowerCase();
    
    // Intent 1: Check Order Status (Looks for 4-digit numbers or 'order')
    if (lower.includes("order") || lower.includes("status") || lower.includes("track")) {
        const match = query.match(/\d{4}/); // Looks for 4 digit order ID
        if (match) {
            const orderId = match[0];
            const result = tools.check_order_status(orderId);
            return {
                response: result.output,
                tool: `check_order_status(order_id="${orderId}")`
            };
        } else {
            return {
                response: "I can look up your order status right away, but could you please provide your 4-digit order number (e.g., #5512, #4021, or #8830)?",
                tool: null
            };
        }
    }
    
    // Intent 2: Refund Request
    if (lower.includes("refund") || lower.includes("money back")) {
        const match = query.match(/\d{4}/);
        if (match) {
            const orderId = match[0];
            const result = tools.issue_refund(orderId);
            return {
                response: result.output,
                tool: `issue_refund(order_id="${orderId}")`
            };
        } else {
            return {
                response: "To process your refund securely, please specify which 4-digit order number you would like refunded.",
                tool: null
            };
        }
    }

    // Intent 3: Password Reset
    if (lower.includes("password") || lower.includes("reset") || lower.includes("login")) {
        const result = tools.reset_user_password();
        return {
            response: result.output,
            tool: `reset_user_password(user="alex.morgan@securemail.com")`
        };
    }

    // Default fallback
    return {
        response: "I am an autonomous action agent. I can check order statuses (try asking about order #5512, #4021, or #8830), process refunds, or reset your account password.",
        tool: null
    };
}

function handleUserSubmit() {
    const rawText = userInput.value.trim();
    if (!rawText) return;

    appendMessage(rawText, 'user');
    userInput.value = '';

    setTimeout(() => {
        const execution = agentExecute(rawText);
        appendMessage(execution.response, 'assistant', execution.tool);
    }, 600);
}

if (sendBtn && userInput) {
    sendBtn.addEventListener('click', handleUserSubmit);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserSubmit();
        }
    });
}
