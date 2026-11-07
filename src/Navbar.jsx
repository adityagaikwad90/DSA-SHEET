import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { loadSavedRecords } from "./utils/userProgress";
import { getDueReviewQuestions } from "./utils/spacedRepetition";
import "./Navbar.css";

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [dueReviewCount, setDueReviewCount] = useState(0);

  useEffect(() => {
    const updateDueCount = () => {
      try {
        const records = loadSavedRecords(currentUser?.uid);
        const due = getDueReviewQuestions(records);
        setDueReviewCount(due.length);
      } catch (e) {
        setDueReviewCount(0);
      }
    };

    updateDueCount();

    // Listen to localStorage updates across tabs/components
    window.addEventListener("storage", updateDueCount);
    // Custom event triggered when question status is updated in this window
    window.addEventListener("dsa-progress-updated", updateDueCount);

    return () => {
      window.removeEventListener("storage", updateDueCount);
      window.removeEventListener("dsa-progress-updated", updateDueCount);
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo-link" onClick={closeMenu}>
          <h2 className="nav-logo">DSA Sheet</h2>
        </Link>

        <div className="hamburger-menu" onClick={toggleMenu} aria-label="Toggle navigation">
          <div className={`bar ${isOpen ? "open" : ""}`}></div>
          <div className={`bar ${isOpen ? "open" : ""}`}></div>
          <div className={`bar ${isOpen ? "open" : ""}`}></div>
        </div>

        <ul className={`nav-links ${isOpen ? "active" : ""}`}>
          <li><NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>Home</NavLink></li>
          <li><NavLink to="/questions" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>Code Arena</NavLink></li>
          <li><NavLink to="/top-100" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>Top 100</NavLink></li>
          <li><NavLink to="/interview-hub" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>Interview Hub</NavLink></li>
          <li>
            <NavLink to="/sheet" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>
              My Sheet
              {dueReviewCount > 0 && (
                <span className="nav-review-badge" title={`${dueReviewCount} questions due for spaced review`}>
                  {dueReviewCount}
                </span>
              )}
            </NavLink>
          </li>
          <li><NavLink to="/dsa-vault" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>DSA Vault</NavLink></li>
          <li><NavLink to="/club" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>Clubs</NavLink></li>
          <li><NavLink to="/news" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>Tech News</NavLink></li>

          {currentUser ? (
            <>
              <li className="user-info">
                <span className="user-status-dot"></span>
                <span>{currentUser.email.split('@')[0]}</span>
              </li>
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>Login</NavLink></li>
              <li><NavLink to="/register" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>Register</NavLink></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
