import React, { useState, useRef, useEffect } from 'react';
import './AiChat.css';
import { Send } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            // Note: Gemini implementation might differ for full chat sessions, 
            // but for simple Q&A we can pass the prompt.
            // Ideally we should use startChat() for multi-turn conversations.

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
            console.log("API Key present:", !!import.meta.env.VITE_GEMINI_API_KEY);
            const errorResponse = {
                id: Date.now() + 1,
                text: "Sorry, I encountered an error connecting to the AI service. Please check your API key and internet connection.",
                sender: 'ai',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="ai-chat-container">
            <div className="chat-header">
                <h1>Ask AI</h1>
                <p>Get instant help with your coding questions</p>
            </div>

            <div className="messages-area">
                {messages.map((message) => (
                    <div key={message.id} className={`message ${message.sender}`}>
                        <div className="message-content">
                            {message.text}
                        </div>
                        <span className="timestamp">{message.timestamp}</span>
                    </div>
                ))}
                {isTyping && (
                    <div className="typing-indicator">
                        AI is typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="input-area" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Ask a question..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isTyping}
                />
                <button type="submit" className="send-btn" disabled={!inputText.trim() || isTyping}>
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default AiChat;
