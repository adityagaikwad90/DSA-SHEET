import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Table, Youtube, ExternalLink } from 'lucide-react';
import { DSA_TOPICS } from '../constants';
import TopicNotes from '../components/TopicNotes';
import './Home.css';

const SHEETS = [
    { name: "Striver's SDE Sheet", author: "Raj Vikramaditya", url: "https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/" },
    { name: "Love Babbar 450", author: "Love Babbar", url: "https://450dsa.com/" },
    { name: "Blind 75", author: "Team Blind", url: "https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions" },
    { name: "Aditya's Sheet", author: "Aditya", url: "https://docs.google.com/spreadsheets/d/1V2XAWzVwPJ8BRu2rKUwUHbVIcHXDl99qg4-br96GDUI/edit?gid=784559562#gid=784559562" }
];

const VIDEOS = [
    { title: "Complete DSA Playlist", channel: "takeUforward", url: "https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz" },
    { title: "Dynamic Programming", channel: "Aditya Verma", url: "https://www.youtube.com/playlist?list=PL_z_8CaSLPWekqhdCPmFohncHwz8TY2Go" },
    { title: "NeetCode 150", channel: "NeetCode", url: "https://www.youtube.com/playlist?list=PLot-Xpze53lfxD6l5pIdqSYue8hBYY94d" },
    { title: "Graph Series", channel: "Striver", url: "https://www.youtube.com/playlist?list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7f9b" }
];

const DsaVault = () => {
    const [selectedTopic, setSelectedTopic] = useState(null);

    return (
        <div className="home-container" style={{ paddingTop: '80px', minHeight: '100vh' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="section"
                style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 className="section-title" style={{ fontSize: '3rem', marginBottom: '1rem' }}>DSA Vault</h1>
                    <p className="section-subtitle">Manage your revision notes and resources</p>
                </div>

                <div className="section-header" style={{ marginBottom: '2rem' }}>
                    <h2 className="section-title" style={{ fontSize: '2rem' }}>Topic Notes</h2>
                    <p className="section-subtitle">Select a topic to manage your notes</p>
                </div>

                <div className="topics-grid" style={{ marginBottom: '4rem' }}>
                    {DSA_TOPICS.map((topic, index) => (
                        <motion.div
                            key={index}
                            className="topic-card"
                            whileHover={{ y: -5, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedTopic(topic)}
                        >
                            <div className="topic-icon">
                                <FileText size={24} />
                            </div>
                            <h3 className="topic-name">{topic}</h3>
                        </motion.div>
                    ))}
                </div>

                {/* External Resources Section */}
                <div className="resources-section">
                    <div className="section-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <h2 className="section-title" style={{ fontSize: '2rem' }}>Learning Resources</h2>
                        <p className="section-subtitle">Curated sheets and video lectures</p>
                    </div>

                    <div className="resources-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                        {/* Sheets Column */}
                        <div className="resource-column">
                            <h3 className="subsection-title" style={{ color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Table size={24} className="text-purple-400" style={{ color: '#a78bfa' }} /> Important Sheets
                            </h3>
                            <div className="resource-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {SHEETS.map((sheet, idx) => (
                                    <motion.a
                                        key={idx}
                                        href={sheet.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="resource-card"
                                        whileHover={{ x: 10 }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '12px',
                                            textDecoration: 'none',
                                            color: '#e2e8f0',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <div>
                                            <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{sheet.name}</h4>
                                            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{sheet.author}</p>
                                        </div>
                                        <ExternalLink size={18} style={{ opacity: 0.7 }} />
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        {/* Videos Column */}
                        <div className="resource-column">
                            <h3 className="subsection-title" style={{ color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Youtube size={24} className="text-red-400" style={{ color: '#f87171' }} /> Video Lectures
                            </h3>
                            <div className="resource-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {VIDEOS.map((video, idx) => (
                                    <motion.a
                                        key={idx}
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="resource-card"
                                        whileHover={{ x: 10 }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '12px',
                                            textDecoration: 'none',
                                            color: '#e2e8f0',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <div>
                                            <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{video.title}</h4>
                                            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{video.channel}</p>
                                        </div>
                                        <ExternalLink size={18} style={{ opacity: 0.7 }} />
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </motion.div>

            {selectedTopic && (
                <TopicNotes
                    topic={selectedTopic}
                    onClose={() => setSelectedTopic(null)}
                />
            )}
        </div>
    );
};

export default DsaVault;
