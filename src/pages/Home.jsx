import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Github,
  Linkedin,
  Mail,
  Layers,
  Code2,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Globe,
  Flame,
  Award,
  Sparkles,
  Bot,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DSA_TOPICS } from '../constants';
import TodoList from '../components/TodoList';
import Magnetic from '../components/Magnetic';
import { loadLocalSolved, loadSavedRecords } from '../utils/userProgress';
import { getDueReviewQuestions } from '../utils/spacedRepetition';
import './Home.css';

const TRENDS_DATA = [
  {
    category: "Most Popular Languages",
    items: [
      { name: "JavaScript", percent: 62.3, color: "#f7df1e" },
      { name: "Python", percent: 51.0, color: "#3776ab" },
      { name: "TypeScript", percent: 38.5, color: "#3178c6" },
      { name: "Java", percent: 30.3, color: "#e36209" }
    ]
  },
  {
    category: "Most Loved Frameworks",
    items: [
      { name: "React", percent: 39.5, color: "#61dafb" },
      { name: "Next.js", percent: 17.9, color: "#ffffff" },
      { name: "Vue.js", percent: 15.4, color: "#4fc08d" },
      { name: "Svelte", percent: 7.2, color: "#ff3e00" }
    ]
  },
  {
    category: "Databases",
    items: [
      { name: "PostgreSQL", percent: 48.7, color: "#336791" },
      { name: "MySQL", percent: 40.3, color: "#4479a1" },
      { name: "SQLite", percent: 33.1, color: "#003b57" },
      { name: "MongoDB", percent: 24.8, color: "#47a248" }
    ]
  },
  {
    category: "Cloud Platforms",
    items: [
      { name: "AWS", percent: 48.6, color: "#ff9900" },
      { name: "Microsoft Azure", percent: 27.8, color: "#0078d4" },
      { name: "Google Cloud", percent: 24.9, color: "#4285f4" },
      { name: "Vercel", percent: 15.2, color: "#000000" }
    ]
  }
];

const Particles = () => {
  return (
    <div className="particles-container">
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="particle"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, Math.random() * -150],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: Math.random() * 20 + 15, // Slower, more floating
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10,
          }}
        />
      ))}
    </div>
  );
};

const MotionLink = motion.create ? motion.create(Link) : motion(Link);

const Home = () => {
  const { currentUser } = useAuth();
  const trendsContainerRef = React.useRef(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const [stats, setStats] = React.useState({ solvedCount: 0, dueCount: 0, streakDays: 0 });

  React.useEffect(() => {
    try {
      const records = loadSavedRecords(currentUser?.uid);
      const solvedIds = loadLocalSolved(currentUser?.uid);
      const due = getDueReviewQuestions(records);

      const entries = Object.values(records);
      const counts = {};
      entries.forEach(entry => {
        const d = entry.completedAt || entry.updatedAt;
        if (!d) return;
        try {
          const key = new Date(d).toISOString().split('T')[0];
          counts[key] = (counts[key] || 0) + 1;
        } catch (e) {}
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let streak = 0;
      let check = new Date(today);
      let k = check.toISOString().split('T')[0];
      if (!counts[k]) {
        check.setDate(check.getDate() - 1);
        k = check.toISOString().split('T')[0];
      }
      while (counts[k] && counts[k] > 0) {
        streak++;
        check.setDate(check.getDate() - 1);
        k = check.toISOString().split('T')[0];
      }

      setStats({
        solvedCount: solvedIds.length,
        dueCount: due.length,
        streakDays: streak
      });
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const scrollLeft = () => {
    if (trendsContainerRef.current) {
      trendsContainerRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (trendsContainerRef.current) {
      trendsContainerRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  const steps = [
    {
      icon: <Layers size={32} />,
      title: "Choose a Sheet",
      desc: "Pick curated sets like Basic, Striver SDE, or Blind 75."
    },
    {
      icon: <Code2 size={32} />,
      title: "Solve Problems",
      desc: "Track your progress with difficulty filters and tags."
    },
    {
      icon: <TrendingUp size={32} />,
      title: "Master DSA",
      desc: "Get optimized solutions and build confidence for interviews."
    }
  ];

  const shouldReduceMotion = useReducedMotion();

  const heroContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      }
    }
  };

  const heroHeadingVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        delay: 0,
        ease: "easeOut"
      }
    }
  };

  const heroSubtextVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        delay: shouldReduceMotion ? 0 : 0.1,
        ease: "easeOut"
      }
    }
  };

  const heroButtonsVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        delay: shouldReduceMotion ? 0 : 0.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="home-container">
      <Particles />

      {/* Hero Section */}
      <section className="hero-section">
        {/* Subtle Ambient Background Blobs (Tri-color Palette Depth) */}
        <div className="hero-ambient-blob hero-ambient-blob-1" aria-hidden="true"></div>
        <div className="hero-ambient-blob hero-ambient-blob-2" aria-hidden="true"></div>
        <div className="hero-ambient-blob hero-ambient-blob-3" aria-hidden="true"></div>

        <motion.div
          className="hero-content"
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={heroHeadingVariants}>
            <div className="hero-eyebrow-pill">
              <Sparkles size={14} className="eyebrow-icon live-pulse-dot" />
              <span>Next-Gen Technical Interview System</span>
            </div>
            <h1 className="hero-title">
              {currentUser ? (
                <>
                  <span className="hero-title-solid">Welcome back, </span>
                  <span className="text-gradient gradient-text-animated">
                    {currentUser.displayName || currentUser.email.split('@')[0]}
                  </span>
                </>
              ) : (
                <>
                  <span className="hero-title-solid">A Smarter Way to </span>
                  <span className="text-gradient gradient-text-animated">Master DSA & Architecture</span>
                </>
              )}
            </h1>
          </motion.div>

          <motion.p className="hero-subtitle" variants={heroSubtextVariants}>
            Master 16 core algorithm patterns, distributed system design blueprints, and high-scale computer networking with AI-guided assistance.
          </motion.p>

          {/* Quick Momentum & Spaced Review Strip */}
          <motion.div className="hero-quick-strip" variants={heroSubtextVariants}>
            <div className="quick-strip-item streak" title="Daily solve streak">
              <Flame size={15} className="quick-icon-streak" />
              <span><strong>{stats.streakDays > 0 ? `${stats.streakDays} Day` : "0 Day"}</strong> Streak</span>
            </div>
            <div className="quick-strip-divider"></div>
            <Link to="/questions" className="quick-strip-item solved" title="View all completed questions">
              <CheckCircle2 size={15} className="quick-icon-solved" />
              <span><strong>{stats.solvedCount}</strong> Solved</span>
            </Link>
            <div className="quick-strip-divider"></div>
            <Link to="/sheet?tab=spaced" className="quick-strip-item review" title="Review questions due via SM-2 algorithm">
              <Sparkles size={14} className="quick-icon-review" />
              <span className={`quick-review-pill ${stats.dueCount > 0 ? 'pill-alert' : 'pill-clear'}`}>
                {stats.dueCount > 0 ? `${stats.dueCount} Due Today` : "Review Clear"}
              </span>
            </Link>
          </motion.div>

          {/* Action Buttons: Clear Hero CTA + Secondary Action Dock */}
          <motion.div className="hero-actions-wrapper" variants={heroButtonsVariants}>
            <div className="hero-primary-action">
              <Magnetic>
                <MotionLink
                  to="/questions"
                  className="btn btn-primary hero-btn-primary"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Start Solving</span> <ChevronRight size={18} />
                </MotionLink>
              </Magnetic>
            </div>

            <div className="hero-secondary-dock">
              <Magnetic>
                <MotionLink
                  to="/interview-hub?tab=dsa"
                  className="hero-dock-pill"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Layers size={15} className="dock-icon text-emerald" />
                  <span>16 Patterns Hub</span>
                </MotionLink>
              </Magnetic>

              <Magnetic>
                <MotionLink
                  to="/interview-hub?tab=system-design"
                  className="hero-dock-pill"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Cpu size={15} className="dock-icon text-amber" />
                  <span>System Design</span>
                </MotionLink>
              </Magnetic>

              <Magnetic>
                <MotionLink
                  to="/news"
                  className="hero-dock-pill"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Globe size={15} className="dock-icon text-sky" />
                  <span>Tech Radar</span>
                </MotionLink>
              </Magnetic>

              <Magnetic>
                <MotionLink
                  to="/dsa-vault"
                  className="hero-dock-pill"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <BookOpen size={15} className="dock-icon text-indigo" />
                  <span>Topic Notes</span>
                </MotionLink>
              </Magnetic>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Tech Trends Section */}
      <section className="section trends-section">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="section-header text-center mb-md">
            <h2 className="section-title">Developer Trends <span className="text-primary">2024</span></h2>
            <p className="section-subtitle">Insights from Stack Overflow Developer Survey</p>
          </div>

          <div className="trends-scroll-wrapper">
            <button className="scroll-btn left" onClick={scrollLeft} aria-label="Scroll left">
              <ChevronLeft size={24} />
            </button>

            <div className="trends-grid" ref={trendsContainerRef}>
              {TRENDS_DATA.map((group, idx) => (
                <motion.div
                  key={idx}
                  className="trend-card"
                  whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.3)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <h3 className="trend-category">{group.category}</h3>
                  <div className="trend-bars">
                    {group.items.map((item, i) => (
                      <div key={i} className="trend-item">
                        <div className="trend-info">
                          <span className="trend-name">{item.name}</span>
                          <span className="trend-percent">{item.percent}%</span>
                        </div>
                        <div className="trend-bar-bg">
                          <motion.div
                            className="trend-bar-fill"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.percent}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.2 + (i * 0.1), ease: "easeOut" }}
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <button className="scroll-btn right" onClick={scrollRight} aria-label="Scroll right">
              <ChevronRight size={24} />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Bento Feature Showcase Grid (ui-ux-pro-max Apple-style Bento Architecture) */}
      <section className="section bento-section">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-header text-center mb-md">
            <div className="bento-badge">
              <Sparkles size={14} />
              <span>Engineered for Mastery</span>
            </div>
            <h2 className="section-title">Everything You Need To Crack Top Tier Roles</h2>
            <p className="section-subtitle">A cohesive developer ecosystem combining algorithm patterns, distributed system design, and AI assistance.</p>
          </div>

          <div className="bento-grid">
            {/* Tile 1: 16 DSA Coding Patterns (Span 7) */}
            <motion.div
              className="bento-card tile-patterns"
              whileHover={{ y: -4, borderColor: "rgba(16, 185, 129, 0.5)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="bento-card-header">
                <div className="bento-icon-wrapper emerald">
                  <Layers size={24} />
                </div>
                <span className="bento-status-pill emerald">16 Core Paradigms</span>
              </div>
              <h3 className="bento-card-title">16 Coding Patterns Masterclass</h3>
              <p className="bento-card-desc">
                Move beyond memorizing solutions. Learn the underlying structural mechanics of Sliding Window, Two Pointers, Fast & Slow pointers, In-Place Reversal, and Top 'K' Elements.
              </p>
              <div className="bento-pattern-chips">
                <span className="pattern-pill">Sliding Window</span>
                <span className="pattern-pill">Two Pointers</span>
                <span className="pattern-pill">Fast & Slow</span>
                <span className="pattern-pill">Two Heaps</span>
                <span className="pattern-pill">0/1 Knapsack</span>
                <span className="pattern-pill">Topological Sort</span>
              </div>
              <Link to="/interview-hub?tab=dsa" className="bento-cta-link emerald">
                Explore 16 Patterns <ArrowRight size={15} />
              </Link>
            </motion.div>

            {/* Tile 2: System Design Blueprints (Span 5) */}
            <motion.div
              className="bento-card tile-system-design"
              whileHover={{ y: -4, borderColor: "rgba(245, 158, 11, 0.5)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="bento-card-header">
                <div className="bento-icon-wrapper amber">
                  <Cpu size={24} />
                </div>
                <span className="bento-status-pill amber">High-Scale Architecture</span>
              </div>
              <h3 className="bento-card-title">Scalable System Design</h3>
              <p className="bento-card-desc">
                A 4-step interview blueprint covering CAP theorem, Consistent Hashing, Distributed Caching, and Message Queues with production case studies.
              </p>
              <div className="bento-pattern-chips">
                <span className="pattern-pill">CAP Theorem</span>
                <span className="pattern-pill">Rate Limiting</span>
                <span className="pattern-pill">Consistent Hashing</span>
                <span className="pattern-pill">Distributed Cache</span>
              </div>
              <Link to="/interview-hub?tab=system-design" className="bento-cta-link amber">
                View System Design <ArrowRight size={15} />
              </Link>
            </motion.div>

            {/* Tile 3: 7-Layer OSI & Networking (Span 4) */}
            <motion.div
              className="bento-card tile-networking"
              whileHover={{ y: -4, borderColor: "rgba(56, 189, 248, 0.5)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="bento-card-header">
                <div className="bento-icon-wrapper sky">
                  <Globe size={24} />
                </div>
                <span className="bento-status-pill sky">Interactive Explorer</span>
              </div>
              <h3 className="bento-card-title">Computer Networking</h3>
              <p className="bento-card-desc">
                Interactive 7-layer OSI visualization, TCP 3-way handshake breakdown, DNS lifecycle, and HTTP/1.1 vs HTTP/2 vs HTTP/3 comparisons.
              </p>
              <div className="bento-pattern-chips">
                <span className="pattern-pill">OSI 7-Layer</span>
                <span className="pattern-pill">TCP 3-Way</span>
                <span className="pattern-pill">HTTP/3 QUIC</span>
              </div>
              <Link to="/interview-hub?tab=networking" className="bento-cta-link sky">
                Open Networking Hub <ArrowRight size={15} />
              </Link>
            </motion.div>

            {/* Tile 4: 500+ Verified FAANG Solutions (Span 4) */}
            <motion.div
              className="bento-card tile-faang"
              whileHover={{ y: -4, borderColor: "rgba(99, 102, 241, 0.5)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="bento-card-header">
                <div className="bento-icon-wrapper indigo">
                  <Award size={24} />
                </div>
                <span className="bento-status-pill indigo">FAANG Archives</span>
              </div>
              <h3 className="bento-card-title">500+ Verified Solutions</h3>
              <p className="bento-card-desc">
                Real solutions tested across Google, Meta, Amazon, Microsoft, and Apple with line-by-line syntax viewers and direct LeetCode practice links.
              </p>
              <div className="bento-pattern-chips">
                <span className="pattern-pill">Google</span>
                <span className="pattern-pill">Meta</span>
                <span className="pattern-pill">Amazon</span>
                <span className="pattern-pill">Apple</span>
              </div>
              <Link to="/interview-hub?tab=archive" className="bento-cta-link indigo">
                Browse Companies <ArrowRight size={15} />
              </Link>
            </motion.div>

            {/* Tile 5: Neural AI Copilot Assistant (Span 4) */}
            <motion.div
              className="bento-card tile-copilot"
              whileHover={{ y: -4, borderColor: "rgba(16, 185, 129, 0.5)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="bento-card-header">
                <div className="bento-icon-wrapper emerald">
                  <Bot size={24} />
                </div>
                <span className="bento-status-pill emerald">Floating Copilot</span>
              </div>
              <h3 className="bento-card-title">Neural AI Copilot</h3>
              <p className="bento-card-desc">
                Ask questions at any moment with hotkey <kbd>Ctrl + /</kbd>. Offers dry-run debugging, algorithmic hints, and time complexity reviews without spoiling the solution.
              </p>
              <div className="bento-pattern-chips">
                <span className="pattern-pill">Complexity O(N)</span>
                <span className="pattern-pill">Dry-Run Helper</span>
                <span className="pattern-pill">Edge Cases</span>
              </div>
              <span className="bento-cta-link emerald" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                Press Ctrl + / to activate <ArrowRight size={15} />
              </span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="section how-it-works">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="step-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -10, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              >
                <div className="step-number">{index + 1}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>DSA Sheet</h3>
            <p>Built for developers, by developers.</p>
          </div>
          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Contact</a>
            {/* TodoList component is used as a widget in the corner, not here in the footer links usually, 
                but keeping structure if it's rendered as a hidden portal or similar */}
            <TodoList />
          </div>
          <div className="footer-social">
            <a href="https://github.com/adityagaikwad90" aria-label="GitHub"><Github size={20} /></a>
            <a href="https://www.linkedin.com/in/aditya-gaikwad-52335a250/" aria-label="LinkedIn"><Linkedin size={20} /></a>
            <a href="mailto:adityagaikwadpbn@gmail.com" aria-label="Email"><Mail size={20} /></a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} DSA Sheet. Version 2.0.0</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
