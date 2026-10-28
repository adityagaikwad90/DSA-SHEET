import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bot,
  User,
  Send,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  X,
  RotateCcw,
  Key,
  Cpu,
  Zap,
  ShieldAlert,
  Code2,
  Terminal,
  Activity,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './FuturisticFloatingAi.css';

const CHAT_STORAGE_KEY = 'NEURAL_COPILOT_CHAT_V2';
const CUSTOM_KEY_STORAGE = 'CUSTOM_GEMINI_API_KEY';

// Assistant Operational Modes
const AI_MODES = [
  { id: 'hint', label: 'Quick Hint', icon: Zap, color: '#ffa116', promptPrefix: 'Give a subtle conceptual hint without spoiling the full solution.' },
  { id: 'explain', label: 'Deep Explain', icon: Cpu, color: '#00f0ff', promptPrefix: 'Provide deep step-by-step intuitive breakdown of the algorithm with clear logic.' },
  { id: 'complexity', label: 'Big-O Analysis', icon: Activity, color: '#a855f7', promptPrefix: 'Analyze time and space complexity with Big-O notation, worst/average/best cases.' },
  { id: 'debug', label: 'Code Debugger', icon: ShieldAlert, color: '#ef4444', promptPrefix: 'Identify edge cases, off-by-one errors, or potential bugs in this logic.' }
];

// Copy Code Button
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <button className="cyber-copy-btn" onClick={handleCopy} title="Copy code block">
      {copied ? (
        <>
          <Check size={12} className="text-teal" />
          <span>COPIED</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span>COPY</span>
        </>
      )}
    </button>
  );
};

// Markdown Parser for Futuristic Terminal Output
const parseCyberMarkdown = (text) => {
  if (!text) return '';

  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : '';
      const code = match ? match[2] : part.slice(3, -3);

      return (
        <div key={index} className="cyber-code-block">
          <div className="cyber-code-header">
            <div className="cyber-code-lang">
              <span className="lang-indicator-dot" />
              <span>{language || 'code'}</span>
            </div>
            <CopyButton text={code} />
          </div>
          <pre className="cyber-code-content">
            <code>{code.trim()}</code>
          </pre>
        </div>
      );
    } else {
      const lines = part.split('\n');
      return lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
        const isNumbered = /^\d+\.\s/.test(trimmed);

        let cleanLine = trimmed;
        if (isBullet) {
          cleanLine = trimmed.replace(/^[\*\-]\s+/, '');
        } else if (isNumbered) {
          cleanLine = trimmed.replace(/^\d+\.\s+/, '');
        }

        const subParts = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);
        const renderedLine = subParts.map((subPart, subIdx) => {
          if (subPart.startsWith('**') && subPart.endsWith('**')) {
            return <strong key={subIdx} className="cyber-bold">{subPart.slice(2, -2)}</strong>;
          }
          if (subPart.startsWith('`') && subPart.endsWith('`')) {
            return <code key={subIdx} className="cyber-inline-code">{subPart.slice(1, -1)}</code>;
          }
          return subPart;
        });

        if (isBullet) {
          return (
            <li key={lineIdx} className="cyber-list-item">
              <span className="cyber-bullet-dot">›</span>
              <span>{renderedLine}</span>
            </li>
          );
        }

        if (isNumbered) {
          const numMatch = trimmed.match(/^(\d+)\.\s+/);
          const number = numMatch ? numMatch[1] : '1';
          return (
            <li key={lineIdx} className="cyber-list-item numbered">
              <span className="cyber-num-badge">{number}</span>
              <span>{renderedLine}</span>
            </li>
          );
        }

        if (trimmed === '') {
          return <div key={lineIdx} className="cyber-line-spacer" />;
        }

        return (
          <p key={lineIdx} className="cyber-paragraph">
            {renderedLine}
          </p>
        );
      });
    }
  });
};

export default function FuturisticFloatingAi() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMode, setSelectedMode] = useState('hint');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initial welcome message
  const initialMessages = [
    {
      id: 1,
      sender: 'ai',
      text: "**NEURAL COPILOT v3.5 // ONLINE**\n\nI am your floating algorithmic copilot. Ask me for intuitive hints, space-time complexity proofs, edge case verification, or optimal code dry-runs.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  // Load chat history from sessionStorage
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialMessages;
    } catch {
      return initialMessages;
    }
  });

  // Save chat history
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Session storage write error', e);
    }
  }, [messages]);

  // Load custom key
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_KEY_STORAGE);
      if (stored) setCustomApiKey(stored);
    } catch (e) {
      console.warn('Local storage error', e);
    }
  }, []);

  // Keyboard shortcut: Ctrl + / or Cmd + / to toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, messages, isTyping]);

  // Get active Gemini API Key
  const getActiveKey = () => {
    if (customApiKey && customApiKey.trim().length > 0) {
      return customApiKey.trim();
    }
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    return envKey ? envKey.trim() : '';
  };

  // Context-aware suggested prompt chips
  const suggestedPrompts = useMemo(() => {
    const path = location.pathname;
    if (path.includes('pattern') || path.includes('interview-hub')) {
      return [
        "💡 How do I identify this pattern?",
        "⏱️ Time & Space complexity breakdown",
        "⚠️ What are the top edge cases?",
        "✨ Provide a standard boilerplate code"
      ];
    }
    if (path.includes('questions') || path.includes('top-100') || path.includes('sheet')) {
      return [
        "⚡ Give me an intuitive hint without code",
        "🔍 How can I optimize from O(N²) to O(N)?",
        "🧪 Help me dry-run with an example",
        "🐛 Common pitfalls in this problem"
      ];
    }
    if (path.includes('news')) {
      return [
        "🚀 Explain the system architecture in this tech",
        "🤖 How will new AI models impact software dev?",
        "⚡ What are the key engineering takeaways?"
      ];
    }
    return [
      "💡 Give me a hint on Two Pointers",
      "⏱️ Master Big-O Space vs Time complexity",
      "🧠 How to approach Dynamic Programming",
      "🚀 Best template for Binary Search"
    ];
  }, [location.pathname]);

  // Clear Chat
  const handleClearChat = () => {
    if (window.confirm("Reset conversation with Neural Copilot?")) {
      setMessages(initialMessages);
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    }
  };

  // Save Custom Key
  const handleSaveCustomKey = (e) => {
    e.preventDefault();
    const clean = customApiKey.trim();
    if (clean) {
      localStorage.setItem(CUSTOM_KEY_STORAGE, clean);
    } else {
      localStorage.removeItem(CUSTOM_KEY_STORAGE);
    }
    setIsKeyModalOpen(false);
  };

  // Send Message
  const handleSendMessage = async (textToSend) => {
    const query = typeof textToSend === 'string' ? textToSend : inputText;
    if (!query || !query.trim() || isTyping) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const apiKey = getActiveKey();
    if (!apiKey) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: "⚠️ **NO GEMINI API KEY DETECTED**\n\nPlease click the **Settings (Key)** icon in the header to enter your Gemini API Key, or add `VITE_GEMINI_API_KEY` to your project's `.env` file to activate neural reasoning.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsTyping(false);
      }, 600);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const activeModeObj = AI_MODES.find(m => m.id === selectedMode) || AI_MODES[0];

      // Contextual System Instruction
      const systemInstruction = `You are NEURAL COPILOT, a futuristic AI mentor specialized in Data Structures, Algorithms, Competitive Programming, and Software Engineering.
Mode: ${activeModeObj.label} (${activeModeObj.promptPrefix}).
Current Page Context: User is browsing "${location.pathname}".
Keep answers direct, technically sound, and well-structured using markdown. Format all code blocks with appropriate syntax highlighting (\`\`\`javascript, \`\`\`python, \`\`\`cpp, etc.). When in 'Quick Hint' mode, provide guiding clues without revealing full code solutions.`;

      // Fallback model cascade
      let model;
      try {
        model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction
        });
      } catch {
        model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      }

      // Build context history
      const history = messages.filter(m => m.id !== 1).slice(-8).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const chat = model.startChat({ history });
      const augmentedQuery = `${activeModeObj.promptPrefix}\nUser Prompt: ${userMsg.text}`;
      const result = await chat.sendMessage(augmentedQuery);
      const response = await result.response;
      const responseText = response.text();

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      if (!isOpen) setHasUnread(true);
    } catch (err) {
      console.error("Gemini Copilot Error:", err);
      let errorDesc = "Encountered a neural transmission error. Please check your internet connection or API key.";
      const errStr = String(err).toLowerCase();

      if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("rate limit")) {
        errorDesc = "⚠️ **QUOTA LIMIT EXCEEDED (429)**\n\nYour Gemini API free-tier quota has reached its momentary limit. Please wait 60 seconds or configure an alternative key in the top right.";
      } else if (errStr.includes("key") || errStr.includes("invalid") || errStr.includes("403")) {
        errorDesc = "🔑 **INVALID API KEY**\n\nThe configured Gemini API key is unauthorized. Click the Key icon at the top of the HUD to paste a valid key from Google AI Studio.";
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: errorDesc,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const currentModeInfo = AI_MODES.find(m => m.id === selectedMode) || AI_MODES[0];

  return (
    <div className="futuristic-floating-ai-root">
      {/* Floating Trigger: The Quantum Neural Orb */}
      <motion.div
        className={`neural-orb-trigger ${isOpen ? 'orb-hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="Launch Neural Copilot (Ctrl + /)"
      >
        {/* Holographic orbital energy rings */}
        <div className="orb-orbital-ring ring-1" />
        <div className="orb-orbital-ring ring-2" />
        <div className="orb-ambient-glow" />

        <div className="orb-core">
          <div className="orb-inner-icon">
            <Sparkles size={24} className="sparkle-svg" />
          </div>

          {/* Equalizer Waveforms */}
          <div className="orb-audio-waves">
            <span className="wave-bar bar-1" />
            <span className="wave-bar bar-2" />
            <span className="wave-bar bar-3" />
            <span className="wave-bar bar-4" />
          </div>
        </div>

        {/* Status Pill Badge */}
        <div className="orb-status-pill">
          <span className="status-beacon" />
          <span className="orb-status-text">AI ONLINE</span>
        </div>

        {/* Unread Alert Dot */}
        {hasUnread && <span className="orb-unread-badge" />}
      </motion.div>

      {/* Floating Futuristic HUD Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className={`cyber-ai-hud ${isExpanded ? 'hud-expanded' : 'hud-compact'}`}
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
          >
            {/* Cyber Corner HUD Brackets */}
            <div className="hud-corner corner-tl" />
            <div className="hud-corner corner-tr" />
            <div className="hud-corner corner-bl" />
            <div className="hud-corner corner-br" />

            {/* Window Header */}
            <header className="cyber-hud-header">
              <div className="hud-title-zone">
                <div className="hud-avatar-box">
                  <div className="hud-avatar-glow" />
                  <Cpu size={20} className="hud-avatar-icon" />
                </div>
                <div>
                  <div className="hud-brand-row">
                    <h2 className="hud-title">NEURAL COPILOT</h2>
                    <span className="hud-version-badge">v3.5</span>
                    <span className="hud-online-dot" />
                  </div>
                  <div className="hud-telemetry">
                    <span className="telemetry-label">QUANTUM REASONING CORE</span>
                    <span className="telemetry-sep">//</span>
                    <span className="telemetry-sub">{currentModeInfo.label.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="hud-controls-zone">
                <button
                  onClick={() => setIsKeyModalOpen(true)}
                  className={`hud-ctrl-btn ${getActiveKey() ? 'active-key' : 'missing-key'}`}
                  title="Configure Gemini API Key"
                >
                  <Key size={14} />
                </button>

                <button
                  onClick={handleClearChat}
                  className="hud-ctrl-btn"
                  title="Reset Conversation"
                >
                  <RotateCcw size={14} />
                </button>

                <button
                  onClick={() => setIsExpanded(prev => !prev)}
                  className="hud-ctrl-btn"
                  title={isExpanded ? "Dock Compact" : "Expand Widescreen HUD"}
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="hud-ctrl-btn close-btn"
                  title="Minimize (Ctrl + /)"
                >
                  <X size={15} />
                </button>
              </div>
            </header>

            {/* Futuristic Mode Selector Bar */}
            <nav className="cyber-mode-track">
              {AI_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`cyber-mode-chip ${isSelected ? 'active' : ''}`}
                    style={{ '--chip-color': mode.color }}
                  >
                    <Icon size={12} className="mode-chip-icon" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Messages Stream */}
            <div className="cyber-messages-stream">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`cyber-message-row ${message.sender}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="message-sender-avatar">
                      {message.sender === 'ai' ? (
                        <Bot size={14} className="avatar-ai-icon" />
                      ) : (
                        <User size={14} className="avatar-user-icon" />
                      )}
                    </div>

                    <div className="cyber-bubble-container">
                      <div className="cyber-bubble">
                        {message.sender === 'ai' ? (
                          <div className="ai-markdown-wrap">
                            {parseCyberMarkdown(message.text)}
                          </div>
                        ) : (
                          <p className="user-text">{message.text}</p>
                        )}
                      </div>
                      <span className="cyber-timestamp">{message.timestamp}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing / Generating Visualizer */}
              {isTyping && (
                <motion.div
                  className="cyber-message-row ai is-generating"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="message-sender-avatar">
                    <Bot size={14} className="avatar-ai-icon" />
                  </div>
                  <div className="cyber-bubble-container">
                    <div className="cyber-bubble thinking-bubble">
                      <div className="neural-thinking-indicator">
                        <span className="neural-dot dot-1" />
                        <span className="neural-dot dot-2" />
                        <span className="neural-dot dot-3" />
                        <span className="neural-text">SYNTHESIZING ALGORITHM</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Context Chips */}
            <div className="cyber-quick-chips">
              <span className="chips-title">QUICK PROMPTS:</span>
              <div className="chips-scroll">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isTyping}
                    className="quick-chip-btn"
                  >
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Futuristic Input Dock */}
            <footer className="cyber-hud-input-dock">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="hud-input-form"
              >
                <div className="input-glow-wrapper">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`[${currentModeInfo.label}] Ask about algorithms, complexity, edge cases...`}
                    className="cyber-hud-input"
                    disabled={isTyping}
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isTyping}
                    className={`cyber-send-btn ${inputText.trim() ? 'can-send' : ''}`}
                    title="Transmit Prompt"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>

              <div className="hud-footer-meta">
                <span className="shortcut-hint">Shortcuts: <code>Ctrl + /</code> toggle • <code>Esc</code> minimize</span>
                <span className="engine-meta">POWERED BY GEMINI PRO</span>
              </div>
            </footer>

            {/* API Key Modal Overlay */}
            {isKeyModalOpen && (
              <div className="hud-modal-overlay" onClick={() => setIsKeyModalOpen(false)}>
                <div className="hud-modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="hud-modal-header">
                    <div className="modal-title-wrap">
                      <Key size={16} className="text-teal" />
                      <h4>Gemini AI Key Configuration</h4>
                    </div>
                    <button onClick={() => setIsKeyModalOpen(false)} className="modal-close">
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCustomKey} className="modal-body-form">
                    <p className="modal-desc">
                      Configure your Google Gemini API Key to power the Neural Copilot. Get a free key at{' '}
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                        Google AI Studio <ExternalLink size={12} />
                      </a>.
                    </p>

                    <input
                      type="text"
                      placeholder="Paste Gemini API Key (e.g. AIzaSy...)"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      className="hud-key-input"
                    />

                    <div className="modal-btn-row">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomApiKey('');
                          localStorage.removeItem(CUSTOM_KEY_STORAGE);
                          setIsKeyModalOpen(false);
                        }}
                        className="modal-clear"
                      >
                        Reset to .env
                      </button>
                      <button type="submit" className="modal-save">
                        Save Key
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

