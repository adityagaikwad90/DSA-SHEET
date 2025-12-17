import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Upload, FileText, Trash2, BookOpen, Minimize2, Lock } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { uploadFile, deleteFile } from '../aws-config';
import './TopicNotes.css';

const TopicNotes = ({ topic, onClose }) => {
    const { currentUser } = useAuth();
    const [notes, setNotes] = useState('');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);
    const [isReading, setIsReading] = useState(false);

    useEffect(() => {
        const fetchNotes = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            if (!topic) return;

            try {
                const docRef = doc(db, 'topic_notes', `${currentUser.uid}_${topic}`);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setNotes(data.content || '');
                    setPdfUrl(data.pdfUrl || null);
                }
            } catch (error) {
                console.error("Error fetching notes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, [currentUser, topic]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        if (!currentUser) return;
        setSaving(true);

        try {
            let currentPdfUrl = pdfUrl;

            // Upload PDF if selected
            if (selectedFile) {
                const path = `topic-notes/${currentUser.uid}/${topic}/${selectedFile.name}`;
                currentPdfUrl = await uploadFile(selectedFile, path);
            }

            await setDoc(doc(db, 'topic_notes', `${currentUser.uid}_${topic}`), {
                userId: currentUser.uid,
                topic,
                content: notes,
                pdfUrl: currentPdfUrl,
                lastUpdated: new Date()
            }, { merge: true });

            onClose();
        } catch (error) {
            console.error("Error saving notes:", error);
            // Show more specific error to user
            const errorMessage = error.message || "Unknown error occurred";
            alert(`Failed to save notes: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePdf = async () => {
        if (!currentUser || !pdfUrl) return;

        if (!window.confirm("Are you sure you want to delete this PDF? This cannot be undone.")) {
            return;
        }

        setSaving(true);
        try {
            // 1. Delete from S3
            // Extract path from URL: .../topic-notes/...
            // URL format: https://bucket.s3.region.amazonaws.com/topic-notes/uid/topic/filename
            const urlObj = new URL(pdfUrl);
            // The pathname starts with a slash, e.g., /topic-notes/...
            // We need to remove the leading slash for the Key
            let s3Key = urlObj.pathname.substring(1);
            // Decode URI component to handle spaces/special chars in filename
            s3Key = decodeURIComponent(s3Key);

            await deleteFile(s3Key);

            // 2. Update Firestore
            await setDoc(doc(db, 'topic_notes', `${currentUser.uid}_${topic}`), {
                userId: currentUser.uid,
                topic,
                content: notes,
                pdfUrl: null, // Remove the link
                lastUpdated: new Date()
            }, { merge: true });

            setPdfUrl(null);
            setIsReading(false); // Close reader if open

        } catch (error) {
            console.error("Error deleting PDF:", error);
            alert("Failed to delete PDF. Check console.");
        } finally {
            setSaving(false);
        }
    };

    // Auth Check Render
    if (!currentUser) {
        return (
            <AnimatePresence>
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="modal-content auth-required"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        style={{ height: 'auto', minHeight: '300px' }}
                    >
                        <div className="modal-header">
                            <h2>Login Required</h2>
                            <button className="close-btn" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body items-center justify-center text-center">
                            <Lock size={48} className="text-secondary mb-md" style={{ opacity: 0.5 }} />
                            <h3 className="text-xl font-bold text-primary mb-2">Unlock Topic Notes</h3>
                            <p className="text-secondary mb-6">
                                You need to be logged in to save notes and upload PDFs for <strong>{topic}</strong>.
                            </p>
                            <div className="flex gap-4">
                                <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                                <a href="/login" className="btn btn-primary">Log In Now</a>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className={`modal-content ${isReading ? 'modal-expanded' : ''}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h2>{topic} Notes</h2>
                        <button className="close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="modal-body">
                        {loading ? (
                            <div className="loading-state">
                                <Loader2 className="spinner" size={32} />
                            </div>
                        ) : (
                            <>
                                <div className={`modal-body-content ${isReading ? 'split-view' : ''}`}>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={`Write your key takeaways, formulas, or patterns for ${topic}...`}
                                        autoFocus
                                        className={isReading ? 'notes-compact' : ''}
                                    />

                                    {isReading && pdfUrl && (
                                        <div className="pdf-viewer-container">
                                            <iframe
                                                src={pdfUrl}
                                                title="PDF Viewer"
                                                className="pdf-iframe"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="pdf-section">
                                    <div className="pdf-header">
                                        <span>PDF Attachment</span>
                                        <label className="upload-btn">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                hidden
                                            />
                                            <Upload size={14} />
                                            {selectedFile ? 'Change PDF' : 'Upload PDF'}
                                        </label>
                                    </div>

                                    {(selectedFile || pdfUrl) && (
                                        <div className="pdf-preview">
                                            <FileText size={16} className="pdf-icon" />
                                            <span className="pdf-name">
                                                {selectedFile ? selectedFile.name : 'Attached PDF Note'}
                                            </span>
                                            {pdfUrl && !selectedFile && (
                                                <>
                                                    <a
                                                        href={pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="view-pdf-link"
                                                    >
                                                        View
                                                    </a>
                                                    <button
                                                        className="read-pdf-btn"
                                                        onClick={() => setIsReading(!isReading)}
                                                    >
                                                        {isReading ? <Minimize2 size={14} /> : <BookOpen size={14} />}
                                                        {isReading ? 'Close Reader' : 'Read Now'}
                                                    </button>
                                                    <button
                                                        className="read-pdf-btn delete-btn"
                                                        onClick={handleDeletePdf}
                                                        title="Delete PDF"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                            {selectedFile && (
                                                <button
                                                    className="remove-pdf"
                                                    onClick={() => setSelectedFile(null)}
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button
                            className="btn-save"
                            onClick={handleSave}
                            disabled={saving || loading}
                        >
                            {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Notes'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
};

export default TopicNotes;
