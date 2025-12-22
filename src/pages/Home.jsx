import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import TopicNotes from '../components/TopicNotes';
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

const Home = () => {
  const { currentUser } = useAuth();
  const [selectedTopic, setSelectedTopic] = React.useState(null);
  const trendsContainerRef = React.useRef(null);

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

  return (
    <div className="home-container">
      <Particles />

      {/* Hero Section */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="hero-title">
            {currentUser ? `Welcome back, ${currentUser.displayName || currentUser.email.split('@')[0]}!` : "Master Data Structures & Algorithms"}
          </h1>
          <p className="hero-subtitle">
            Your ultimate companion for technical interview preparation. Track progress, solve curated problems, and land your dream job.
          </p>

          <div className="hero-buttons">
            <Link to="/questions" className="btn btn-primary">
              Start Solving <ArrowRight size={18} />
            </Link>
            <Link to="/dsa-vault" className="btn btn-secondary">
              View All Notes
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Tech Trends Section */}
      <section className="section trends-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2 className="section-title">Developer Trends 2024</h2>
            <p className="section-subtitle">Insights from Stack Overflow Developer Survey</p>
          </div>

          <div className="trends-scroll-wrapper">
            <button className="scroll-btn left" onClick={scrollLeft} aria-label="Scroll left">
              <ChevronLeft size={24} />
            </button>

            <div className="trends-grid" ref={trendsContainerRef}>
              {TRENDS_DATA.map((group, idx) => (
                <div key={idx} className="trend-card">
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
                            transition={{ duration: 1, delay: 0.2 }}
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{index + 1}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
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
            <TodoList />
          </div>
          <div className="footer-social">
            <a href="#" aria-label="https://github.com/adityagaikwad90"><Github size={20} /></a>
            <a href="" aria-label="https://www.linkedin.com/in/aditya-gaikwad-52335a250/"><Linkedin size={20} /></a>
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
