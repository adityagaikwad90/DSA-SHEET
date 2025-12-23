import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './ClubChat.css';
import { Send, MessageSquare, Users, ArrowLeft, Hash, X, MessageCircle, Mail } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, getDocs, setDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const CLUBS = [
    { id: 'genius', name: 'Genius Club', description: 'For the rigorous minds pushing limits.', icon: <Users size={24} />, color: '#8b5cf6' },
    { id: 'dsa', name: 'DSA Warriors', description: 'Master Data Structures & Algorithms.', icon: <Hash size={24} />, color: '#ec4899' },
    { id: 'general', name: 'General Chill', description: 'Hangout, relax, and networking.', icon: <MessageSquare size={24} />, color: '#10b981' },
];

function ClubChat() {
    const { currentUser: user } = useAuth();
    const [currentClub, setCurrentClub] = useState(null);
    const [message, setMessage] = useState('');
    const [messageList, setMessageList] = useState([]);

    // Direct Messaging State
    const [viewMode, setViewMode] = useState('clubs'); // 'clubs', 'chat', 'dm', 'inbox', 'users'
    const [selectedUser, setSelectedUser] = useState(null); // For profile modal
    const [activeDmUser, setActiveDmUser] = useState(null); // The user we are currently DMing
    const [dmMessageList, setDmMessageList] = useState([]);
    const [myChats, setMyChats] = useState([]); // List of active DMs
    const [allUsers, setAllUsers] = useState([]); // List of all registered users
    const [isLoadingUsers, setIsLoadingUsers] = useState(false); // Loading state for users
    const [searchTerm, setSearchTerm] = useState("");

    const messagesEndRef = useRef(null);

    // --- 0. All Users Listener (for Directory) ---
    useEffect(() => {
        if (viewMode === 'users') {
            setIsLoadingUsers(true);
            const usersRef = collection(db, "users");
            const q = query(usersRef, orderBy("displayName", "asc"));

            // Limit for performance optimization in real app, but for now grab all
            getDocs(q).then((snapshot) => {
                const users = snapshot.docs.map(doc => ({
                    uid: doc.id,
                    ...doc.data()
                })).filter(u => u.uid !== user?.uid); // Exclude self
                setAllUsers(users);
                setIsLoadingUsers(false);
            }).catch(err => {
                console.error("Failed to fetch users:", err);
                setIsLoadingUsers(false);
            });
        }
    }, [viewMode, user]);

    // --- 1. My Chats Inbox Listener ---
    useEffect(() => {
        if (user) {
            const chatsRef = collection(db, "user_chats", user.uid, "chats");
            const q = query(chatsRef, orderBy("lastMessageTime", "desc"));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const chats = snapshot.docs.map(doc => ({
                    uid: doc.id, // The other user's UID
                    ...doc.data()
                }));
                setMyChats(chats);
            });

            return () => unsubscribe();
        }
    }, [user]);

    // --- 2. Club Chat Listener ---
    useEffect(() => {
        if (currentClub && viewMode === 'chat') {
            const messagesRef = collection(db, "clubs", currentClub.id, "messages");
            const q = query(messagesRef, orderBy("createdAt", "asc"));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMessageList(messages);
            });

            return () => unsubscribe();
        }
    }, [currentClub, viewMode]);

    // --- 3. DM Chat Listener ---
    useEffect(() => {
        if (activeDmUser && viewMode === 'dm' && user) {
            // Create a unique chat ID based on both UIDs sorted alphabetically
            const chatId = [user.uid, activeDmUser.uid].sort().join("_");
            const messagesRef = collection(db, "direct_messages", chatId, "messages");
            const q = query(messagesRef, orderBy("createdAt", "asc"));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setDmMessageList(messages);
            });

            return () => unsubscribe();
        }
    }, [activeDmUser, viewMode, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messageList, dmMessageList, viewMode]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = async () => {
        if (message.trim() === "" || !user) return;

        try {
            if (viewMode === 'chat' && currentClub) {
                await addDoc(collection(db, "clubs", currentClub.id, "messages"), {
                    author: user.email || "Anonymous",
                    displayName: user.displayName || user.email.split('@')[0],
                    uid: user.uid, // Important for DMs
                    message: message,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: serverTimestamp()
                });
            } else if (viewMode === 'dm' && activeDmUser) {
                const chatId = [user.uid, activeDmUser.uid].sort().join("_");
                const timestamp = serverTimestamp();
                const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // 1. Add Message
                await addDoc(collection(db, "direct_messages", chatId, "messages"), {
                    author: user.email || "Anonymous",
                    displayName: user.displayName || user.email.split('@')[0],
                    uid: user.uid,
                    message: message,
                    time: timeString,
                    createdAt: timestamp
                });

                // 2. Update Sender's Chat List
                await setDoc(doc(db, "user_chats", user.uid, "chats", activeDmUser.uid), {
                    displayName: activeDmUser.displayName || activeDmUser.author || "User",
                    lastMessage: message,
                    lastMessageTime: timestamp,
                    timeString: timeString,
                    uid: activeDmUser.uid
                }, { merge: true });

                // 3. Update Receiver's Chat List
                await setDoc(doc(db, "user_chats", activeDmUser.uid, "chats", user.uid), {
                    displayName: user.displayName || user.email.split('@')[0],
                    lastMessage: message,
                    lastMessageTime: timestamp,
                    timeString: timeString,
                    uid: user.uid
                }, { merge: true });
            }
            setMessage("");
            scrollToBottom();
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    };

    const handleUserClick = (msgUser) => {
        if (msgUser.uid !== user.uid) {
            // Ensure we have a consistent object structure for the user
            setSelectedUser({
                uid: msgUser.uid,
                displayName: msgUser.displayName || msgUser.author || "User",
                author: msgUser.author || "User"
            });
        }
    };

    const startDirectMessage = () => {
        if (selectedUser) {
            setActiveDmUser(selectedUser);
            setSelectedUser(null);
            setViewMode('dm');
            setDmMessageList([]); // Clear previous DMs while loading
        }
    };

    const openChatFromInbox = (chatUser) => {
        setActiveDmUser(chatUser);
        setViewMode('dm');
        setDmMessageList([]);
    };

    const filteredUsers = allUsers.filter(u =>
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Animation constants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="club-chat-container">
            <AnimatePresence mode="wait">
                {/* 1. CLUB SELECTION VIEW */}
                {viewMode === 'clubs' && (
                    <motion.div
                        className="club-selection"
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -20 }}
                        variants={containerVariants}
                        key="selection"
                    >
                        <motion.div className="clubs-header" variants={itemVariants}>
                            <h1 className="gradient-text">Social Hub</h1>
                            <div className="hub-tabs">
                                <button className="hub-tab active">Clubs</button>
                                <button className="hub-tab" onClick={() => setViewMode('inbox')}>
                                    My Chats
                                    {myChats.length > 0 && <span className="badge-count">{myChats.length}</span>}
                                </button>
                                <button className="hub-tab" onClick={() => setViewMode('users')}>People</button>
                            </div>
                        </motion.div>

                        <div className="club-list">
                            {CLUBS.map((club) => (
                                <motion.div
                                    key={club.id}
                                    className="club-card"
                                    onClick={() => {
                                        setCurrentClub(club);
                                        setViewMode('chat');
                                    }}
                                    variants={itemVariants}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{ '--club-color': club.color }}
                                >
                                    <div className="club-icon-wrapper" style={{ background: `${club.color}20`, color: club.color }}>
                                        {club.icon}
                                    </div>
                                    <div className="club-info">
                                        <h3>{club.name}</h3>
                                        <p>{club.description}</p>
                                    </div>
                                    <div className="join-badge">Join</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 1.5 INBOX VIEW (My Chats) */}
                {viewMode === 'inbox' && (
                    <motion.div
                        className="club-selection"
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -20 }}
                        variants={containerVariants}
                        key="inbox"
                    >
                        <motion.div className="clubs-header" variants={itemVariants}>
                            <h1 className="gradient-text">My Chats</h1>
                            <div className="hub-tabs">
                                <button className="hub-tab" onClick={() => setViewMode('clubs')}>Clubs</button>
                                <button className="hub-tab active">
                                    My Chats
                                    {myChats.length > 0 && <span className="badge-count">{myChats.length}</span>}
                                </button>
                                <button className="hub-tab" onClick={() => setViewMode('users')}>People</button>
                            </div>
                        </motion.div>

                        <div className="inbox-list">
                            {myChats.length === 0 ? (
                                <div className="empty-inbox">
                                    <MessageSquare size={48} opacity={0.2} />
                                    <p>No active chats yet. Join a club to meet people!</p>
                                </div>
                            ) : (
                                myChats.map((chat) => (
                                    <motion.div
                                        key={chat.uid}
                                        className="inbox-item"
                                        onClick={() => openChatFromInbox(chat)}
                                        variants={itemVariants}
                                        whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                                    >
                                        <div className="inbox-avatar">
                                            {(chat.displayName || "User").substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="inbox-content">
                                            <div className="inbox-top">
                                                <h3>{chat.displayName || "User"}</h3>
                                                <span className="inbox-time">{chat.timeString}</span>
                                            </div>
                                            <p className="inbox-msg">{chat.lastMessage}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {/* 1.6 USERS DIRECTORY VIEW */}
                {viewMode === 'users' && (
                    <motion.div
                        className="club-selection"
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -20 }}
                        variants={containerVariants}
                        key="users"
                    >
                        <motion.div className="clubs-header" variants={itemVariants}>
                            <h1 className="gradient-text">People</h1>
                            <div className="hub-tabs">
                                <button className="hub-tab" onClick={() => setViewMode('clubs')}>Clubs</button>
                                <button className="hub-tab" onClick={() => setViewMode('inbox')}>
                                    My Chats
                                    {myChats.length > 0 && <span className="badge-count">{myChats.length}</span>}
                                </button>
                                <button className="hub-tab active">People</button>
                            </div>
                        </motion.div>

                        <div style={{ maxWidth: '600px', margin: '0 auto 1.5rem' }}>
                            <div className="input-wrapper" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="inbox-list">
                            {filteredUsers.length === 0 ? (
                                <div className="empty-inbox">
                                    <Users size={48} opacity={0.2} />
                                    <p>{isLoadingUsers ? "Loading users..." : "No users found."}</p>
                                </div>
                            ) : (
                                filteredUsers.map((u) => (
                                    <motion.div
                                        key={u.uid}
                                        className="inbox-item"
                                        onClick={() => handleUserClick(u)}
                                        variants={itemVariants}
                                        whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                                    >
                                        <div className="inbox-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}>
                                            {(u.displayName || "User").substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="inbox-content">
                                            <div className="inbox-top">
                                                <h3>{u.displayName || "User"}</h3>
                                            </div>
                                            <p className="inbox-msg">Developer</p>
                                        </div>
                                        <MessageCircle size={20} color='white' opacity={0.5} />
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {/* 2. CHAT VIEW (Club or DM) */}
                {(viewMode === 'chat' || viewMode === 'dm') && (
                    <motion.div
                        className="chat-workspace"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        key="chat"
                    >
                        <div className="chat-window-premium">
                            {/* Header */}
                            <div className="chat-header-premium">
                                <div className="header-left">
                                    <button className="back-btn" onClick={() => {
                                        // Return to where we came from
                                        if (viewMode === 'dm') {
                                            setActiveDmUser(null);
                                            setViewMode('inbox');
                                        } else {
                                            setCurrentClub(null);
                                            setViewMode('clubs');
                                        }
                                    }}>
                                        <ArrowLeft size={20} />
                                    </button>

                                    {viewMode === 'chat' && currentClub && (
                                        <>
                                            <div className="club-avatar-small" style={{ background: currentClub.color }}>
                                                {currentClub.icon}
                                            </div>
                                            <div className="header-info">
                                                <h3>{currentClub.name}</h3>
                                                <span className="live-status">● Live</span>
                                            </div>
                                        </>
                                    )}

                                    {viewMode === 'dm' && activeDmUser && (
                                        <>
                                            <div className="msg-avatar" style={{ width: 40, height: 40, border: 'none' }}>
                                                {(activeDmUser.displayName || activeDmUser.author || "User").substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="header-info">
                                                <h3>{activeDmUser.displayName || activeDmUser.author || "User"}</h3>
                                                <span className="live-status">Private Chat</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="header-right">
                                    {/* Online count removed */}
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="chat-body-premium">
                                <div className="messages-wrapper">
                                    {(viewMode === 'chat' ? messageList : dmMessageList).map((msgContent) => {
                                        const isMe = msgContent.uid === user.uid || msgContent.author === user.email;
                                        const initials = (msgContent.displayName || msgContent.author || "AN").substring(0, 2).toUpperCase();

                                        return (
                                            <motion.div
                                                key={msgContent.id || Math.random()}
                                                className={`message-row ${isMe ? "you" : "other"}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                {!isMe && (
                                                    <div
                                                        className="msg-avatar"
                                                        onClick={() => handleUserClick(msgContent)}
                                                        style={{ cursor: 'pointer' }}
                                                        title="View Profile"
                                                    >
                                                        {initials}
                                                    </div>
                                                )}
                                                <div className="message-content-wrapper">
                                                    {!isMe && <span className="msg-author">{msgContent.displayName || msgContent.author}</span>}
                                                    <div className="message-bubble">
                                                        <p>{msgContent.message}</p>
                                                        <span className="msg-time">{msgContent.time}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="chat-footer-premium">
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        value={message}
                                        placeholder={viewMode === 'chat' ? `Message #${currentClub?.name}...` : `Message ${activeDmUser?.displayName || "User"}...`}
                                        onChange={(event) => setMessage(event.target.value)}
                                        onKeyPress={(event) => event.key === 'Enter' && sendMessage()}
                                    />
                                    <button
                                        className="send-btn"
                                        onClick={sendMessage}
                                        disabled={message.trim() === ""}
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* User Profile Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedUser(null)}
                    >
                        <motion.div
                            className="profile-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="close-modal-btn" onClick={() => setSelectedUser(null)}>
                                <X size={20} />
                            </button>

                            <div className="profile-header">
                                <div className="profile-avatar-large">
                                    {(selectedUser.displayName || selectedUser.author || "User").substring(0, 2).toUpperCase()}
                                </div>
                                <h2>{selectedUser.displayName || selectedUser.author}</h2>
                                <span className="profile-role">Developer</span>
                            </div>

                            <div className="profile-actions">
                                <button className="action-btn primary" onClick={startDirectMessage}>
                                    <MessageCircle size={18} />
                                    Message
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ClubChat;
