import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Download, Smartphone, X } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { loadSavedRecords } from "./utils/userProgress";
import { getDueReviewQuestions } from "./utils/spacedRepetition";
import "./Navbar.css";

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [dueReviewCount, setDueReviewCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const supportsWebInstall = typeof Navigator !== "undefined"
    && typeof Navigator.prototype.install === "function";

  useEffect(() => {
    const isRunningStandalone = window.matchMedia?.("(display-mode: standalone)").matches
      || window.navigator.standalone === true;
    setIsInstalled(isRunningStandalone);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstallHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const updateDueCount = () => {
      try {
        const records = loadSavedRecords(currentUser?.uid);
        const due = getDueReviewQuestions(records);
        setDueReviewCount(due.length);
      } catch {
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

  const handleInstallClick = async () => {
    closeMenu();
    if (supportsWebInstall) {
      try {
        await window.navigator.install();
        setIsInstalled(true);
      } catch (error) {
        if (error.name !== "AbortError") setShowInstallHelp(true);
      }
      return;
    }

    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }

    const promptEvent = installPrompt;
    setInstallPrompt(null);
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice?.outcome === "accepted") setIsInstalled(true);
  };

  const isAppleMobile = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(window.navigator.userAgent);
  const canOfferInstall = !isInstalled && (isAppleMobile || isAndroid || supportsWebInstall || Boolean(installPrompt));

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo-link" onClick={closeMenu}>
          <div className="nav-logo-icon-wrapper">
            <img src="/dsa-logo.png" alt="DSA Sheet Logo" className="nav-logo-img" />
          </div>
          <span className="nav-logo-text">
            DSA <span className="nav-logo-accent">Sheet</span>
          </span>
        </Link>

        {canOfferInstall && (
          <button type="button" className="install-app-btn nav-install-action" onClick={handleInstallClick}>
            <Download size={16} />
            <span>Install app</span>
          </button>
        )}

        <div className="hamburger-menu" onClick={toggleMenu} aria-label="Toggle navigation">
          <div className={`bar ${isOpen ? "open" : ""}`}></div>
          <div className={`bar ${isOpen ? "open" : ""}`}></div>
          <div className={`bar ${isOpen ? "open" : ""}`}></div>
        </div>

        <ul className={`nav-links ${isOpen ? "active" : ""}`}>
          <li><NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>Home</NavLink></li>

          {/* Public Route */}
          <li><NavLink to="/news" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>Tech News</NavLink></li>

          {/* Protected Routes (Available when logged in) */}
          {currentUser ? (
            <>
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
              <li><NavLink to="/careers" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={closeMenu}>Careers</NavLink></li>

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
              <li><NavLink to="/register" className={({ isActive }) => `nav-link nav-btn-register ${isActive ? "active" : ""}`} onClick={closeMenu}>Register</NavLink></li>
            </>
          )}
        </ul>
      </div>

      {showInstallHelp && (
        <div className="install-help-backdrop" onClick={() => setShowInstallHelp(false)}>
          <section
            className="install-help-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="install-help-close" onClick={() => setShowInstallHelp(false)} aria-label="Close install instructions">
              <X size={18} />
            </button>
            <div className="install-help-icon"><Smartphone size={22} /></div>
            <h2 id="install-help-title">Add dsa-sheet to your home screen</h2>
            {isAppleMobile ? (
              <ol>
                <li>Open this site in <strong>Safari</strong>.</li>
                <li>Tap the <strong>Share</strong> button.</li>
                <li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>
              </ol>
            ) : isAndroid ? (
              <ol>
                <li>Open this site in <strong>Chrome</strong> on Android.</li>
                <li>Tap the <strong>⋮</strong> menu.</li>
                <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
              </ol>
            ) : (
              <ol>
                <li>Open this site in a browser that supports installing web apps.</li>
                <li>Open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
              </ol>
            )}
            <p className="install-help-note">If you don’t see the install option, make sure you’re using the deployed HTTPS site in a supported browser.</p>
            <button type="button" className="install-help-done" onClick={() => setShowInstallHelp(false)}>Got it</button>
          </section>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
