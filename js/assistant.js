(() => {
  const API = 'http://localhost:5000/api/assistant/chat';
  let messages = [];
  let open = false;

  // ── Inject HTML ──────────────────────────────────────────────────────────
  const html = `
<div id="ai-btn" title="Assistant IA">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" width="26" height="26">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
  <span class="ai-badge" id="ai-badge" style="display:none">!</span>
</div>
<div id="ai-panel">
  <div id="ai-header">
    <span>🤖 Assistant IA — Al Handassa</span>
    <button id="ai-close">✕</button>
  </div>
  <div id="ai-messages">
    <div class="ai-msg ai-bot">
      Bonjour ! Je suis votre assistant spécialisé en génie civil et BTP.
      Comment puis-je vous aider ?
    </div>
  </div>
  <div id="ai-input-row">
    <textarea id="ai-input" placeholder="Posez votre question…" rows="1"></textarea>
    <button id="ai-send">
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
      </svg>
    </button>
  </div>
</div>`;

  const wrapper = document.createElement('div');
  wrapper.id = 'ai-widget';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  // ── Inject CSS ───────────────────────────────────────────────────────────
  const css = `
#ai-widget { position: fixed; bottom: 24px; right: 24px; z-index: 9999; font-family: inherit; }

#ai-btn {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, #1a73e8, #0d47a1);
  color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.3);
  transition: transform .2s; position: relative; user-select: none;
}
#ai-btn:hover { transform: scale(1.08); }
.ai-badge {
  position: absolute; top: 2px; right: 2px;
  background: #e53935; color: #fff; font-size: 10px;
  width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

#ai-panel {
  display: none; flex-direction: column;
  position: absolute; bottom: 68px; right: 0;
  width: 360px; max-height: 520px;
  background: #fff; border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,.18);
  overflow: hidden;
}
#ai-panel.open { display: flex; }

#ai-header {
  background: linear-gradient(135deg, #1a73e8, #0d47a1);
  color: #fff; padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between;
  font-weight: 600; font-size: 14px;
}
#ai-close {
  background: none; border: none; color: #fff;
  font-size: 18px; cursor: pointer; line-height: 1; padding: 0 4px;
}

#ai-messages {
  flex: 1; overflow-y: auto; padding: 12px;
  display: flex; flex-direction: column; gap: 8px;
  background: #f8f9fa;
}
.ai-msg {
  max-width: 85%; padding: 10px 14px; border-radius: 16px;
  font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; word-break: break-word;
}
.ai-user { align-self: flex-end; background: #1a73e8; color: #fff; border-bottom-right-radius: 4px; }
.ai-bot  { align-self: flex-start; background: #fff; color: #333;
           border: 1px solid #e0e0e0; border-bottom-left-radius: 4px;
           box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.ai-typing { display: flex; gap: 4px; padding: 14px 16px; align-items: center; }
.ai-typing span {
  width: 7px; height: 7px; border-radius: 50%; background: #aaa;
  animation: bounce 1.2s infinite;
}
.ai-typing span:nth-child(2) { animation-delay: .2s; }
.ai-typing span:nth-child(3) { animation-delay: .4s; }
@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

#ai-input-row {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 10px 12px; border-top: 1px solid #eee; background: #fff;
}
#ai-input {
  flex: 1; border: 1px solid #ddd; border-radius: 20px;
  padding: 8px 14px; font-size: 13.5px; resize: none; outline: none;
  font-family: inherit; max-height: 100px; overflow-y: auto;
  transition: border .2s;
}
#ai-input:focus { border-color: #1a73e8; }
#ai-send {
  width: 38px; height: 38px; border-radius: 50%; border: none;
  background: #1a73e8; color: #fff; cursor: pointer; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  transition: background .2s;
}
#ai-send:hover { background: #0d47a1; }
#ai-send:disabled { background: #ccc; cursor: not-allowed; }

@media (max-width: 420px) {
  #ai-panel { width: calc(100vw - 32px); right: 0; }
}`;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── Elements ─────────────────────────────────────────────────────────────
  const btn       = document.getElementById('ai-btn');
  const panel     = document.getElementById('ai-panel');
  const closeBtn  = document.getElementById('ai-close');
  const messagesEl= document.getElementById('ai-messages');
  const input     = document.getElementById('ai-input');
  const sendBtn   = document.getElementById('ai-send');

  // ── Toggle ────────────────────────────────────────────────────────────────
  function togglePanel() {
    open = !open;
    panel.classList.toggle('open', open);
    if (open) { input.focus(); }
  }
  btn.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', togglePanel);

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener('click', sendMessage);

  // ── Render message ────────────────────────────────────────────────────────
  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'ai-msg ' + (role === 'user' ? 'ai-user' : 'ai-bot');
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'ai-msg ai-bot ai-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    div.id = 'ai-typing-indicator';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function removeTyping() {
    const t = document.getElementById('ai-typing-indicator');
    if (t) t.remove();
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    messages.push({ role: 'user', content: text });
    addMessage('user', text);
    showTyping();

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      removeTyping();

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        addMessage('assistant', err.error || 'Erreur serveur. Veuillez réessayer.');
        messages.pop();
        return;
      }

      const data = await res.json();
      messages.push({ role: 'assistant', content: data.reply });
      addMessage('assistant', data.reply);
    } catch (e) {
      removeTyping();
      addMessage('assistant', 'Connexion impossible. Vérifiez votre connexion.');
      messages.pop();
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }
})();
