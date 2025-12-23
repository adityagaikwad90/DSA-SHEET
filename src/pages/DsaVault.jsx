import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Table, Youtube, ExternalLink } from 'lucide-react';
import { DSA_TOPICS } from '../constants';
import TopicNotes from '../components/TopicNotes';
import './Home.css';
import './DsaVault.css';

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
        <div className="home-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="section dsa-vault-container"
            >
                <div className="vault-header">
                    <h1 className="section-title">DSA Vault</h1>
                    <p className="section-subtitle">Manage your revision notes and resources</p>
                </div>

                <div className="vault-section-header">
                    <h2 className="section-title vault-section-title">Topic Notes</h2>
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
                    <div className="vault-section-header">
                        <h2 className="section-title vault-section-title">Learning Resources</h2>
                        <p className="section-subtitle">Curated sheets and video lectures</p>
                    </div>

                    <div className="vault-resources-grid">

                        {/* Sheets Column */}
                        <div className="resource-column">
                            <h3 className="subsection-title vault-sub-title">
                                <Table size={24} className="text-purple-400" style={{ color: 'var(--color-primary)' }} /> Important Sheets
                            </h3>
                            <div className="vault-resource-list">
                                {SHEETS.map((sheet, idx) => (
                                    <motion.a
                                        key={idx}
                                        href={sheet.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="vault-resource-card"
                                        whileHover={{ x: 5 }}
                                    >
                                        <div className="resource-info">
                                            <h4>{sheet.name}</h4>
                                            <p>{sheet.author}</p>
                                        </div>
                                        <ExternalLink size={18} style={{ opacity: 0.7 }} />
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        {/* Videos Column */}
                        <div className="resource-column">
                            <h3 className="subsection-title vault-sub-title">
                                <Youtube size={24} className="text-red-400" style={{ color: '#ef4444' }} /> Video Lectures
                            </h3>
                            <div className="vault-resource-list">
                                {VIDEOS.map((video, idx) => (
                                    <motion.a
                                        key={idx}
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="vault-resource-card"
                                        whileHover={{ x: 5 }}
                                    >
                                        <div className="resource-info">
                                            <h4>{video.title}</h4>
                                            <p>{video.channel}</p>
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
