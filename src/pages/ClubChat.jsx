import React, { useState, useEffect } from 'react';
// import io from 'socket.io-client'; // Socket.io no longer used for messages
import { useAuth } from '../context/AuthContext';
import './ClubChat.css';
import { Send, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

// const socket = io.connect("http://localhost:3001"); // Accessing via direct Firestore now

const CLUBS = [
    { id: 'genius', name: 'Genius Club', description: 'For the rigorous minds.' },
    { id: 'dsa', name: 'DSA Warriors', description: 'Master Data Structures & Algorithms.' },
    { id: 'general', name: 'General Chill', description: 'Hangout and relax.' },
];

function ClubChat() {
    const { currentUser: user } = useAuth();
    const [currentClub, setCurrentClub] = useState(null);
    const [message, setMessage] = useState('');
    const [messageList, setMessageList] = useState([]);

    useEffect(() => {
        if (currentClub) {
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
    }, [currentClub]);

    const joinClub = (club) => {
        setCurrentClub(club);
        // setMessageList([]); // Handled by snapshot listener now
    };

    const sendMessage = async () => {
        if (message !== "" && currentClub && user) {
            try {
                await addDoc(collection(db, "clubs", currentClub.id, "messages"), {
                    author: user.email || "Anonymous",
                    message: message,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: serverTimestamp()
                });
                setMessage("");
            } catch (error) {
                console.error("Error sending message: ", error);
                alert("Failed to send: " + error.message);
            }
        } else {
            if (!user) {
                alert("You must be logged in to send messages.");
                console.error("User is not defined in ClubChat");
            }
        }
    };

    return (
        <div className="club-chat-container">
            {!currentClub ? (
                <div className="club-selection">
                    <h2>Select a Club</h2>
                    <div className="club-list">
                        {CLUBS.map((club) => (
                            <div key={club.id} className="club-card" onClick={() => joinClub(club)}>
                                <h3>{club.name}</h3>
                                <p>{club.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="chat-window">
                    <div className="chat-header">
                        <h3>{currentClub.name}</h3>
                        <button className="leave-btn" onClick={() => setCurrentClub(null)}>Leave</button>
                    </div>
                    <div className="chat-body">
                        {messageList.map((msgContent) => {
                            const isMe = msgContent.author === (user?.email || "Anonymous");
                            return (
                                <div key={msgContent.id || Math.random()} className={`message-container ${isMe ? "you" : "other"}`}>
                                    <div className="message-content">
                                        <p>{msgContent.message}</p>
                                        <span className="message-meta">{msgContent.time} - {msgContent.author}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="chat-footer">
                        <input
                            type="text"
                            value={message}
                            placeholder="Type a message..."
                            onChange={(event) => setMessage(event.target.value)}
                            onKeyPress={(event) => event.key === 'Enter' && sendMessage()}
                        />
                        <button onClick={sendMessage}><Send size={20} /></button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClubChat;
