/* ============================================================
   NYN AI Chat Assistant — drop-in widget.
   Include with: <script src="chatbot.js"></script> on any page.
   Self-contained: injects its own CSS + markup, talks to Gemini
   directly from the browser (no backend needed).
   ============================================================ */
(function () {
  // ---- Config ----------------------------------------------------------
  var GEMINI_API_KEY = "AQ.Ab8RN6IqGthu50IW9vwequ0DOPMn2Ka7wnq5BALoJoL4POFoBg";
  var GEMINI_MODEL = "gemini-flash-latest";
  var GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    GEMINI_MODEL + ":generateContent?key=" + GEMINI_API_KEY;

  // Grounding context — kept short so every request stays cheap & fast.
  var SYSTEM_INSTRUCTION =
    "You are the official AI assistant for NextEra Youth Network (NYN), a youth-led " +
    "organization whose motto is 'Where Ideas Meet Impact'. NYN runs leadership training, " +
    "workshops, and community projects for young people, mainly in Bangladesh. " +
    "The website has these pages: Home (index.html) with About, Stats, Team preview, Programs preview, " +
    "a Join/Get Involved section, and Contact details; team.html lists the full team; " +
    "programs.html lists every program with a 'Join This Program' button on each program card. " +
    "To become a member or join a program, a visitor should open the Programs page and tap a " +
    "program card, or use the 'Join Us' / 'Become a Member' button on the home page. " +
    "Be warm, concise, and helpful. Reply in the same language the visitor uses — Bangla (বাংলা) " +
    "or English — matching their script. Keep answers short (2-5 sentences) unless more detail is " +
    "clearly needed. If you don't know a specific fact about NYN (like exact dates or numbers), say so " +
    "honestly and suggest they check the Contact section or message the team directly, rather than " +
    "inventing details. You can also help with general questions outside NYN topics, but gently steer " +
    "the conversation back when it fits.";

  var MAX_HISTORY_TURNS = 8; // user+model pairs kept for context

  // ---- Styles -------------------------------------------------------
  var css = [
    ".nynbot-fab{position:fixed;right:20px;bottom:20px;z-index:8000;width:58px;height:58px;",
    "border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;",
    "background:linear-gradient(135deg,var(--orange,#F5821F),var(--orange-dk,#D96D0F));",
    "box-shadow:0 10px 28px rgba(245,130,31,.4);transition:transform .25s cubic-bezier(.2,.8,.2,1);}",
    ".nynbot-fab:hover{transform:scale(1.07);}",
    ".nynbot-fab svg{width:26px;height:26px;fill:#fff;}",
    ".nynbot-fab .nynbot-dot{position:absolute;top:6px;right:6px;width:10px;height:10px;border-radius:50%;",
    "background:#2ecc71;border:2px solid #fff;}",
    ".nynbot-panel{position:fixed;right:20px;bottom:90px;z-index:8000;width:340px;max-width:calc(100vw - 32px);",
    "height:460px;max-height:calc(100vh - 140px);background:var(--bg,#fff);border-radius:18px;",
    "box-shadow:0 24px 60px rgba(13,27,42,.28);display:flex;flex-direction:column;overflow:hidden;",
    "opacity:0;transform:translateY(16px) scale(.97);pointer-events:none;",
    "transition:opacity .22s ease,transform .22s cubic-bezier(.2,.8,.2,1);",
    "font-family:'Inter',system-ui,-apple-system,Segoe UI,sans-serif;border:1px solid var(--line,rgba(13,27,42,.1));}",
    ".nynbot-panel.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}",
    ".nynbot-head{background:linear-gradient(135deg,var(--navy,#14315C),var(--navy-dk,#0D1B2A));",
    "color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}",
    ".nynbot-head-ico{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.14);",
    "display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;}",
    ".nynbot-head-txt{flex:1;min-width:0;}",
    ".nynbot-head-txt strong{display:block;font-size:.88rem;font-family:'Montserrat',sans-serif;font-weight:700;}",
    ".nynbot-head-txt span{display:block;font-size:.72rem;color:#C7D2E3;}",
    ".nynbot-close{background:none;border:none;color:#fff;opacity:.8;cursor:pointer;padding:4px;font-size:1.1rem;line-height:1;}",
    ".nynbot-close:hover{opacity:1;}",
    ".nynbot-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;",
    "background:var(--bg-alt,#F5F7FA);}",
    ".nynbot-row{display:flex;max-width:88%;}",
    ".nynbot-row.user{align-self:flex-end;justify-content:flex-end;}",
    ".nynbot-row.bot{align-self:flex-start;}",
    ".nynbot-bubble{padding:9px 13px;border-radius:14px;font-size:.86rem;line-height:1.5;white-space:pre-wrap;word-break:break-word;}",
    ".nynbot-row.user .nynbot-bubble{background:linear-gradient(135deg,var(--orange,#F5821F),var(--orange-dk,#D96D0F));",
    "color:#fff;border-bottom-right-radius:4px;}",
    ".nynbot-row.bot .nynbot-bubble{background:var(--bg,#fff);color:var(--ink,#0D1B2A);",
    "border:1px solid var(--line,rgba(13,27,42,.1));border-bottom-left-radius:4px;}",
    ".nynbot-typing{display:flex;gap:4px;padding:10px 13px;}",
    ".nynbot-typing span{width:6px;height:6px;border-radius:50%;background:var(--muted,#5B6472);",
    "animation:nynbot-bounce 1.2s infinite ease-in-out;}",
    ".nynbot-typing span:nth-child(2){animation-delay:.15s;}",
    ".nynbot-typing span:nth-child(3){animation-delay:.3s;}",
    "@keyframes nynbot-bounce{0%,60%,100%{transform:translateY(0);opacity:.5;}30%{transform:translateY(-4px);opacity:1;}}",
    ".nynbot-inputbar{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line,rgba(13,27,42,.1));",
    "background:var(--bg,#fff);flex-shrink:0;}",
    ".nynbot-inputbar textarea{flex:1;resize:none;border:1px solid var(--line,rgba(13,27,42,.1));",
    "background:var(--bg-alt,#F5F7FA);color:var(--ink,#0D1B2A);border-radius:10px;padding:9px 12px;",
    "font-size:.86rem;font-family:inherit;outline:none;max-height:90px;transition:border-color .2s;}",
    ".nynbot-inputbar textarea:focus{border-color:var(--orange,#F5821F);}",
    ".nynbot-send{flex-shrink:0;width:38px;height:38px;border-radius:10px;border:none;cursor:pointer;",
    "background:linear-gradient(135deg,var(--orange,#F5821F),var(--orange-dk,#D96D0F));color:#fff;",
    "display:flex;align-items:center;justify-content:center;transition:opacity .2s;}",
    ".nynbot-send:disabled{opacity:.5;cursor:default;}",
    ".nynbot-send svg{width:16px;height:16px;fill:#fff;}",
    "@media(max-width:480px){.nynbot-panel{right:12px;left:12px;width:auto;bottom:84px;height:min(70vh,520px);}",
    ".nynbot-fab{right:16px;bottom:16px;}}"
  ].join("");
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---- Markup ---------------------------------------------------------
  var wrap = document.createElement("div");
  wrap.innerHTML =
    '<button class="nynbot-fab" id="nynbot-fab" aria-label="Chat with NYN assistant" aria-expanded="false">' +
      '<span class="nynbot-dot"></span>' +
      '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 5.94 2 10.8c0 2.73 1.44 5.16 3.7 6.76L5 22l4.3-2.1c.87.2 1.78.3 2.7.3 5.52 0 10-3.94 10-8.8S17.52 2 12 2z"/></svg>' +
    '</button>' +
    '<div class="nynbot-panel" id="nynbot-panel" role="dialog" aria-label="NYN AI chat assistant">' +
      '<div class="nynbot-head">' +
        '<div class="nynbot-head-ico">🤖</div>' +
        '<div class="nynbot-head-txt"><strong>NYN Assistant</strong><span>Ask about programs, joining, anything</span></div>' +
        '<button class="nynbot-close" id="nynbot-close" aria-label="Close chat">✕</button>' +
      '</div>' +
      '<div class="nynbot-msgs" id="nynbot-msgs"></div>' +
      '<div class="nynbot-inputbar">' +
        '<textarea id="nynbot-input" rows="1" placeholder="লিখুন... / Type a message..."></textarea>' +
        '<button class="nynbot-send" id="nynbot-send" aria-label="Send">' +
          '<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap);

  var fab = document.getElementById("nynbot-fab");
  var panel = document.getElementById("nynbot-panel");
  var closeBtn = document.getElementById("nynbot-close");
  var msgsEl = document.getElementById("nynbot-msgs");
  var input = document.getElementById("nynbot-input");
  var sendBtn = document.getElementById("nynbot-send");

  var history = []; // {role:'user'|'model', parts:[{text}]}
  var greeted = false;

  function addBubble(role, text) {
    var row = document.createElement("div");
    row.className = "nynbot-row " + (role === "user" ? "user" : "bot");
    var b = document.createElement("div");
    b.className = "nynbot-bubble";
    b.textContent = text;
    row.appendChild(b);
    msgsEl.appendChild(row);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return b;
  }

  function showTyping() {
    var row = document.createElement("div");
    row.className = "nynbot-row bot";
    row.id = "nynbot-typing-row";
    row.innerHTML = '<div class="nynbot-bubble nynbot-typing"><span></span><span></span><span></span></div>';
    msgsEl.appendChild(row);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function hideTyping() {
    var row = document.getElementById("nynbot-typing-row");
    if (row) row.remove();
  }

  function openPanel() {
    panel.classList.add("open");
    fab.setAttribute("aria-expanded", "true");
    if (!greeted) {
      greeted = true;
      addBubble("model", "Hi! আমি NYN-এর AI সহকারী। প্রোগ্রাম, মেম্বারশিপ বা NYN নিয়ে যেকোনো প্রশ্ন করতে পারেন। 🙂");
    }
    setTimeout(function () { input.focus(); }, 200);
  }
  function closePanel() {
    panel.classList.remove("open");
    fab.setAttribute("aria-expanded", "false");
  }

  fab.addEventListener("click", function () {
    panel.classList.contains("open") ? closePanel() : openPanel();
  });
  closeBtn.addEventListener("click", closePanel);

  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 90) + "px";
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  sendBtn.addEventListener("click", send);

  function send() {
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    input.style.height = "auto";
    addBubble("user", text);
    history.push({ role: "user", parts: [{ text: text }] });
    if (history.length > MAX_HISTORY_TURNS * 2) {
      history = history.slice(history.length - MAX_HISTORY_TURNS * 2);
    }
    askGemini();
  }

  function askGemini() {
    sendBtn.disabled = true;
    showTyping();
    fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { role: "system", parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: history,
        generationConfig: { temperature: 0.6, maxOutputTokens: 400 }
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        hideTyping();
        sendBtn.disabled = false;
        var reply =
          data &&
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].text;
        if (!reply) {
          reply = "দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। একটু পরে আবার চেষ্টা করুন।";
        }
        addBubble("model", reply);
        history.push({ role: "model", parts: [{ text: reply }] });
      })
      .catch(function () {
        hideTyping();
        sendBtn.disabled = false;
        addBubble("model", "নেটওয়ার্ক সমস্যা হচ্ছে — একটু পরে আবার চেষ্টা করুন।");
      });
  }
})();
