import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import './ClubChat.css';
import { Send, MessageSquare, Users, ArrowLeft, Hash, X, MessageCircle, Search, Plus, Reply, Pencil, Trash2, Flag, Copy, BarChart3, UserRound } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, setDoc, doc, updateDoc, getDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const CLUBS = [
    { id: 'genius', name: 'Genius Club', description: 'For the rigorous minds pushing limits.', icon: <Users size={24} />, color: '#8b5cf6' },
    { id: 'dsa', name: 'DSA Warriors', description: 'Master Data Structures & Algorithms.', icon: <Hash size={24} />, color: '#ec4899' },
    { id: 'general', name: 'General Chill', description: 'Hangout, relax, and networking.', icon: <MessageSquare size={24} />, color: '#10b981' },
];

const CODE_TOKEN_PATTERN = /(\/\/[^\n]*|#[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:const|let|var|function|return|if|else|for|while|class|new|import|from|export|async|await|def|None|True|False|public|private|static|void|int|string|boolean|class|this)\b|\b\d+(?:\.\d+)?\b)/g;

function highlightCode(source) {
    return source.split(CODE_TOKEN_PATTERN).filter(Boolean).map((part, index) => {
        let className = '';
        if (/^(\/\/|#)/.test(part)) className = 'code-token-comment';
        else if (/^["']/.test(part)) className = 'code-token-string';
        else if (/^\d/.test(part)) className = 'code-token-number';
        else if (/^(const|let|var|function|return|if|else|for|while|class|new|import|from|export|async|await|def|None|True|False|public|private|static|void|int|string|boolean|this)$/.test(part)) className = 'code-token-keyword';
        return <span className={className} key={`${index}-${part}`}>{part}</span>;
    });
}

function MessageBody({ value }) {
    const [copied, setCopied] = useState(false);
    const content = String(value || '');
    const blocks = [];
    const fence = /```([\w+#.-]*)\n?([\s\S]*?)```/g;
    let cursor = 0;
    let match;
    while ((match = fence.exec(content))) {
        if (match.index > cursor) blocks.push({ type: 'text', text: content.slice(cursor, match.index), key: `text-${cursor}` });
        blocks.push({ type: 'code', language: match[1], text: match[2].replace(/\n$/, ''), key: `code-${match.index}` });
        cursor = fence.lastIndex;
    }
    if (cursor < content.length || blocks.length === 0) blocks.push({ type: 'text', text: content.slice(cursor), key: `text-${cursor}` });

    return <div className="message-body-content">{blocks.map((block) => block.type === 'code' ? (
        <div className="message-code-block" key={block.key}>
            <div className="message-code-heading"><span>{block.language || 'code'}</span><button type="button" onClick={async () => {
                try { await navigator.clipboard.writeText(block.text); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }
                catch { toast.error('Clipboard access is unavailable.'); }
            }}><Copy size={13} /> {copied ? 'Copied' : 'Copy'}</button></div>
            <pre><code>{highlightCode(block.text)}</code></pre>
        </div>
    ) : <p key={block.key}>{block.text.split(/(`[^`]+`)/g).map((part, index) => part.startsWith('`') && part.endsWith('`')
        ? <code className="message-inline-code" key={index}>{part.slice(1, -1)}</code>
        : <React.Fragment key={index}>{part}</React.Fragment>)}</p>)}</div>;
}

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
    const [messageSearch, setMessageSearch] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [showPollForm, setShowPollForm] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [polls, setPolls] = useState([]);
    const [profileFormOpen, setProfileFormOpen] = useState(false);
    const [profile, setProfile] = useState({ interests: '', skills: '', lookingFor: '', discoverable: true });
    const [clubActivity, setClubActivity] = useState({});

    const messagesEndRef = useRef(null);

    // --- 0. All Users Listener (for Directory) ---
    useEffect(() => {
        if (viewMode === 'users') {
            setIsLoadingUsers(true);
            const usersRef = collection(db, 'member_profiles');
            const q = query(usersRef, orderBy("displayName", "asc"));

            // Limit for performance optimization in real app, but for now grab all
            getDocs(q).then((snapshot) => {
                const users = snapshot.docs.map(doc => ({
                    uid: doc.id,
                    ...doc.data()
                })).filter(u => u.uid !== user?.uid); // Public, opt-in directory records only
                setAllUsers(users);
                setIsLoadingUsers(false);
            }).catch(err => {
                console.error("Failed to fetch users:", err);
                setIsLoadingUsers(false);
            });
        }
    }, [viewMode, user]);

    useEffect(() => {
        if (!user) return;
        getDoc(doc(db, 'users', user.uid)).then(async (snapshot) => {
            const data = snapshot.exists() ? snapshot.data() : {};
            const nextProfile = {
                interests: data.interests || '', skills: data.skills || '',
                lookingFor: data.lookingFor || '', discoverable: data.discoverable !== false,
            };
            setProfile(nextProfile);
            const publicProfileRef = doc(db, 'member_profiles', user.uid);
            const publicProfile = await getDoc(publicProfileRef);
            if (nextProfile.discoverable && !publicProfile.exists()) {
                await setDoc(publicProfileRef, {
                    uid: user.uid,
                    displayName: data.displayName || user.displayName || user.email?.split('@')[0] || 'Member',
                    photoURL: data.photoURL || user.photoURL || null,
                    interests: nextProfile.interests,
                    skills: nextProfile.skills,
                    lookingFor: nextProfile.lookingFor,
                    updatedAt: serverTimestamp(),
                });
            }
        }).catch((error) => console.error('Failed to load member introduction', error));
    }, [user]);

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

    useEffect(() => {
        if (viewMode !== 'clubs') return undefined;
        const unsubscribers = CLUBS.map((club) => onSnapshot(doc(db, 'clubs', club.id), (snapshot) => {
            setClubActivity((previous) => ({ ...previous, [club.id]: snapshot.exists() ? snapshot.data() : {} }));
        }, (error) => console.error(`Failed to load ${club.name} activity`, error)));
        return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    }, [viewMode]);

    useEffect(() => {
        if (!currentClub || viewMode !== 'chat') { setPolls([]); return; }
        const pollsRef = collection(db, 'clubs', currentClub.id, 'polls');
        const q = query(pollsRef, orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => setPolls(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))));
    }, [currentClub, viewMode]);

    useEffect(() => {
        if (!currentClub || viewMode !== 'chat' || !user) return;
        try { localStorage.setItem(`dsa_club_read_${user.uid}_${currentClub.id}`, String(Date.now())); }
        catch { /* ignore unavailable storage */ }
    }, [currentClub, messageList, viewMode, user]);

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

    const visibleMessages = useMemo(() => {
        const messages = viewMode === 'chat' ? messageList : dmMessageList;
        const term = messageSearch.trim().toLowerCase();
        if (!term) return messages;
        return messages.filter((item) => `${item.message || ''} ${item.displayName || ''}`.toLowerCase().includes(term));
    }, [viewMode, messageList, dmMessageList, messageSearch]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const getMessageRef = (messageId) => {
        if (viewMode === 'chat' && currentClub) return doc(db, 'clubs', currentClub.id, 'messages', messageId);
        if (viewMode === 'dm' && activeDmUser && user) {
            const chatId = [user.uid, activeDmUser.uid].sort().join('_');
            return doc(db, 'direct_messages', chatId, 'messages', messageId);
        }
        return null;
    };

    const sendMessage = async () => {
        if (message.trim() === "" || !user) return;

        try {
            const cleanMessage = message.trim();
            if (editingMessage) {
                await updateDoc(getMessageRef(editingMessage.id), { message: cleanMessage, editedAt: serverTimestamp() });
                setEditingMessage(null);
                setMessage('');
                toast.success('Message updated.');
                return;
            }
            if (viewMode === 'chat' && currentClub) {
                await addDoc(collection(db, "clubs", currentClub.id, "messages"), {
                    author: user.email || "Anonymous",
                    displayName: user.displayName || user.email.split('@')[0],
                    uid: user.uid, // Important for DMs
                    message: cleanMessage,
                    replyTo: replyTo ? { id: replyTo.id, displayName: replyTo.displayName, message: replyTo.message?.slice(0, 160) } : null,
                    reactions: {},
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: serverTimestamp()
                });
                await setDoc(doc(db, 'clubs', currentClub.id), { lastMessageTime: serverTimestamp(), lastMessagePreview: cleanMessage.slice(0, 120) }, { merge: true });
            } else if (viewMode === 'dm' && activeDmUser) {
                const chatId = [user.uid, activeDmUser.uid].sort().join("_");
                const timestamp = serverTimestamp();
                const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // 1. Add Message
                await addDoc(collection(db, "direct_messages", chatId, "messages"), {
                    author: user.email || "Anonymous",
                    displayName: user.displayName || user.email.split('@')[0],
                    uid: user.uid,
                    message: cleanMessage,
                    replyTo: replyTo ? { id: replyTo.id, displayName: replyTo.displayName, message: replyTo.message?.slice(0, 160) } : null,
                    reactions: {},
                    time: timeString,
                    createdAt: timestamp
                });

                // 2. Update Sender's Chat List
                await setDoc(doc(db, "user_chats", user.uid, "chats", activeDmUser.uid), {
                    displayName: activeDmUser.displayName || activeDmUser.author || "User",
                    lastMessage: cleanMessage,
                    lastMessageTime: timestamp,
                    timeString: timeString,
                    lastMessageSenderUid: user.uid,
                    lastReadAt: timestamp,
                    uid: activeDmUser.uid
                }, { merge: true });

                // 3. Update Receiver's Chat List
                await setDoc(doc(db, "user_chats", activeDmUser.uid, "chats", user.uid), {
                    displayName: user.displayName || user.email.split('@')[0],
                    lastMessage: cleanMessage,
                    lastMessageTime: timestamp,
                    timeString: timeString,
                    lastMessageSenderUid: user.uid,
                    uid: user.uid
                }, { merge: true });
            }
            setMessage("");
            setReplyTo(null);
            scrollToBottom();
        } catch (error) {
            console.error("Error sending message: ", error);
            toast.error('Could not send your message.');
        }
    };

    const saveIntroduction = async () => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                displayName: user.displayName || user.email?.split('@')[0] || 'Member',
                email: user.email || '',
                ...profile,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            const publicProfileRef = doc(db, 'member_profiles', user.uid);
            if (profile.discoverable) {
                await setDoc(publicProfileRef, {
                    uid: user.uid,
                    displayName: user.displayName || user.email?.split('@')[0] || 'Member',
                    photoURL: user.photoURL || null,
                    interests: profile.interests,
                    skills: profile.skills,
                    lookingFor: profile.lookingFor,
                    updatedAt: serverTimestamp(),
                }, { merge: true });
            } else {
                await deleteDoc(publicProfileRef);
            }
            toast.success('Member introduction saved.');
            setProfileFormOpen(false);
        } catch (error) {
            console.error('Failed to save member introduction', error);
            toast.error('Could not save your introduction.');
        }
    };

    const createPoll = async (event) => {
        event.preventDefault();
        const options = pollOptions.map((item) => item.trim()).filter(Boolean);
        if (!user || !currentClub || !pollQuestion.trim() || options.length < 2) return;
        try {
            await addDoc(collection(db, 'clubs', currentClub.id, 'polls'), {
                question: pollQuestion.trim(), options, votes: {},
                createdBy: user.uid, createdByName: user.displayName || user.email?.split('@')[0] || 'Member',
                createdAt: serverTimestamp(),
            });
            setPollQuestion(''); setPollOptions(['', '']); setShowPollForm(false);
            toast.success('Poll posted.');
        } catch (error) {
            console.error('Failed to create poll', error);
            toast.error('Could not create poll.');
        }
    };

    const castPollVote = async (poll, optionIndex) => {
        if (!user || !currentClub) return;
        const pollRef = doc(db, 'clubs', currentClub.id, 'polls', poll.id);
        try {
            await runTransaction(db, async (transaction) => {
                const snapshot = await transaction.get(pollRef);
                if (!snapshot.exists()) return;
                const votes = snapshot.data().votes || {};
                votes[user.uid] = optionIndex;
                transaction.update(pollRef, { votes });
            });
        } catch (error) {
            console.error('Failed to vote', error);
            toast.error('Could not save your vote.');
        }
    };

    const toggleReaction = async (item, emoji) => {
        const messageRef = getMessageRef(item.id);
        if (!messageRef || !user) return;
        try {
            await runTransaction(db, async (transaction) => {
                const snapshot = await transaction.get(messageRef);
                if (!snapshot.exists()) return;
                const reactions = snapshot.data().reactions || {};
                const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
                reactions[emoji] = users.includes(user.uid) ? users.filter((uid) => uid !== user.uid) : [...users, user.uid];
                if (!reactions[emoji].length) delete reactions[emoji];
                transaction.update(messageRef, { reactions });
            });
        } catch (error) {
            console.error('Failed to update reaction', error);
            toast.error('Could not update reaction.');
        }
    };

    const removeMessage = async (item) => {
        if (item.uid !== user?.uid || !window.confirm('Delete this message?')) return;
        try {
            await deleteDoc(getMessageRef(item.id));
            toast.success('Message deleted.');
        } catch (error) {
            console.error('Failed to delete message', error);
            toast.error('Could not delete this message.');
        }
    };

    const reportMessage = async (item) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'message_reports'), {
                messageId: item.id,
                conversationId: viewMode === 'chat' ? `club_${currentClub.id}` : [user.uid, activeDmUser.uid].sort().join('_'),
                conversationType: viewMode === 'chat' ? 'club' : 'dm',
                reportedBy: user.uid, reportedUid: item.uid || null,
                messagePreview: String(item.message || '').slice(0, 240),
                createdAt: serverTimestamp(), status: 'open',
            });
            toast.success('Message reported for review.');
        } catch (error) {
            console.error('Failed to report message', error);
            toast.error('Could not submit report.');
        }
    };

    const markDmRead = async (chatUser) => {
        if (!user || !chatUser?.uid) return;
        const chatRef = doc(db, 'user_chats', user.uid, 'chats', chatUser.uid);
        try {
            const snapshot = await getDoc(chatRef);
            if (snapshot.exists()) await updateDoc(chatRef, { lastReadAt: serverTimestamp() });
        }
        catch (error) { console.error('Failed to mark chat read', error); }
    };

    const hasUnreadClubMessages = (clubId) => {
        try {
            const lastSeen = Number(localStorage.getItem(`dsa_club_read_${user.uid}_${clubId}`) || 0);
            return Number(clubActivity[clubId]?.lastMessageTime?.toMillis?.() || 0) > lastSeen;
        } catch { return false; }
    };

    const handleUserClick = (msgUser) => {
        if (msgUser.uid && msgUser.uid !== user?.uid) {
            // Ensure we have a consistent object structure for the user
            setSelectedUser({
                uid: msgUser.uid,
                displayName: msgUser.displayName || msgUser.author || "User",
                author: msgUser.author || "User",
                interests: msgUser.interests || '', skills: msgUser.skills || '', lookingFor: msgUser.lookingFor || '',
            });
            getDoc(doc(db, 'member_profiles', msgUser.uid)).then((snapshot) => {
                if (snapshot.exists()) setSelectedUser((previous) => previous?.uid === msgUser.uid ? { ...previous, ...snapshot.data() } : previous);
            }).catch((error) => console.error('Failed to load member profile', error));
        }
    };

    const startDirectMessage = () => {
        if (selectedUser) {
            markDmRead(selectedUser);
            setActiveDmUser(selectedUser);
            setSelectedUser(null);
            setViewMode('dm');
            setDmMessageList([]); // Clear previous DMs while loading
        }
    };

    const openChatFromInbox = (chatUser) => {
        markDmRead(chatUser);
        setActiveDmUser(chatUser);
        setViewMode('dm');
        setDmMessageList([]);
    };

    const filteredUsers = allUsers.filter(u =>
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.interests?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.skills?.toLowerCase().includes(searchTerm.toLowerCase())
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
                                        try { localStorage.setItem(`dsa_club_read_${user.uid}_${club.id}`, String(Date.now())); } catch { /* ignore unavailable storage */ }
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
                                    <div className="join-badge">{hasUnreadClubMessages(club.id) ? <><i className="unread-dot" /> New messages</> : 'Open club'}</div>
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
                                                <span className="inbox-time">{chat.timeString}{chat.lastMessageSenderUid !== user?.uid && chat.lastMessageTime?.toMillis?.() > (chat.lastReadAt?.toMillis?.() || 0) && <i className="unread-dot" aria-label="Unread messages" />}</span>
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
                                    placeholder="Search members, interests, or skills..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="member-introduction-card">
                            <div className="member-intro-avatar"><UserRound size={20} /></div>
                            <div className="member-intro-copy">
                                <strong>Your member introduction</strong>
                                <span>{profile.interests || profile.skills || profile.lookingFor ? [profile.interests, profile.skills, profile.lookingFor].filter(Boolean).join(' · ') : 'Add interests, skills, and what you want to practice.'}</span>
                            </div>
                            <button type="button" className="subtle-action" onClick={() => setProfileFormOpen((open) => !open)}>{profileFormOpen ? 'Close' : 'Edit'}</button>
                        </div>
                        {profileFormOpen && (
                            <form className="member-intro-form" onSubmit={(event) => { event.preventDefault(); saveIntroduction(); }}>
                                <label>Interests<input maxLength={120} value={profile.interests} onChange={(event) => setProfile({ ...profile, interests: event.target.value })} placeholder="e.g. DSA, backend, internships" /></label>
                                <label>Skills<input maxLength={120} value={profile.skills} onChange={(event) => setProfile({ ...profile, skills: event.target.value })} placeholder="e.g. Java, React, SQL" /></label>
                                <label>Looking to practice<input maxLength={120} value={profile.lookingFor} onChange={(event) => setProfile({ ...profile, lookingFor: event.target.value })} placeholder="e.g. Graph problems with a study partner" /></label>
                                <label className="discoverable-toggle"><input type="checkbox" checked={profile.discoverable} onChange={(event) => setProfile({ ...profile, discoverable: event.target.checked })} /> Show my profile in People</label>
                                <button type="submit" className="subtle-action primary-action">Save introduction</button>
                            </form>
                        )}

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
                                            <p className="inbox-msg">{[u.interests, u.skills].filter(Boolean).join(' · ') || 'Member introduction not added'}</p>
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

                            <div className="chat-tools-row">
                                <label className="chat-search"><Search size={15} /><input aria-label="Search messages" value={messageSearch} onChange={(event) => setMessageSearch(event.target.value)} placeholder="Search this conversation" /></label>
                                {viewMode === 'chat' && <button type="button" className="subtle-action poll-toggle" onClick={() => setShowPollForm((open) => !open)}><BarChart3 size={15} /> {showPollForm ? 'Close poll' : 'Create poll'}</button>}
                            </div>

                            {/* Chat Messages */}
                            <div className="chat-body-premium">
                                {viewMode === 'chat' && showPollForm && (
                                    <form className="poll-create-form" onSubmit={createPoll}>
                                        <strong>Ask the club</strong>
                                        <input aria-label="Poll question" maxLength={180} value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} placeholder="What should the club work on next?" required />
                                        {pollOptions.map((option, index) => <input key={index} aria-label={`Poll option ${index + 1}`} maxLength={100} value={option} onChange={(event) => setPollOptions((previous) => previous.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Option ${index + 1}`} required={index < 2} />)}
                                        <div className="poll-form-actions">
                                            {pollOptions.length < 5 && <button type="button" className="subtle-action" onClick={() => setPollOptions((previous) => [...previous, ''])}><Plus size={14} /> Add option</button>}
                                            <button type="submit" className="subtle-action primary-action">Post poll</button>
                                        </div>
                                    </form>
                                )}
                                {viewMode === 'chat' && polls.length > 0 && <div className="polls-panel">
                                    {polls.map((poll) => {
                                        const votes = poll.votes || {};
                                        const totalVotes = Object.keys(votes).length;
                                        const myVote = votes[user?.uid];
                                        return <article className="poll-card" key={poll.id}>
                                            <div className="poll-card-heading"><strong>{poll.question}</strong><span>{totalVotes} vote{totalVotes === 1 ? '' : 's'}</span></div>
                                            <div className="poll-options">{poll.options?.map((option, index) => {
                                                const count = Object.values(votes).filter((vote) => vote === index).length;
                                                const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                                                return <button type="button" key={`${poll.id}-${index}`} className={`poll-option ${myVote === index ? 'selected' : ''}`} onClick={() => castPollVote(poll, index)}>
                                                    <span className="poll-option-progress" style={{ width: `${percent}%` }} />
                                                    <span className="poll-option-label">{option}</span><span className="poll-option-count">{count} · {percent}%</span>
                                                </button>;
                                            })}</div>
                                            <small>Posted by {poll.createdByName || 'Member'}</small>
                                        </article>;
                                    })}
                                </div>}
                                <div className="messages-wrapper">
                                    {visibleMessages.map((msgContent) => {
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
                                                    {msgContent.replyTo && <div className="reply-context"><strong>{msgContent.replyTo.displayName || 'Member'}</strong><span>{msgContent.replyTo.message}</span></div>}
                                                    <div className="message-bubble">
                                                        <MessageBody value={msgContent.message} />
                                                        <span className="msg-time">{msgContent.time}</span>
                                                    </div>
                                                    <div className="message-actions">
                                                        <button type="button" title="Reply" onClick={() => { setReplyTo(msgContent); setEditingMessage(null); }}><Reply size={13} /> Reply</button>
                                                        {['👍', '❤️', '💡'].map((emoji) => <button type="button" key={emoji} className={msgContent.reactions?.[emoji]?.includes(user.uid) ? 'reacted' : ''} title={`React ${emoji}`} onClick={() => toggleReaction(msgContent, emoji)}>{emoji}<span>{msgContent.reactions?.[emoji]?.length || ''}</span></button>)}
                                                        {isMe ? <>
                                                            <button type="button" title="Edit message" onClick={() => { setEditingMessage(msgContent); setReplyTo(null); setMessage(msgContent.message); }}><Pencil size={13} /> Edit</button>
                                                            <button type="button" title="Delete message" onClick={() => removeMessage(msgContent)}><Trash2 size={13} /> Delete</button>
                                                        </> : <button type="button" title="Report message" onClick={() => reportMessage(msgContent)}><Flag size={13} /> Report</button>}
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
                                {(replyTo || editingMessage) && <div className="reply-composer-banner"><span>{editingMessage ? 'Editing your message' : `Replying to ${replyTo.displayName || replyTo.author || 'member'}: ${replyTo.message?.slice(0, 100)}`}</span><button type="button" onClick={() => { setReplyTo(null); setEditingMessage(null); setMessage(''); }} aria-label="Cancel reply or edit"><X size={15} /></button></div>}
                                <div className="input-wrapper">
                                    <textarea
                                        value={message}
                                        rows={1}
                                        placeholder={viewMode === 'chat' ? `Message #${currentClub?.name}... Use triple backticks for code` : `Message ${activeDmUser?.displayName || "User"}... Use triple backticks for code`}
                                        onChange={(event) => setMessage(event.target.value)}
                                        onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }}
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
                                <span className="profile-role">DSA Sheet member</span>
                                {(selectedUser.interests || selectedUser.skills || selectedUser.lookingFor) && <div className="profile-introduction-details">
                                    {selectedUser.interests && <p><strong>Interests</strong>{selectedUser.interests}</p>}
                                    {selectedUser.skills && <p><strong>Skills</strong>{selectedUser.skills}</p>}
                                    {selectedUser.lookingFor && <p><strong>Practicing</strong>{selectedUser.lookingFor}</p>}
                                </div>}
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
