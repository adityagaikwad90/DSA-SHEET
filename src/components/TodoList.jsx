import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, X, Calendar, Sparkles, ChevronUp, Layout, Check, Trash2 } from 'lucide-react';
import './TodoList.css';

// Premium Spring Config - Natural, not bouncy
const springTransition = {
    type: "spring",
    stiffness: 400,
    damping: 30,
    mass: 1
};

const TodoList = () => {
    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('dsa-sheet-todos');
        return saved ? JSON.parse(saved) : [];
    });
    const [newTask, setNewTask] = useState('');
    const [filter, setFilter] = useState('all');
    const [isOpen, setIsOpen] = useState(false);

    const inputRef = useRef(null);
    const pillRef = useRef(null);
    const shouldReduceMotion = useReducedMotion();

    // Persist tasks
    useEffect(() => {
        localStorage.setItem('dsa-sheet-todos', JSON.stringify(tasks));
    }, [tasks]);

    // Keyboard Accessibility
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isOpen && e.key === 'Escape') {
                setIsOpen(false);
                pillRef.current?.focus();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            setTimeout(() => inputRef.current?.focus(), 100);
        }

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const addTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        const task = {
            id: Date.now(),
            text: newTask,
            completed: false,
            createdAt: new Date().toISOString()
        };

        setTasks([task, ...tasks]);
        setNewTask('');
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const clearCompleted = () => {
        setTasks(tasks.filter(t => !t.completed));
    };

    // Animation Variants
    const containerVariants = {
        hidden: {
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.9,
            y: shouldReduceMotion ? 0 : 20
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                ...springTransition,
                when: "beforeChildren",
                staggerChildren: shouldReduceMotion ? 0 : 0.05
            }
        },
        exit: {
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.95,
            y: shouldReduceMotion ? 0 : 10,
            transition: { duration: 0.2, ease: "easeOut" }
        }
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            x: shouldReduceMotion ? 0 : -10
        },
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: "spring", stiffness: 500, damping: 30 }
        },
        exit: {
            opacity: 0,
            x: shouldReduceMotion ? 0 : 10,
            transition: { duration: 0.2 }
        }
    };

    const pillVariants = {
        hidden: { opacity: 0, scale: 0.8, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.8, y: 20 }
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    });

    const activeTasks = tasks.filter(t => !t.completed);
    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

    return (
        <div className="todo-widget-container" role="application" aria-label="Task Board Widget">
            <AnimatePresence mode="wait">
                {!isOpen ? (
                    <motion.button
                        ref={pillRef}
                        key="pill"
                        layoutId="todo-widget" // Smooth shared layout transition
                        variants={pillVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={springTransition}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="todo-pill"
                        onClick={() => setIsOpen(true)}
                        aria-expanded="false"
                        aria-label="Open Task Board"
                    >
                        <div className="pill-icon">
                            <Layout size={18} />
                        </div>
                        <div className="pill-content">
                            <span className="pill-label">My Tasks</span>
                            {activeTasks.length > 0 && (
                                <span className="pill-badge">{activeTasks.length}</span>
                            )}
                        </div>
                        <ChevronUp size={16} className="pill-arrow" />
                    </motion.button>
                ) : (
                    <motion.div
                        key="board"
                        layoutId="todo-widget"
                        className="todo-wrapper expanded"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="todo-title"
                    >
                        <div className="todo-header-premium">
                            <div className="todo-header-top">
                                <div className="todo-brand">
                                    <Calendar size={20} className="brand-icon" />
                                    <h3 id="todo-title">My Tasks</h3>
                                </div>
                                <div className="todo-header-controls">
                                    {tasks.length > 0 && (
                                        <div className="todo-progress-mini">
                                            <span className="progress-text">{progress}% Done</span>
                                            <div className="progress-bar-bg">
                                                <motion.div
                                                    className="progress-bar-fill"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="close-widget-btn"
                                        aria-label="Close Task Board"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={addTask} className="todo-input-group">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                    placeholder="What's your focus?"
                                    className="todo-premium-input"
                                />
                                <button
                                    type="submit"
                                    className="todo-add-btn-premium"
                                    disabled={!newTask.trim()}
                                    aria-label="Add Task"
                                >
                                    <Plus size={18} />
                                </button>
                            </form>
                        </div>

                        <div className="todo-content">
                            <div className="todo-tabs" role="tablist">
                                {['all', 'active', 'completed'].map((tab) => (
                                    <button
                                        key={tab}
                                        role="tab"
                                        aria-selected={filter === tab}
                                        className={`tab-btn ${filter === tab ? 'active' : ''}`}
                                        onClick={() => setFilter(tab)}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <motion.div className="todo-list-premium">
                                <AnimatePresence initial={false} mode="popLayout">
                                    {filteredTasks.length === 0 && (
                                        <motion.div
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            className="empty-state-premium"
                                        >
                                            <Sparkles size={32} className="empty-icon" />
                                            <p>
                                                {filter === 'completed'
                                                    ? "No completed tasks yet."
                                                    : "All caught up!"}
                                            </p>
                                        </motion.div>
                                    )}

                                    {filteredTasks.map(task => (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            className={`todo-item-premium ${task.completed ? 'completed' : ''}`}
                                            role="checkbox"
                                            aria-checked={task.completed}
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    toggleTask(task.id);
                                                }
                                            }}
                                        >
                                            <div
                                                className="custom-checkbox-wrapper"
                                                onClick={() => toggleTask(task.id)}
                                            >
                                                <div className={`custom-checkbox ${task.completed ? 'checked' : ''}`}>
                                                    {task.completed && <Check size={12} strokeWidth={3} />}
                                                </div>
                                            </div>
                                            <span className="task-text">{task.text}</span>
                                            <button
                                                className="delete-btn-premium"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteTask(task.id);
                                                }}
                                                aria-label="Delete task"
                                            >
                                                <X size={16} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>

                            <div className="todo-footer">
                                {completedCount > 0 && filter !== 'active' && (
                                    <button
                                        className="clear-completed-btn"
                                        onClick={clearCompleted}
                                    >
                                        Clear Completed
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TodoList;
