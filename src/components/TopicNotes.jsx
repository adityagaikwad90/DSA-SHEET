import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Upload, FileText, Trash2, BookOpen, Minimize2, Download, ShieldCheck } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { uploadFile, deleteFile } from '../aws-config';
import './TopicNotes.css';

const TopicNotes = ({ topic, onClose }) => {
    const { currentUser, isAdmin } = useAuth();
    const [notes, setNotes] = useState('');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);
    const [isReading, setIsReading] = useState(false);

    useEffect(() => {
        const fetchNotes = async () => {
            if (!topic) {
                setLoading(false);
                return;
            }

            try {
                // Fetch shared topic notes curated by admin
                const docRef = doc(db, 'topic_notes', topic);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setNotes(data.content || '');
                    setPdfUrl(data.pdfUrl || null);
                } else {
                    setNotes('');
                    setPdfUrl(null);
                }
            } catch (error) {
                console.error("Error fetching notes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, [topic]);

    const handleFileChange = (e) => {
        if (!isAdmin) return;
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        if (!isAdmin) return;
        setSaving(true);

        try {
            let currentPdfUrl = pdfUrl;

            // Upload PDF to AWS S3 if selected
            if (selectedFile) {
                const path = `topic-notes/admin/${topic}/${selectedFile.name}`;
                currentPdfUrl = await uploadFile(selectedFile, path);
            }

            await setDoc(doc(db, 'topic_notes', topic), {
                topic,
                content: notes,
                pdfUrl: currentPdfUrl,
                updatedBy: currentUser?.email || 'admin',
                lastUpdated: new Date()
            }, { merge: true });

            setSelectedFile(null);
            onClose();
        } catch (error) {
            console.error("Error saving notes:", error);
            let errorMessage = error?.message || "Unknown error occurred";
            if (errorMessage === "Unknown error occurred" && typeof error === 'object') {
                errorMessage = JSON.stringify(error);
            }
            alert(`Failed to save notes: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePdf = async () => {
        if (!isAdmin || !pdfUrl) return;

        if (!window.confirm("Are you sure you want to delete this PDF? This cannot be undone.")) {
            return;
        }

        setSaving(true);
        try {
            // Delete from AWS S3
            const urlObj = new URL(pdfUrl);
            let s3Key = decodeURIComponent(urlObj.pathname.substring(1));
            await deleteFile(s3Key);

            // Update Firestore
            await setDoc(doc(db, 'topic_notes', topic), {
                topic,
                content: notes,
                pdfUrl: null,
                updatedBy: currentUser?.email || 'admin',
                lastUpdated: new Date()
            }, { merge: true });

            setPdfUrl(null);
            setIsReading(false);
        } catch (error) {
            console.error("Error deleting PDF:", error);
            alert("Failed to delete PDF. Check console.");
        } finally {
            setSaving(false);
        }
    };

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
                        <div className="modal-header-title">
                            <h2>{topic} Notes</h2>
                            {isAdmin ? (
                                <span className="admin-badge">
                                    <ShieldCheck size={14} /> Admin Mode
                                </span>
                            ) : (
                                <span className="student-badge">
                                    Curated Notes
                                </span>
                            )}
                        </div>
                        <button className="close-btn" onClick={onClose} aria-label="Close">
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
                                    {isAdmin ? (
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder={`Write key takeaways, formulas, or patterns for ${topic}...`}
                                            autoFocus
                                            className={isReading ? 'notes-compact' : ''}
                                        />
                                    ) : (
                                        <div className={`notes-readonly ${isReading ? 'notes-compact' : ''}`}>
                                            {notes.trim() ? (
                                                <div className="notes-text">{notes}</div>
                                            ) : (
                                                <div className="notes-empty">
                                                    <FileText size={36} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                                                    <p>No written notes published for this topic yet.</p>
                                                    <p className="notes-empty-sub">Check back soon or explore attached PDF resources below.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

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

                                {/* PDF Section */}
                                {(isAdmin || pdfUrl || selectedFile) && (
                                    <div className="pdf-section">
                                        <div className="pdf-header">
                                            <span>Attached PDF Revision Note</span>
                                            {isAdmin && (
                                                <label className="upload-btn">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={handleFileChange}
                                                        hidden
                                                    />
                                                    <Upload size={14} />
                                                    {selectedFile ? 'Change PDF' : (pdfUrl ? 'Replace PDF' : 'Upload PDF')}
                                                </label>
                                            )}
                                        </div>

                                        {(selectedFile || pdfUrl) && (
                                            <div className="pdf-preview">
                                                <FileText size={18} className="pdf-icon" />
                                                <span className="pdf-name">
                                                    {selectedFile ? selectedFile.name : `${topic} Reference Note.pdf`}
                                                </span>

                                                {pdfUrl && !selectedFile && (
                                                    <div className="pdf-actions">
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
                                                        <a
                                                            href={pdfUrl}
                                                            download={`${topic}-notes.pdf`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="download-pdf-btn"
                                                        >
                                                            <Download size={14} />
                                                            Download
                                                        </a>
                                                        {isAdmin && (
                                                            <button
                                                                className="read-pdf-btn delete-btn"
                                                                onClick={handleDeletePdf}
                                                                title="Delete PDF"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {selectedFile && isAdmin && (
                                                    <button
                                                        className="remove-pdf"
                                                        onClick={() => setSelectedFile(null)}
                                                        title="Cancel selection"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isAdmin && !pdfUrl && !notes.trim() && (
                                    <div className="empty-vault-notice">
                                        <p>Revision notes and PDFs for <strong>{topic}</strong> are being prepared by the instructor.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button className="btn-cancel" onClick={onClose}>
                            {isAdmin ? 'Cancel' : 'Close'}
                        </button>
                        {isAdmin && (
                            <button
                                className="btn-save"
                                onClick={handleSave}
                                disabled={saving || loading}
                            >
                                {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />}
                                {saving ? 'Saving...' : 'Save Notes'}
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TopicNotes;
