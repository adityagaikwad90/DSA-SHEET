import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DSA_TOPICS } from '../constants';
import TodoList from '../components/TodoList';
import './Home.css';

const TRENDS_DATA = [
  {
    category: "Most Popular Languages",
    items: [
      { name: "JavaScript", percent: 63.6, color: "#f7df1e" },
      { name: "Python", percent: 49.2, color: "#3776ab" },
      { name: "TypeScript", percent: 38.5, color: "#3178c6" },
      { name: "Java", percent: 30.5, color: "#e36209" }
    ]
  },
  {
    category: "Most Loved Frameworks",
    items: [
      { name: "React", percent: 40.5, color: "#61dafb" },
      { name: "Next.js", percent: 17.9, color: "#ffffff" },
      { name: "Vue.js", percent: 16.3, color: "#4fc08d" },
      { name: "Svelte", percent: 6.9, color: "#ff3e00" }
    ]
  },
  {
    category: "Databases",
    items: [
      { name: "PostgreSQL", percent: 45.5, color: "#336791" },
      { name: "MySQL", percent: 41.1, color: "#4479a1" },
      { name: "SQLite", percent: 30.9, color: "#003b57" },
      { name: "MongoDB", percent: 25.5, color: "#47a248" }
    ]
  },
  {
    category: "Cloud Platforms",
    items: [
      { name: "AWS", percent: 49.0, color: "#ff9900" },
      { name: "Microsoft Azure", percent: 26.0, color: "#0078d4" },
      { name: "Google Cloud", percent: 23.9, color: "#4285f4" },
      { name: "Vercel", percent: 15.0, color: "#000000" }
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

const MotionLink = motion(Link);

const Home = () => {
  const { currentUser } = useAuth();
  const trendsContainerRef = React.useRef(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 50, damping: 20 }
    }
  };

  return (
    <div className="home-container">
      <Particles />

      {/* Hero Section */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <h1 className="hero-title">
              {currentUser ?
                <>Welcome back, <span className="text-gradient">{currentUser.displayName || currentUser.email.split('@')[0]}</span>!</>
                :
                <>Master <span className="text-gradient">Data Structures</span> <br /> & Algorithms</>
              }
            </h1>
          </motion.div>

          <motion.p className="hero-subtitle" variants={itemVariants}>
            Your ultimate companion for technical interview preparation. <br className="hidden md:block" />
            Track progress, solve curated problems, and land your dream job.
          </motion.p>

          <motion.div className="hero-buttons" variants={itemVariants}>
            <MotionLink
              to="/questions"
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Solving <ArrowRight size={18} />
            </MotionLink>
            <MotionLink
              to="/dsa-vault"
              className="btn btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View All Notes
            </MotionLink>
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
          <p>&copy; {new Date().getFullYear()} DSA Sheet. Version 1.0.0</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
