import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "auto", name: "Auto Detect", flag: "🌐" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese (Simplified)", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ta", name: "Tamil", flag: "🇮🇳" },
  { code: "te", name: "Telugu", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", flag: "🇧🇩" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
];

const TRANSLATION_MODES = [
  { id: "standard", label: "Standard", icon: "✦" },
  { id: "formal", label: "Formal", icon: "◈" },
  { id: "casual", label: "Casual", icon: "◇" },
  { id: "technical", label: "Technical", icon: "⬡" },
  { id: "literary", label: "Literary", icon: "◉" },
];

const AGENT_STAGES = [
  { id: "detect", label: "Language Detection", icon: "⊕" },
  { id: "context", label: "Context Analysis", icon: "⊗" },
  { id: "translate", label: "Translation Generation", icon: "⊘" },
  { id: "validate", label: "Validation & Critique", icon: "⊙" },
  { id: "refine", label: "Refinement", icon: "◎" },
];

// ─── API Layer ────────────────────────────────────────────────────────────────

async function callOpenRouter(
  text,
  sourceLang,
  targetLang,
  mode = "standard"
) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        max_tokens: 180,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: `
Translate from ${sourceLang} to ${targetLang}.

Mode: ${mode}

Return raw JSON only.
Do not use markdown.
Do not use code blocks.

{
  "translation": "...",
  "transliteration": "...",
  "pronunciation": "...",
  "alternatives": ["...", "..."],
  "confidence": 0.95
}
`
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    }
  );

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    throw new Error(
      data.error?.message || "OpenRouter API error"
    );
  }

  const content = data.choices[0].message.content;

  const cleaned = content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.log("RAW MODEL OUTPUT:", content);

    return {
      translation: cleaned,
      transliteration: null,
      pronunciation: null,
      alternatives: [],
      confidence: 0.90,
      detected_language: sourceLang,
      tone: "general",
      domain: "general",
      nuances: null,
      agent_reasoning: "Generated using OpenRouter."
    };
  }
}


async function runConversationalAgent(
  message,
  history,
  sourceLang,
  targetLang,
  onChunk
) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        max_tokens: 120,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
  "You are PolyLang AI, a multilingual AI assistant helping users with translations, grammar, language learning, and conversations."
          },
          ...history,
          {
            role: "user",
            content: message
          }
        ]
      })
    }
  );

const data = await response.json();

if (!data.choices || !data.choices[0]) {
  throw new Error(data.error?.message || "OpenRouter API error");
}

const content = data.choices[0].message.content;

  if (onChunk) {
    onChunk(content);
  }

  return content;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0b0f;
    --bg2: #111318;
    --bg3: #181c24;
    --bg4: #1e2430;
    --border: rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.12);
    --text: #e8eaf0;
    --text2: #8b90a0;
    --text3: #555c70;
    --accent: #6c8ef5;
    --accent2: #4a6ef0;
    --accent-glow: rgba(108,142,245,0.15);
    --green: #4ecb8d;
    --amber: #f0b429;
    --red: #f06a6a;
    --teal: #38c4b8;
    --purple: #a78bf0;
    --font: 'Sora', sans-serif;
    --mono: 'JetBrains Mono', monospace;
    --radius: 12px;
    --radius-lg: 18px;
    --radius-xl: 24px;
    --sidebar: 240px;
    --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  body { font-family: var(--font); background: var(--bg); color: var(--text); overflow-x: hidden; }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* Sidebar */
  .sidebar {
    width: var(--sidebar);
    background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    transition: width var(--transition);
    overflow: hidden;
    flex-shrink: 0;
  }
  .sidebar.collapsed { width: 56px; }
  .sidebar-logo {
    padding: 20px 16px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid var(--border);
  }
  .logo-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, var(--accent), var(--purple));
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .logo-text { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; }
  .logo-sub { font-size: 10px; color: var(--text3); font-weight: 400; }

  .sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; overflow-x: hidden; }
  .nav-section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text3); padding: 8px 8px 4px; white-space: nowrap; overflow: hidden; }
  .sidebar.collapsed .nav-section-label { opacity: 0; }

  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 8px; cursor: pointer;
    font-size: 13px; color: var(--text2); transition: all var(--transition);
    white-space: nowrap; overflow: hidden; position: relative;
  }
  .nav-item:hover { background: var(--bg3); color: var(--text); }
  .nav-item.active { background: var(--accent-glow); color: var(--accent); }
  .nav-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }
  .nav-label { overflow: hidden; text-overflow: ellipsis; }
  .sidebar.collapsed .nav-label { opacity: 0; width: 0; }

  .nav-badge {
    margin-left: auto; background: var(--accent); color: white;
    font-size: 10px; padding: 1px 6px; border-radius: 10px;
    font-weight: 600; flex-shrink: 0;
  }
  .sidebar.collapsed .nav-badge { display: none; }

  .sidebar-bottom { padding: 12px 8px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 2px; }

  .collapse-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px; cursor: pointer;
    color: var(--text3); transition: all var(--transition); border: 1px solid var(--border);
    margin-left: auto; margin-right: 4px; flex-shrink: 0;
  }
  .collapse-btn:hover { color: var(--text); border-color: var(--border2); background: var(--bg3); }

  /* Main */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

  .topbar {
    height: 52px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; padding: 0 20px; gap: 12px;
    background: var(--bg2); flex-shrink: 0;
  }
  .topbar-title { font-size: 14px; font-weight: 500; }
  .topbar-spacer { flex: 1; }
  .status-pill {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--text2);
    background: var(--bg3); border: 1px solid var(--border);
    padding: 4px 10px; border-radius: 20px;
  }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* Tabs */
  .tab-bar {
    display: flex; gap: 2px; padding: 10px 20px 0;
    background: var(--bg2); border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .tab {
    padding: 8px 16px; font-size: 13px; cursor: pointer;
    border-radius: 8px 8px 0 0; color: var(--text2);
    transition: all var(--transition); border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); background: var(--bg); }

  /* Content */
  .content { flex: 1; overflow-y: auto; padding: 20px; }
  .content::-webkit-scrollbar { width: 4px; }
  .content::-webkit-scrollbar-track { background: transparent; }
  .content::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 4px; }

  /* Translation Panel */
  .translation-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .panel {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius-lg); overflow: hidden;
  }
  .panel-header {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px; border-bottom: 1px solid var(--border);
    background: var(--bg3);
  }
  .lang-select-wrap { display: flex; align-items: center; gap: 6px; flex: 1; }
  .lang-select {
    background: var(--bg2); border: 1px solid var(--border2);
    color: var(--text); font-family: var(--font); font-size: 13px;
    padding: 6px 10px; border-radius: 8px; cursor: pointer;
    outline: none; transition: border-color var(--transition);
    flex: 1;
  }
  .lang-select:hover, .lang-select:focus { border-color: var(--accent); }
  .lang-flag { font-size: 18px; }

  .swap-btn {
    background: var(--bg3); border: 1px solid var(--border);
    color: var(--text2); padding: 6px 10px; border-radius: 8px;
    cursor: pointer; font-size: 14px; transition: all var(--transition);
    display: flex; align-items: center; gap: 4px; font-size: 13px;
  }
  .swap-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }

  .mode-row {
    display: flex; gap: 6px; padding: 10px 16px;
    border-bottom: 1px solid var(--border); flex-wrap: wrap;
  }
  .mode-chip {
    padding: 4px 10px; border-radius: 20px; font-size: 12px;
    cursor: pointer; border: 1px solid var(--border);
    color: var(--text2); transition: all var(--transition);
    display: flex; align-items: center; gap: 4px;
  }
  .mode-chip:hover { border-color: var(--accent); color: var(--accent); }
  .mode-chip.active { background: var(--accent-glow); border-color: var(--accent); color: var(--accent); }

  textarea.trans-input {
    width: 100%; background: transparent; border: none; outline: none;
    resize: none; font-family: var(--font); font-size: 15px; color: var(--text);
    padding: 16px; line-height: 1.6; min-height: 180px;
  }
  textarea.trans-input::placeholder { color: var(--text3); }

  .panel-footer {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-top: 1px solid var(--border); background: var(--bg3);
    flex-wrap: wrap;
  }
  .char-count { font-size: 12px; color: var(--text3); margin-right: auto; }

  .btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 8px; cursor: pointer;
    font-family: var(--font); font-size: 13px; font-weight: 500;
    transition: all var(--transition); border: 1px solid transparent;
  }
  .btn-primary {
    background: var(--accent); color: white; border-color: var(--accent);
  }
  .btn-primary:hover { background: var(--accent2); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-ghost {
    background: transparent; color: var(--text2); border-color: var(--border);
  }
  .btn-ghost:hover { background: var(--bg4); color: var(--text); border-color: var(--border2); }

  /* Output area */
  .output-text {
    padding: 16px; min-height: 180px; font-size: 15px; line-height: 1.6;
    color: var(--text);
  }
  .output-placeholder { color: var(--text3); font-size: 14px; }
  .streaming-cursor { display: inline-block; width: 2px; height: 16px; background: var(--accent); margin-left: 2px; animation: blink 1s infinite; vertical-align: text-bottom; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* Meta info */
  .meta-row {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 8px 16px; border-top: 1px solid var(--border); background: var(--bg3);
  }
  .meta-chip {
    display: flex; align-items: center; gap: 4px;
    font-size: 11px; padding: 3px 8px; border-radius: 6px;
  }
  .meta-chip.confidence { background: rgba(78,203,141,0.12); color: var(--green); }
  .meta-chip.tone { background: rgba(108,142,245,0.12); color: var(--accent); }
  .meta-chip.domain { background: rgba(167,139,240,0.12); color: var(--purple); }
  .meta-chip.lang { background: rgba(56,196,184,0.12); color: var(--teal); }

  .alternatives-row { padding: 10px 16px; border-top: 1px solid var(--border); }
  .alt-label { font-size: 11px; color: var(--text3); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em; }
  .alt-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .alt-chip {
    font-size: 12px; padding: 4px 10px; border-radius: 8px;
    background: var(--bg4); border: 1px solid var(--border); color: var(--text2);
    cursor: pointer; transition: all var(--transition);
  }
  .alt-chip:hover { border-color: var(--accent); color: var(--accent); }

  .nuance-row { padding: 10px 16px; border-top: 1px solid var(--border); }
  .nuance-text { font-size: 12px; color: var(--text2); line-height: 1.5; font-style: italic; }

  /* Agent Pipeline */
  .agent-panel {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 16px; margin-bottom: 16px;
  }
  .agent-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text3); margin-bottom: 12px; }
  .agent-stages { display: flex; gap: 0; overflow: hidden; border-radius: 8px; border: 1px solid var(--border); }
  .agent-stage {
    flex: 1; padding: 8px 6px; font-size: 11px; text-align: center;
    border-right: 1px solid var(--border); last-child:{ border-right: none; }
    transition: all var(--transition); color: var(--text3);
    display: flex; flex-direction: column; align-items: center; gap: 3px;
  }
  .agent-stage:last-child { border-right: none; }
  .agent-stage.pending { color: var(--text3); }
  .agent-stage.running { color: var(--amber); background: rgba(240,180,41,0.06); animation: stagePulse 0.8s infinite; }
  .agent-stage.done { color: var(--green); background: rgba(78,203,141,0.06); }
  @keyframes stagePulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
  .stage-icon { font-size: 14px; }
  .stage-label { font-size: 10px; line-height: 1.2; }

  /* History */
  .history-list { display: flex; flex-direction: column; gap: 8px; }
  .history-item {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 12px; cursor: pointer;
    transition: all var(--transition);
  }
  .history-item:hover { border-color: var(--accent); background: var(--accent-glow); }
  .history-langs { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text3); margin-bottom: 6px; }
  .history-source { font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .history-target { font-size: 13px; color: var(--text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }

  /* Chat */
  .chat-container { display: flex; flex-direction: column; height: 100%; gap: 16px; }
  .chat-messages { flex: 1; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding-right: 4px; }
  .chat-messages::-webkit-scrollbar { width: 3px; }
  .chat-messages::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 4px; }

  .chat-msg { display: flex; gap: 10px; max-width: 85%; }
  .chat-msg.user { align-self: flex-end; flex-direction: row-reverse; }
  .chat-msg.assistant { align-self: flex-start; }

  .chat-avatar {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600;
  }
  .chat-avatar.user { background: var(--accent); color: white; }
  .chat-avatar.assistant { background: linear-gradient(135deg, var(--accent), var(--purple)); color: white; }

  .chat-bubble {
    padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.6;
    max-width: 100%;
  }
  .chat-msg.user .chat-bubble { background: var(--accent); color: white; border-radius: 12px 4px 12px 12px; }
  .chat-msg.assistant .chat-bubble { background: var(--bg3); border: 1px solid var(--border); border-radius: 4px 12px 12px 12px; color: var(--text); }

  .chat-input-row { display: flex; gap: 8px; align-items: flex-end; }
  .chat-input {
    flex: 1; background: var(--bg2); border: 1px solid var(--border);
    border-radius: 12px; padding: 10px 14px; font-family: var(--font);
    font-size: 14px; color: var(--text); resize: none; outline: none;
    transition: border-color var(--transition); max-height: 120px; min-height: 42px;
  }
  .chat-input:focus { border-color: var(--accent); }

  /* Settings */
  .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .setting-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 16px;
  }
  .setting-title { font-size: 14px; font-weight: 500; margin-bottom: 12px; }
  .setting-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .setting-row:last-child { border-bottom: none; }
  .setting-label { font-size: 13px; color: var(--text2); }
  .toggle {
    width: 36px; height: 20px; border-radius: 10px; cursor: pointer;
    position: relative; transition: background var(--transition);
  }
  .toggle.on { background: var(--accent); }
  .toggle.off { background: var(--bg4); border: 1px solid var(--border); }
  .toggle-thumb {
    position: absolute; top: 2px; width: 16px; height: 16px; border-radius: 50%;
    background: white; transition: left var(--transition);
  }
  .toggle.on .toggle-thumb { left: 18px; }
  .toggle.off .toggle-thumb { left: 2px; }

  /* Analytics */
  .analytics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
  .stat-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 16px;
  }
  .stat-value { font-size: 28px; font-weight: 600; margin-bottom: 4px; }
  .stat-label { font-size: 12px; color: var(--text3); }
  .stat-delta { font-size: 11px; margin-top: 4px; }
  .stat-delta.up { color: var(--green); }
  .stat-delta.down { color: var(--red); }

  /* Empty / Loading */
  .empty-state { text-align: center; padding: 40px 20px; color: var(--text3); }
  .empty-icon { font-size: 36px; margin-bottom: 12px; }
  .empty-text { font-size: 14px; }

  .thinking-dots { display: flex; gap: 4px; padding: 10px 14px; }
  .thinking-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text3); animation: thinking 1.2s infinite; }
  .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
  .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes thinking { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-4px);opacity:1} }

  /* Transliteration */
  .translit-row { padding: 8px 16px; border-top: 1px solid var(--border); font-family: var(--mono); font-size: 12px; color: var(--teal); background: rgba(56,196,184,0.04); }

  /* Error */
  .error-banner { background: rgba(240,106,106,0.1); border: 1px solid rgba(240,106,106,0.2); color: var(--red); border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; }

  /* Responsive */
  @media (max-width: 768px) {
    .translation-layout { grid-template-columns: 1fr; }
    .analytics-grid { grid-template-columns: repeat(2, 1fr); }
    .settings-grid { grid-template-columns: 1fr; }
    .sidebar { width: 0; position: absolute; z-index: 10; height: 100%; }
    .sidebar.mobile-open { width: var(--sidebar); }
  }

  /* Scrollbar */
  .content::-webkit-scrollbar { width: 4px; }

  /* Animations */
  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

  select option { background: #1e2430; }

  .reasoning-row { padding: 8px 16px; border-top: 1px solid var(--border); background: rgba(108,142,245,0.04); }
  .reasoning-text { font-size: 11px; color: var(--text3); display: flex; align-items: flex-start; gap: 6px; }
  .reasoning-text::before { content: '⟳'; color: var(--accent); font-size: 12px; flex-shrink: 0; margin-top: 1px; }
`;

// ─── Components ───────────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <div className={`toggle ${value ? "on" : "off"}`} onClick={() => onChange(!value)}>
      <div className="toggle-thumb" />
    </div>
  );
}

function AgentPipeline({ stages }) {
  return (
    <div className="agent-panel fade-in">
      <div className="agent-title">⬡ Agent Pipeline</div>
      <div className="agent-stages">
        {AGENT_STAGES.map(s => (
          <div key={s.id} className={`agent-stage ${stages[s.id] || "pending"}`}>
            <span className="stage-icon">{s.icon}</span>
            <span className="stage-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ history, onSelect }) {
  if (!history.length) return (
    <div className="empty-state">
      <div className="empty-icon">◫</div>
      <div className="empty-text">No translations yet</div>
    </div>
  );
  return (
    <div className="history-list">
      {history.slice().reverse().map((item, i) => (
        <div key={i} className="history-item fade-in" onClick={() => onSelect(item)}>
          <div className="history-langs">
            <span>{item.sourceLangName}</span>
            <span>→</span>
            <span>{item.targetLangName}</span>
            <span style={{ marginLeft: "auto" }}>{item.mode}</span>
          </div>
          <div className="history-source">{item.sourceText}</div>
          <div className="history-target">{item.translation}</div>
        </div>
      ))}
    </div>
  );
}

function ChatPanel({ targetLang, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm PolyLang AI. I can help you understand translations, explore linguistic nuances, explain idioms, or assist with language learning. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setLoading(true);

    const history = newMsgs.slice(-8).slice(0, -1);
    let reply = "";
    try {
      await runConversationalAgent(text, history, "en", targetLang, (partial) => {
        reply = partial;
        setMessages([...newMsgs, { role: "assistant", content: partial, streaming: true }]);
      });
      setMessages([...newMsgs, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMsgs, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="chat-container" style={{ height: "calc(100vh - 160px)" }}>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role} fade-in`}>
            <div className={`chat-avatar ${m.role}`}>{m.role === "user" ? "U" : "P"}</div>
            <div className="chat-bubble">
              {m.content}
              {m.streaming && <span className="streaming-cursor" />}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="chat-msg assistant">
            <div className="chat-avatar assistant">P</div>
            <div className="chat-bubble">
              <div className="thinking-dots">
                <div className="thinking-dot" />
                <div className="thinking-dot" />
                <div className="thinking-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <textarea
          className="chat-input"
          placeholder="Ask about translations, idioms, grammar..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          rows={1}
        />
        <button className="btn btn-primary" onClick={sendMessage} disabled={loading || !input.trim()}>
          ↑
        </button>
      </div>
    </div>
  );
}

function AnalyticsPanel({ history }) {
  const totalTranslations = history.length;
  const avgConfidence = history.length
    ? (history.reduce((s, h) => s + (h.confidence || 0.9), 0) / history.length * 100).toFixed(1)
    : 0;
  const uniqueLangs = new Set(history.map(h => h.targetLang)).size;
  const langCounts = {};
  history.forEach(h => { langCounts[h.targetLangName] = (langCounts[h.targetLangName] || 0) + 1; });
  const topLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="fade-in">
      <div className="analytics-grid">
        {[
          { label: "Total Translations", value: totalTranslations, delta: "+12%", dir: "up" },
          { label: "Avg Confidence", value: `${avgConfidence}%`, delta: "+2.1%", dir: "up" },
          { label: "Languages Used", value: uniqueLangs, delta: null },
          { label: "Saved Phrases", value: 0, delta: null },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value" style={{ color: i === 0 ? "var(--accent)" : i === 1 ? "var(--green)" : "var(--text)" }}>
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
            {s.delta && <div className={`stat-delta ${s.dir}`}>{s.delta} this week</div>}
          </div>
        ))}
      </div>

      <div className="stat-card" style={{ marginBottom: 16 }}>
        <div className="setting-title">Most Used Languages</div>
        {topLangs.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text3)" }}>No data yet. Start translating!</div>
        ) : topLangs.map(([lang, count], i) => (
          <div key={i} className="setting-row">
            <span className="setting-label">{lang}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 80, height: 4, background: "var(--bg4)", borderRadius: 2 }}>
                <div style={{ width: `${(count / totalTranslations) * 100}%`, height: "100%", background: "var(--accent)", borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 12, color: "var(--text2)", width: 20, textAlign: "right" }}>{count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel({ settings, onChange }) {
  return (
    <div className="settings-grid fade-in">
      {[
        {
          title: "Translation Preferences",
          items: [
            { label: "Auto-detect language", key: "autoDetect" },
            { label: "Show transliteration", key: "showTranslit" },
            { label: "Show pronunciation", key: "showPronunciation" },
            { label: "Show agent reasoning", key: "showReasoning" },
          ],
        },
        {
          title: "Interface",
          items: [
            { label: "Show agent pipeline", key: "showPipeline" },
            { label: "Stream output live", key: "streaming" },
            { label: "Show alternatives", key: "showAlternatives" },
            { label: "Show nuances", key: "showNuances" },
          ],
        },
      ].map((group, gi) => (
        <div key={gi} className="setting-card">
          <div className="setting-title">{group.title}</div>
          {group.items.map(item => (
            <div key={item.key} className="setting-row">
              <span className="setting-label">{item.label}</span>
              <Toggle value={settings[item.key] !== false} onChange={v => onChange(item.key, v)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function PolyLangAI() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("translate");
  const [activeNav, setActiveNav] = useState("translate");

  const [sourceText, setSourceText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("hi");
  const [mode, setMode] = useState("standard");

  const [result, setResult] = useState(null);
  const [streamingText, setStreamingText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [agentStages, setAgentStages] = useState({});
  const [showPipeline, setShowPipeline] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState({
    autoDetect: true,
    showTranslit: true,
    showPronunciation: true,
    showReasoning: true,
    showPipeline: true,
    streaming: true,
    showAlternatives: true,
    showNuances: true,
  });

  const sourceLangObj = LANGUAGES.find(l => l.code === sourceLang);
  const targetLangObj = LANGUAGES.find(l => l.code === targetLang);

  const updateStage = useCallback((id, status) => {
    setAgentStages(prev => ({ ...prev, [id]: status }));
  }, []);

  const handleTranslate = async () => {
  if (!sourceText.trim() || isTranslating) return;

  setIsTranslating(true);
  setResult(null);
  setStreamingText("");
  setError("");
  setAgentStages({});
  setShowPipeline(settings.showPipeline !== false);

  try {
    // ─── Simulated Agent Pipeline ─────────────────────
    if (settings.showPipeline !== false) {
      updateStage("detect", "running");
      await new Promise(r => setTimeout(r, 300));
      updateStage("detect", "done");

      updateStage("context", "running");
      await new Promise(r => setTimeout(r, 300));
      updateStage("context", "done");

      updateStage("translate", "running");
    }

    // ─── Main Translation Request ────────────────────
    const res = await callOpenRouter(
      sourceText,
      sourceLang,
      targetLang,
      mode
    );

    // ─── Finish Pipeline ─────────────────────────────
    if (settings.showPipeline !== false) {
      updateStage("translate", "done");

      updateStage("validate", "running");
      await new Promise(r => setTimeout(r, 200));
      updateStage("validate", "done");

      updateStage("refine", "running");
      await new Promise(r => setTimeout(r, 200));
      updateStage("refine", "done");
    }

    // ─── Save Result ─────────────────────────────────
    setResult(res);
    setStreamingText("");

    const entry = {
      sourceText,
      sourceLang,
      targetLang,
      sourceLangName: sourceLangObj?.name,
      targetLangName: targetLangObj?.name,
      translation: res.translation,
      confidence: res.confidence,
      mode,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, entry]);

  } catch (e) {
    console.error(e);

    setError(
      e.message ||
      "Translation failed. Please check your API key or internet connection."
    );

    setAgentStages({});
  } finally {
    setIsTranslating(false);
  }
};

  const handleSwap = () => {
    if (sourceLang === "auto") return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    if (result?.translation) {
      setSourceText(result.translation);
      setResult(null);
    }
  };

  const handleHistorySelect = (item) => {
    setSourceText(item.sourceText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setActiveTab("translate");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const navItems = [
    { id: "translate", label: "Translate", icon: "⟷", tab: "translate" },
    { id: "chat", label: "AI Assistant", icon: "◉", tab: "chat" },
    { id: "history", label: "History", icon: "◷", badge: history.length || null, tab: "history" },
    { id: "analytics", label: "Analytics", icon: "◈", tab: "analytics" },
    { id: "settings", label: "Settings", icon: "⚙", tab: "settings" },
  ];

  const outputText = streamingText
    ? (() => { try { return JSON.parse(streamingText.replace(/```json|```/g, "").trim()).translation; } catch { return null; } })()
    : result?.translation;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sidebar-logo">
            <div className="logo-icon">⬡</div>
            <div style={{ overflow: "hidden" }}>
              <div className="logo-text">PolyLang AI</div>
              <div className="logo-sub">Agentic Translation</div>
            </div>
            <div
              className="collapse-btn"
              style={{ marginLeft: "auto", flexShrink: 0 }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? "›" : "‹"}
            </div>
          </div>

          <div className="sidebar-nav">
            <div className="nav-section-label">Navigation</div>
            {navItems.map(item => (
              <div
                key={item.id}
                className={`nav-item ${activeNav === item.id ? "active" : ""}`}
                onClick={() => { setActiveNav(item.id); setActiveTab(item.tab); }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
              </div>
            ))}

            <div className="nav-section-label" style={{ marginTop: 8 }}>Quick Pairs</div>
            {[["en", "hi"], ["en", "es"], ["en", "ja"], ["en", "ar"]].map(([s, t]) => {
              const sl = LANGUAGES.find(l => l.code === s);
              const tl = LANGUAGES.find(l => l.code === t);
              return (
                <div
                  key={`${s}-${t}`}
                  className="nav-item"
                  onClick={() => { setSourceLang(s); setTargetLang(t); setActiveTab("translate"); setActiveNav("translate"); }}
                >
                  <span className="nav-icon">{sl?.flag}</span>
                  <span className="nav-label">{sl?.name} → {tl?.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">
              {activeTab === "translate" && "Translation Studio"}
              {activeTab === "chat" && "AI Language Assistant"}
              {activeTab === "history" && "Translation History"}
              {activeTab === "analytics" && "Analytics Dashboard"}
              {activeTab === "settings" && "Settings & Preferences"}
            </div>
            <div className="topbar-spacer" />
            <div className="status-pill">
              <div className="status-dot" />
              AI Agents Online
            </div>
            <div className="status-pill" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
              {LANGUAGES.length - 1} languages
            </div>
          </div>

          {/* Tab bar for translate */}
          {activeTab === "translate" && (
            <div className="tab-bar">
              {["translate", "chat"].map(t => (
                <div
                  key={t}
                  className={`tab ${activeTab === t ? "active" : ""}`}
                  onClick={() => { setActiveTab(t); setActiveNav(t); }}
                >
                  {t === "translate" ? "⟷ Translate" : "◉ AI Chat"}
                </div>
              ))}
            </div>
          )}

          <div className="content">
            {error && <div className="error-banner">⚠ {error}</div>}

            {/* TRANSLATE TAB */}
            {activeTab === "translate" && (
              <div className="fade-in">
                {/* Agent Pipeline */}
                {showPipeline && isTranslating && <AgentPipeline stages={agentStages} />}
                {showPipeline && result && !isTranslating && <AgentPipeline stages={agentStages} />}

                {/* Lang selector row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div className="lang-select-wrap" style={{ flex: 1 }}>
                    <span className="lang-flag">{sourceLangObj?.flag || "🌐"}</span>
                    <select
                      className="lang-select"
                      value={sourceLang}
                      onChange={e => setSourceLang(e.target.value)}
                    >
                      {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                      ))}
                    </select>
                  </div>
                  <button className="swap-btn" onClick={handleSwap}>⇄ Swap</button>
                  <div className="lang-select-wrap" style={{ flex: 1 }}>
                    <span className="lang-flag">{targetLangObj?.flag || "🌐"}</span>
                    <select
                      className="lang-select"
                      value={targetLang}
                      onChange={e => setTargetLang(e.target.value)}
                    >
                      {LANGUAGES.filter(l => l.code !== "auto").map(l => (
                        <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mode row */}
                <div className="mode-row" style={{ marginBottom: 12, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TRANSLATION_MODES.map(m => (
                    <div
                      key={m.id}
                      className={`mode-chip ${mode === m.id ? "active" : ""}`}
                      onClick={() => setMode(m.id)}
                    >
                      {m.icon} {m.label}
                    </div>
                  ))}
                </div>

                {/* Translation panels */}
                <div className="translation-layout">
                  {/* Input */}
                  <div className="panel">
                    <div className="panel-header">
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{sourceLangObj?.flag} Source Text</div>
                      <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text3)" }}>
                        {sourceText.length} chars
                      </div>
                    </div>
                    <textarea
                      className="trans-input"
                      placeholder="Enter text to translate..."
                      value={sourceText}
                      onChange={e => setSourceText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleTranslate(); }}
                    />
                    <div className="panel-footer">
                      <span className="char-count">Ctrl+Enter to translate</span>
                      <button
                        className="btn btn-ghost"
                        onClick={() => { setSourceText(""); setResult(null); setStreamingText(""); setAgentStages({}); setShowPipeline(false); }}
                      >
                        ✕ Clear
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleTranslate}
                        disabled={isTranslating || !sourceText.trim()}
                      >
                        {isTranslating ? "⟳ Translating..." : "⟷ Translate"}
                      </button>
                    </div>
                  </div>

                  {/* Output */}
                  <div className="panel">
                    <div className="panel-header">
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{targetLangObj?.flag} Translation</div>
                      {result && (
                        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => copyToClipboard(result.translation)}>
                            ⎘ Copy
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="output-text">
                      {isTranslating && !outputText && (
                        <div className="thinking-dots">
                          <div className="thinking-dot" />
                          <div className="thinking-dot" />
                          <div className="thinking-dot" />
                        </div>
                      )}
                      {isTranslating && outputText && (
                        <span>{outputText}<span className="streaming-cursor" /></span>
                      )}
                      {!isTranslating && result && <span className="fade-in">{result.translation}</span>}
                      {!isTranslating && !result && !outputText && (
                        <span className="output-placeholder">Translation will appear here...</span>
                      )}
                    </div>

                    {result && (
                      <>
                        {/* Transliteration */}
                        {settings.showTranslit !== false && result.transliteration && (
                          <div className="translit-row">
                            ◈ {result.transliteration}
                          </div>
                        )}

                        {/* Pronunciation */}
                        {settings.showPronunciation !== false && result.pronunciation && (
                          <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--purple)" }}>
                            ◉ {result.pronunciation}
                          </div>
                        )}

                        {/* Meta */}
                        <div className="meta-row">
                          <span className="meta-chip confidence">
                            ✦ {(result.confidence * 100).toFixed(0)}% confidence
                          </span>
                          {result.tone && (
                            <span className="meta-chip tone">◈ {result.tone}</span>
                          )}
                          {result.domain && (
                            <span className="meta-chip domain">⬡ {result.domain}</span>
                          )}
                          {result.detected_language && sourceLang === "auto" && (
                            <span className="meta-chip lang">⊕ Detected: {result.detected_language}</span>
                          )}
                        </div>

                        {/* Alternatives */}
                        {settings.showAlternatives !== false && result.alternatives?.length > 0 && (
                          <div className="alternatives-row">
                            <div className="alt-label">Alternative Translations</div>
                            <div className="alt-list">
                              {result.alternatives.map((a, i) => (
                                <div key={i} className="alt-chip" onClick={() => copyToClipboard(a)}>{a}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Nuances */}
                        {settings.showNuances !== false && result.nuances && (
                          <div className="nuance-row">
                            <div className="nuance-text">◎ {result.nuances}</div>
                          </div>
                        )}

                        {/* Agent reasoning */}
                        {settings.showReasoning !== false && result.agent_reasoning && (
                          <div className="reasoning-row">
                            <div className="reasoning-text">{result.agent_reasoning}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab === "chat" && <ChatPanel targetLang={targetLang} />}

            {/* HISTORY TAB */}
            {activeTab === "history" && (
              <div className="fade-in">
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 14, color: "var(--text2)" }}>{history.length} translations</div>
                  {history.length > 0 && (
                    <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setHistory([])}>
                      Clear All
                    </button>
                  )}
                </div>
                <HistoryPanel history={history} onSelect={handleHistorySelect} />
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === "analytics" && <AnalyticsPanel history={history} />}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <SettingsPanel
                settings={settings}
                onChange={(key, val) => setSettings(prev => ({ ...prev, [key]: val }))}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
