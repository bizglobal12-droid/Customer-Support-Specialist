// Telemetry Counter State
let stats = {
    total: 0,
    auto: 0,
    escalated: 0
};

let ticketCounter = 1000;

// Presets for quick simulation
const simPresets = {
    web: {
        channel: "Web Chat",
        text: "How do I check my tracking status for order #5512?"
    },
    email: {
        channel: "Email",
        text: "I received my order yesterday, but I would like to request an invoice copy."
    },
    urgent: {
        channel: "Slack",
        text: "UNACCEPTABLE! You charged my card three times! Fix this immediately or I am reporting to legal!"
    }
};

// Natural Language Sentiment & Urgency Orchestrator Engine
function analyzeTicket(text) {
    const lower = text.toLowerCase();
    
    // Negative / Escalation Keywords
    const angryKeywords = ["sue", "legal", "unacceptable", "charge", "twice", "three times", "scam", "stole", "report", "angry", "broken"];
    const urgentKeywords = ["immediately", "asap", "urgent", "fix this", "emergency"];

    let sentimentScore = 0.8; // default positive/neutral
    let urgency = "LOW";
    let confidence = 0.95;

    // Evaluate negative signals
    angryKeywords.forEach(word => {
        if (lower.includes(word)) {
            sentimentScore -= 0.4;
            confidence -= 0.2;
        }
    });

    // Evaluate urgency signals
    urgentKeywords.forEach(word => {
        if (lower.includes(word)) {
            urgency = "HIGH";
            confidence -= 0.15;
        }
    });

    // Determine Action Path (Decision Gate)
    // If confidence < 0.70 OR sentiment < 0.20 OR urgency == HIGH -> Human Escalation Queue
    const requiresEscalation = (confidence < 0.70 || sentimentScore < 0.20 || urgency === "HIGH");

    return {
        sentiment: sentimentScore < 0.3 ? "CRITICAL NEGATIVE" : (sentimentScore < 0.6 ? "NEUTRAL" : "POSITIVE"),
        urgency: urgency,
        confidence: Math.max(0.3, confidence).toFixed(2),
        escalate: requiresEscalation
    };
}

// UI Dispatch Router
function processInboundTicket(channel, text) {
    ticketCounter++;
    const ticketId = `TCK-${ticketCounter}`;
    const analysis = analyzeTicket(text);

    // Update Stats
    stats.total++;
    if (analysis.escalate) {
        stats.escalated++;
    } else {
        stats.auto++;
    }
    updateMetricsUI();

    // Render in Queue List
    renderQueueCard(ticketId, channel, text, analysis);

    // Render in Telemetry Ledger
    renderAuditRow(ticketId, channel, analysis);
}

function updateMetricsUI() {
    document.getElementById('stat-total').innerText = stats.total;
    document.getElementById('stat-auto').innerText = stats.auto;
    document.getElementById('stat-escalated').innerText = stats.escalated;
}

function renderQueueCard(id, channel, text, analysis) {
    const targetQueueId = analysis.escalate ? 'escalated-queue' : 'auto-queue';
    const queueElem = document.getElementById(targetQueueId);

    // Remove placeholder if present
    const placeholder = queueElem.querySelector('.empty-placeholder');
    if (placeholder) placeholder.remove();

    const card = document.createElement('div');
    card.className = 'ticket-card';
    card.innerHTML = `
        <div class="ticket-card-header">
            <span><strong>${id}</strong> via ${channel}</span>
            <span class="badge ${analysis.escalate ? 'human-badge' : 'auto-badge'}">
                ${analysis.escalate ? 'ESCALATED' : 'AUTO-RESOLVED'}
            </span>
        </div>
        <div class="ticket-card-body">
            "${text}"
        </div>
    `;

    queueElem.prepend(card);
}

function renderAuditRow(id, channel, analysis) {
    const tbody = document.getElementById('audit-body');
    const tr = document.createElement('tr');

    let sentimentClass = "sent-neu";
    if (analysis.sentiment.includes("NEGATIVE")) sentimentClass = "sent-neg";
    if (analysis.sentiment === "POSITIVE") sentimentClass = "sent-pos";

    tr.innerHTML = `
        <td><strong>${id}</strong></td>
        <td>${channel}</td>
        <td class="${sentimentClass}">${analysis.sentiment}</td>
        <td>${analysis.urgency}</td>
        <td>${analysis.confidence}</td>
        <td><span class="badge ${analysis.escalate ? 'human-badge' : 'auto-badge'}">${analysis.escalate ? 'Human Queue' : 'LLM Resolution'}</span></td>
    `;

    tbody.prepend(tr);
}

// Global Handlers
function simulateTicket(type) {
    const preset = simPresets[type];
    if (preset) {
        processInboundTicket(preset.channel, preset.text);
    }
}

document.getElementById('submit-ticket-btn').addEventListener('click', () => {
    const channel = document.getElementById('ticket-channel').value;
    const text = document.getElementById('ticket-text').value.trim();
    if (text) {
        processInboundTicket(channel, text);
        document.getElementById('ticket-text').value = '';
    }
});
