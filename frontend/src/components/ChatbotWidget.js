import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Icons as SVG components for better control and styling
const SendIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="white" />
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const API_URL = 'http://localhost:3001/api/ai/chat'; // Ensure this port matches your chatbot-backend

const SUGGESTED_QUESTIONS = [
    'How do I start a new campaign?',
    'What documents are required for KYC verification?',
    'How can I donate to a campaign?',
    'How do I reset my password?',
    'Can I edit my campaign after publishing?',
    'How do I withdraw funds from my campaign?',
    'What are the platform fees?',
    'How do I contact support?',
    'How do I update my profile information?',
    'What happens after my campaign ends?',
    'How do I find campaigns to donate to?',
    'Is my donation tax-deductible?',
    'Can I donate anonymously?',
    'How do I get a donation receipt?',
    'What payment methods are accepted?',
    'How do I promote my campaign?',
    'Can I upload images and videos to my campaign?',
    'How do I track donations to my campaign?',
    'What happens if I don’t reach my funding goal?',
    'How do I enable voting for my campaign?',
    'How does the platform ensure campaign authenticity?',
    'What should I do if I suspect a fraudulent campaign?',
    'How is my personal information protected?',
    'What is the voting feature?',
    'How do notifications work?',
    'Can I follow or bookmark campaigns?',
    'How do I report a campaign?'
];

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: 'bot', text: 'Hi! I am your AI assistant for CrowdFund. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [currentSuggestions, setCurrentSuggestions] = useState([]);
    const messagesEndRef = useRef(null);

    const getRandomSuggestions = () => {
        const shuffled = [...SUGGESTED_QUESTIONS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 5);
    };

    useEffect(() => {
        if (isOpen) {
            setCurrentSuggestions(getRandomSuggestions());
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        if (messages.length > 1 && messages[messages.length - 1].from === 'bot') {
            setShowSuggestions(true);
            setCurrentSuggestions(getRandomSuggestions());
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e, customInput) => {
        if (e) e.preventDefault();
        const messageToSend = typeof customInput === 'string' ? customInput : input;
        if (!messageToSend.trim()) return;

        setShowSuggestions(false);
        const userMessage = { from: 'user', text: messageToSend };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const token = localStorage.getItem('token'); // Get token from local storage

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ message: messageToSend })
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            const botMessage = { from: 'bot', text: data.response || 'Sorry, I encountered an issue.' };
            setMessages((prev) => [...prev, botMessage]);
        } catch (err) {
            console.error("Chatbot API error:", err);
            const errorMessage = { from: 'bot', text: 'Oops! I am having trouble connecting. Please try again later.' };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (question) => {
        handleSendMessage(null, question);
    };

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="fixed bottom-6 right-6 z-[999] bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full shadow-2xl w-16 h-16 flex items-center justify-center text-3xl focus:outline-none focus:ring-4 focus:ring-blue-300 transform hover:scale-110 transition-transform duration-200 animate-pulse-slow"
                aria-label="Toggle chat"
            >
                💬
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-28 right-6 z-[998] w-[32rem] max-w-[calc(100vw-2rem)] h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 pointer-events-none'}`}
            >
                <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-5 py-4 rounded-t-2xl flex justify-between items-center shadow-md">
                    <h3 className="text-lg font-bold">CrowdFund Assistant</h3>
                    <button onClick={() => setIsOpen(false)} className="hover:opacity-75 transition-opacity">
                        <CloseIcon />
                    </button>
                </header>

                {/* Suggested Questions */}
                {showSuggestions && (
                    <div className="px-5 pt-3 pb-2 bg-white border-b border-gray-200 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {currentSuggestions.map((q, idx) => (
                            <button
                                key={idx}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-200 transition whitespace-nowrap"
                                onClick={() => handleSuggestionClick(q)}
                                disabled={isLoading}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex items-end gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.from === 'bot' && <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg shrink-0">🤖</div>}
                            <div className={`px-4 py-2 rounded-2xl text-base max-w-xs break-words prose ${msg.from === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                {msg.from === 'bot' ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-2 justify-start">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg shrink-0">🤖</div>
                            <div className="px-4 py-2 rounded-2xl bg-gray-200 text-gray-500 rounded-bl-none flex items-center space-x-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-fast [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-fast [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-fast"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="border-t border-gray-200 p-3 bg-white rounded-b-2xl">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            className="flex-1 px-4 py-2 text-base bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={isLoading}
                            autoFocus={isOpen}
                        />
                        <button
                            type="submit"
                            className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-300 transition-colors duration-200 shrink-0"
                            disabled={isLoading || !input.trim()}
                            aria-label="Send message"
                        >
                            <SendIcon />
                        </button>
                    </form>
                </footer>
            </div>
        </>
    );
};

export default ChatbotWidget; 