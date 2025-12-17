import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    Code2,
    ExternalLink,
    CheckCircle2,
    Circle,
    BarChart3,
    Layers,
    Zap,
    BrainCircuit
} from 'lucide-react';
import './Questions.css';

const questionsData = [
    {
        topic: "Basic Interview Questions",
        icon: <Layers className="section-icon" />,
        questions: [
            {
                id: 1,
                name: "Reverse an Array",
                difficulty: "Easy",
                leetcode: "https://leetcode.com/problems/reverse-string/",
                gfg: "https://practice.geeksforgeeks.org/problems/reverse-an-array/0"
            },
            {
                id: 2,
                name: "Check for Palindrome",
                difficulty: "Easy",
                leetcode: "https://leetcode.com/problems/valid-palindrome/",
                gfg: "https://practice.geeksforgeeks.org/problems/palindrome-string0817/1"
            },
            {
                id: 3,
                name: "Find Min/Max in Array",
                difficulty: "Easy",
                leetcode: "",
                gfg: "https://practice.geeksforgeeks.org/problems/find-minimum-and-maximum-element-in-an-array4428/1"
            },
            {
                id: 4,
                name: "Factorial of a Number",
                difficulty: "Easy",
                leetcode: "",
                gfg: "https://practice.geeksforgeeks.org/problems/factorial5739/1"
            }
        ]
    },
    {
        topic: "Most Asked",
        icon: <Zap className="section-icon" />,
        questions: [
            {
                id: 101,
                name: "Two Sum",
                difficulty: "Easy",
                leetcode: "https://leetcode.com/problems/two-sum/",
                gfg: "https://practice.geeksforgeeks.org/problems/key-pair5616/1"
            },
            {
                id: 102,
                name: "Valid Parentheses",
                difficulty: "Easy",
                leetcode: "https://leetcode.com/problems/valid-parentheses/",
                gfg: "https://practice.geeksforgeeks.org/problems/parenthesis-checker2744/1"
            },
            {
                id: 103,
                name: "Best Time to Buy and Sell Stock",
                difficulty: "Easy",
                leetcode: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
                gfg: "https://practice.geeksforgeeks.org/problems/stock-buy-and-sell-1587115621/1"
            },
            {
                id: 104,
                name: "Maximum Subarray (Kadane's Algo)",
                difficulty: "Medium",
                leetcode: "https://leetcode.com/problems/maximum-subarray/",
                gfg: "https://practice.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1"
            }
        ]
    },
    {
        topic: "Medium",
        icon: <BarChart3 className="section-icon" />,
        questions: [
            {
                id: 201,
                name: "Rotate Array",
                difficulty: "Medium",
                leetcode: "https://leetcode.com/problems/rotate-array/",
                gfg: "https://practice.geeksforgeeks.org/problems/rotate-array-by-n-elements/0"
            },
            {
                id: 202,
                name: "3Sum",
                difficulty: "Medium",
                leetcode: "https://leetcode.com/problems/3sum/",
                gfg: "https://practice.geeksforgeeks.org/problems/triplet-sum-in-array-1587115621/1"
            },
            {
                id: 203,
                name: "Longest Substring Without Repeating Characters",
                difficulty: "Medium",
                leetcode: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
                gfg: "https://practice.geeksforgeeks.org/problems/longest-distinct-characters-in-string5848/1"
            },
            {
                id: 204,
                name: "Container With Most Water",
                difficulty: "Medium",
                leetcode: "https://leetcode.com/problems/container-with-most-water/",
                gfg: "https://practice.geeksforgeeks.org/problems/container-with-most-water-1587115620/1"
            }
        ]
    },
    {
        topic: "Hard",
        icon: <BrainCircuit className="section-icon" />,
        questions: [
            {
                id: 301,
                name: "N-Queens",
                difficulty: "Hard",
                leetcode: "https://leetcode.com/problems/n-queens/",
                gfg: "https://practice.geeksforgeeks.org/problems/n-queen-problem0315/1"
            },
            {
                id: 302,
                name: "Trapping Rain Water",
                difficulty: "Hard",
                leetcode: "https://leetcode.com/problems/trapping-rain-water/",
                gfg: "https://practice.geeksforgeeks.org/problems/trapping-rain-water-1587115621/1"
            },
            {
                id: 303,
                name: "Merge k Sorted Lists",
                difficulty: "Hard",
                leetcode: "https://leetcode.com/problems/merge-k-sorted-lists/",
                gfg: "https://practice.geeksforgeeks.org/problems/merge-k-sorted-linked-lists/1"
            },
            {
                id: 304,
                name: "Median of Two Sorted Arrays",
                difficulty: "Hard",
                leetcode: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
                gfg: "https://practice.geeksforgeeks.org/problems/median-of-2-sorted-arrays-of-different-sizes/1"
            }
        ]
    }
];

const Particles = () => {
    return (
        <div className="particles-container">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="particle"
                    initial={{
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                        opacity: 0,
                    }}
                    animate={{
                        y: [null, Math.random() * -100],
                        opacity: [0, 0.5, 0],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            ))}
        </div>
    );
};

const Questions = () => {
    const { currentUser } = useAuth();
    const questionsRef = useRef(null);

    const scrollToQuestions = () => {
        questionsRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Helper to get storage key
    const getStorageKey = (uid) => `dsa-solved-status-${uid || 'guest'}`;

    // Local state for solved questions
    const [solvedQuestions, setSolvedQuestions] = useState(() => {
        // Initialize with current user's data (or guest)
        // If currentUser is not yet loaded (null), it might default to guest, 
        // but useEffect will fix it once currentUser matches.
        const key = getStorageKey(currentUser?.uid);
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    });

    // Update state when user changes
    useEffect(() => {
        const key = getStorageKey(currentUser?.uid);
        const saved = localStorage.getItem(key);
        setSolvedQuestions(saved ? JSON.parse(saved) : []);
    }, [currentUser]);

    const toggleSolved = (id) => {
        const key = getStorageKey(currentUser?.uid);
        const newSolved = solvedQuestions.includes(id)
            ? solvedQuestions.filter(qId => qId !== id)
            : [...solvedQuestions, id];

        setSolvedQuestions(newSolved);
        localStorage.setItem(key, JSON.stringify(newSolved));
    };

    const calculateProgress = (questions) => {
        const solvedCount = questions.filter(q => solvedQuestions.includes(q.id)).length;
        return (solvedCount / questions.length) * 100;
    };

    return (
        <div className="questions-container">
            <Particles />
            <div className="questions-header" style={{ display: 'none' }}></div>

            <div className="problem-list" ref={questionsRef}>
                {questionsData.map((section, sectionIndex) => (
                    <motion.div
                        key={sectionIndex}
                        className="topic-section"
                        initial={sectionIndex === 0
                            ? { opacity: 0, scale: 0.8, y: 50 }
                            : { opacity: 0, y: 30 }
                        }
                        whileInView={sectionIndex === 0
                            ? { opacity: 1, scale: 1, y: 0 }
                            : { opacity: 1, y: 0 }
                        }
                        viewport={{ once: true, margin: "-50px" }}
                        transition={sectionIndex === 0
                            ? { type: "spring", bounce: 0.5, duration: 0.8 }
                            : { duration: 0.5, delay: sectionIndex * 0.1 }
                        }
                    >
                        <div className="topic-header">
                            <div className="topic-title-wrapper">
                                {section.icon}
                                <h2 className="topic-title">{section.topic}</h2>
                            </div>
                            <div className="section-progress">
                                <div className="progress-bar-bg">
                                    <motion.div
                                        className="progress-bar-fill"
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${calculateProgress(section.questions)}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                    />
                                </div>
                                <span className="progress-text">
                                    {section.questions.filter(q => solvedQuestions.includes(q.id)).length}/{section.questions.length} Solved
                                </span>
                            </div>
                        </div>

                        <div className="questions-grid">
                            {section.questions.map((q, index) => (
                                <motion.div
                                    key={q.id}
                                    className={`question-card ${solvedQuestions.includes(q.id) ? 'solved-card' : ''}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
                                >
                                    <div className="card-content">
                                        <div className="question-header">
                                            <h3 className="question-name">{q.name}</h3>
                                            <div className="tooltip-container">
                                                <motion.button
                                                    className={`solved-toggle ${solvedQuestions.includes(q.id) ? 'active' : ''}`}
                                                    onClick={() => toggleSolved(q.id)}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    {solvedQuestions.includes(q.id) ? (
                                                        <CheckCircle2 className="solved-icon active" />
                                                    ) : (
                                                        <Circle className="solved-icon" />
                                                    )}
                                                </motion.button>
                                                <span className="tooltip-text">
                                                    {solvedQuestions.includes(q.id) ? "Mark as unsolved" : "Mark as solved"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="difficulty-badge-wrapper">
                                            <span className={`question-difficulty difficulty-${q.difficulty.toLowerCase()}`}>
                                                {q.difficulty}
                                            </span>
                                        </div>

                                        <div className="question-links">
                                            {q.leetcode && (
                                                <a href={q.leetcode} target="_blank" rel="noopener noreferrer" className="link-btn link-leetcode">
                                                    <Code2 size={16} /> LeetCode
                                                </a>
                                            )}
                                            {q.gfg && (
                                                <a href={q.gfg} target="_blank" rel="noopener noreferrer" className="link-btn link-gfg">
                                                    <ExternalLink size={16} /> GFG
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Questions;
