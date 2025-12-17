import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { ChevronDown, ChevronUp, Plus, Trash2, ExternalLink } from 'lucide-react';
import { DSA_TOPICS, IMPORTANCE_LEVELS } from '../constants';
import './MySheet.css';

const MySheet = () => {
    const { currentUser } = useAuth();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        question: '',
        selectedTopics: [],
        link: '',
        notes: '',
        importance: 'Medium'
    });

    // Fetch entries from Firestore
    useEffect(() => {
        let isMounted = true;
        const fetchEntries = async () => {
            if (!currentUser) {
                if (isMounted) setLoading(false);
                return;
            }

            // Set a timeout to avoid infinite loading
            const timeoutId = setTimeout(() => {
                if (isMounted && loading) {
                    setLoading(false);
                    alert("Loading is taking longer than expected. Please check if Firestore is enabled in your Firebase Console.");
                }
            }, 5000);

            try {
                const q = query(
                    collection(db, "progress"),
                    where("userId", "==", currentUser.uid)
                );
                const querySnapshot = await getDocs(q);
                const loadedEntries = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                loadedEntries.sort((a, b) => {
                    const dateA = a.timestamp ? a.timestamp.toDate() : new Date(a.date);
                    const dateB = b.timestamp ? b.timestamp.toDate() : new Date(b.date);
                    return dateB - dateA;
                });

                if (isMounted) setEntries(loadedEntries);
            } catch (error) {
                console.error("Error fetching progress:", error);
                if (isMounted) alert("Error loading data: " + error.message);
            } finally {
                clearTimeout(timeoutId);
                if (isMounted) setLoading(false);
            }
        };

        fetchEntries();

        return () => {
            isMounted = false;
        };
    }, [currentUser]);

    const handleTopicChange = (e) => {
        const topic = e.target.value;
        if (topic && !formData.selectedTopics.includes(topic)) {
            setFormData({
                ...formData,
                selectedTopics: [...formData.selectedTopics, topic]
            });
        }
        e.target.value = "";
    };

    const removeTopic = (topicToRemove) => {
        setFormData({
            ...formData,
            selectedTopics: formData.selectedTopics.filter(t => t !== topicToRemove)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.question || formData.selectedTopics.length === 0) {
            alert("Please enter a question name and select at least one topic.");
            return;
        }

        if (!currentUser) {
            alert("You must be logged in to save progress.");
            return;
        }

        const newEntry = {
            userId: currentUser.uid,
            question: formData.question,
            topics: formData.selectedTopics,
            link: formData.link,
            notes: formData.notes,
            importance: formData.importance,
            date: new Date().toLocaleDateString(),
            timestamp: new Date()
        };

        try {
            const docRef = await addDoc(collection(db, "progress"), newEntry);
            setEntries([{ id: docRef.id, ...newEntry }, ...entries]);
            setFormData({
                question: '',
                selectedTopics: [],
                link: '',
                notes: '',
                importance: 'Medium'
            });
            setShowAddForm(false);
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Failed to save entry. Check console for details.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this entry?")) return;

        try {
            await deleteDoc(doc(db, "progress", id));
            setEntries(entries.filter(entry => entry.id !== id));
        } catch (error) {
            console.error("Error deleting document: ", error);
            alert("Failed to delete entry.");
        }
    };

    // Filter and Group Entries
    const filteredEntries = entries.filter(entry => {
        return (entry.question?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (entry.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    });

    // Group by topic. Since an entry can have multiple topics, it will appear under each topic.
    const groupedEntries = DSA_TOPICS.reduce((acc, topic) => {
        const topicEntries = filteredEntries.filter(entry =>
            Array.isArray(entry.topics) ? entry.topics.includes(topic) : entry.topic === topic
        );
        if (topicEntries.length > 0) {
            acc[topic] = topicEntries;
        }
        return acc;
    }, {});

    if (loading) {
        return <div className="mysheet-container"><h2 style={{ color: 'white' }}>Loading your sheet...</h2></div>;
    }

    return (
        <div className="mysheet-container">
            <div className="mysheet-header">
                <h1 className="mysheet-title">My Personal Sheet</h1>
                <p className="mysheet-subtitle">Your customized collection of solved problems for revision</p>
            </div>

            <div className="mysheet-controls">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search your sheet..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    className="btn-add-question"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    <Plus size={18} /> Add New Question
                </button>
            </div>

            {showAddForm && (
                <form className="add-question-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Question Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Two Sum"
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Link</label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Topics</label>
                        <select onChange={handleTopicChange} defaultValue="">
                            <option value="" disabled>Select Topic...</option>
                            {DSA_TOPICS.map(topic => (
                                <option key={topic} value={topic}>{topic}</option>
                            ))}
                        </select>
                        <div className="selected-topics">
                            {formData.selectedTopics.map(topic => (
                                <span key={topic} className="topic-chip">
                                    {topic}
                                    <button type="button" onClick={() => removeTopic(topic)}>×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Notes / Key Takeaway</label>
                            <input
                                type="text"
                                placeholder="What did you learn?"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Importance</label>
                            <select
                                value={formData.importance}
                                onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
                            >
                                {IMPORTANCE_LEVELS.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                        <button type="submit" className="btn-submit">Add to Sheet</button>
                    </div>
                </form>
            )}

            <div className="sheet-content">
                {Object.keys(groupedEntries).length === 0 ? (
                    <div className="empty-state">
                        {searchTerm ? "No matches found." : "Your sheet is empty. Start adding questions!"}
                    </div>
                ) : (
                    Object.entries(groupedEntries).map(([topic, topicEntries]) => (
                        <div key={topic} className="topic-section">
                            <h2 className="topic-title">{topic} <span className="topic-count">{topicEntries.length}</span></h2>
                            <div className="topic-table-container">
                                <table className="topic-table">
                                    <thead>
                                        <tr>
                                            <th>Problem</th>
                                            <th>Notes</th>
                                            <th>Importance</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topicEntries.map(entry => (
                                            <tr key={entry.id}>
                                                <td className="col-problem">
                                                    <div className="problem-name">{entry.question}</div>
                                                    {entry.link && (
                                                        <a href={entry.link} target="_blank" rel="noopener noreferrer" className="problem-link">
                                                            <ExternalLink size={12} /> Solve
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="col-notes">{entry.notes || '-'}</td>
                                                <td className="col-importance">
                                                    <span className={`badge badge-${entry.importance?.toLowerCase() || 'medium'}`}>
                                                        {entry.importance || 'Medium'}
                                                    </span>
                                                </td>
                                                <td className="col-actions">
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleDelete(entry.id)}
                                                        title="Remove from sheet"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MySheet;
