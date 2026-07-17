import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Copy, Check } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './AiChat.css';

// Copy Button Component for Code Blocks
const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <button className="copy-code-btn" onClick={handleCopy} title="Copy code">
            {copied ? (
                <>
                    <Check size={12} className="copy-icon" />
                    <span>Copied!</span>
                </>
            ) : (
                <>
                    <Copy size={12} className="copy-icon" />
                    <span>Copy</span>
                </>
            )}
        </button>
    );
};

// Custom Markdown Parser Function
const parseMarkdown = (text) => {
    if (!text) return '';

    // Split text by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
        if (part.startsWith('```')) {
            // Code block extraction
            const match = part.match(/```(\w*)\n([\s\S]*?)```/);
            const language = match ? match[1] : '';
            const code = match ? match[2] : part.slice(3, -3);

            return (
                <div key={index} className="markdown-code-block-wrapper">
                    <div className="code-block-header">
                        <span className="code-lang">{language || 'code'}</span>
                        <CopyButton text={code} />
                    </div>
                    <pre className="markdown-code-block">
                        <code>{code.trim()}</code>
                    </pre>
                </div>
            );
        } else {
            // Split line by line to support bullet points and lists
            const lines = part.split('\n');
            return lines.map((line, lineIdx) => {
                const trimmed = line.trim();
                
                // Bullet points (* or -)
                const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
                // Numbered lists (1. etc.)
                const isNumbered = /^\d+\.\s/.test(trimmed);
                
                let cleanLine = trimmed;
                if (isBullet) {
                    cleanLine = trimmed.replace(/^[\*\-]\s+/, '');
                } else if (isNumbered) {
                    cleanLine = trimmed.replace(/^\d+\.\s+/, '');
                }

                // Format inline elements: Bold (**text**) and inline code (`code`)
                const subParts = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);
                const renderedLine = subParts.map((subPart, subIdx) => {
                    if (subPart.startsWith('**') && subPart.endsWith('**')) {
                        return <strong key={subIdx}>{subPart.slice(2, -2)}</strong>;
                    }
                    if (subPart.startsWith('`') && subPart.endsWith('`')) {
                        return <code key={subIdx} className="markdown-inline-code">{subPart.slice(1, -1)}</code>;
                    }
                    return subPart;
                });

                if (isBullet) {
                    return (
                        <li key={lineIdx} className="markdown-list-item">
                            {renderedLine}
                        </li>
                    );
                }

                if (isNumbered) {
                    // Extract the number
                    const numMatch = trimmed.match(/^(\d+)\.\s+/);
                    const number = numMatch ? numMatch[1] : '1';
                    return (
                        <li key={lineIdx} className="markdown-list-item numbered" style={{ listStyleType: 'none' }}>
                            <span className="list-number">{number}.</span> {renderedLine}
                        </li>
                    );
                }

                if (trimmed === '') {
                    return <div key={lineIdx} className="markdown-space" />;
                }

                return (
                    <p key={lineIdx} className="markdown-paragraph">
                        {renderedLine}
                    </p>
                );
            });
        }
    });
};

const AiChat = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! I'm your AI assistant powered by Gemini. How can I help you with your DSA questions today?",
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newUserMessage = {
            id: Date.now(),
            text: inputText,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputText('');
        setIsTyping(true);

        try {
            // Create chat history for context
            const chat = model.startChat({
                history: messages.filter(m => m.id !== 1).map(m => ({
                    role: m.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: m.text }],
                })),
            });

            const result = await chat.sendMessage(newUserMessage.text);
            const response = await result.response;
            const text = response.text();

            const aiResponse = {
                id: Date.now() + 1,
                text: text,
                sender: 'ai',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error("Error calling Gemini:", error);
            
            let errorMessage = "Sorry, I encountered an error connecting to the AI service. Please check your API key and internet connection.";
            const errorStr = error.toString().toLowerCase();
            
            if (errorStr.includes("quota") || errorStr.includes("429") || errorStr.includes("rate limit") || errorStr.includes("limit exceeded")) {
                errorMessage = "⚠️ Quota Exceeded (429): Your Gemini API Key has exceeded its free-tier rate limit or daily quota. Please generate a new key on Google AI Studio or wait for the quota to reset.";
            } else if (errorStr.includes("api key") || errorStr.includes("key not found") || errorStr.includes("invalid key")) {
                errorMessage = "🔑 Invalid API Key: The Gemini API Key configured in your .env file is invalid. Please double check your key in Google AI Studio.";
            }

            const errorResponse = {
                id: Date.now() + 1,
                text: errorMessage,
                sender: 'ai',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="ai-chat-wrapper">
            <div className="ai-chat-container">
                <div className="chat-header">
                    <div className="header-icon-wrapper">
                        <Sparkles size={24} className="glow-icon" />
                    </div>
                    <div>
                        <h1>Ask AI Assistant</h1>
                        <p>Get instant explanations, dry-runs, or optimization tips for DSA</p>
                    </div>
                </div>

                <div className="messages-area">
                    <AnimatePresence initial={false}>
                        {messages.map((message) => (
                            <motion.div 
                                key={message.id} 
                                className={`message-wrapper ${message.sender}`}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="message-avatar">
                                    {message.sender === 'ai' ? (
                                        <Bot size={16} className="avatar-icon ai" />
                                    ) : (
                                        <User size={16} className="avatar-icon user" />
                                    )}
                                </div>
                                <div className="message-bubble-container">
                                    <div className="message-content">
                                        {message.sender === 'ai' ? parseMarkdown(message.text) : message.text}
                                    </div>
                                    <span className="timestamp">{message.timestamp}</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {isTyping && (
                        <motion.div 
                            className="message-wrapper ai typing"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="message-avatar">
                                <Bot size={16} className="avatar-icon ai" />
                            </div>
                            <div className="message-bubble-container">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="input-area" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Ask a question about algorithms, space complexity, etc..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={isTyping}
                    />
                    <button type="submit" className="send-btn" disabled={!inputText.trim() || isTyping}>
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AiChat;
