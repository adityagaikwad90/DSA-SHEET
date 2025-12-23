import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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
        <h2 className="nav-logo">DSA Sheet</h2>

        <div className="hamburger-menu" onClick={toggleMenu}>
          <div className={`bar ${isOpen ? "open" : ""}`}></div>
          <div className={`bar ${isOpen ? "open" : ""}`}></div>
          <div className={`bar ${isOpen ? "open" : ""}`}></div>
        </div>

        <ul className={`nav-links ${isOpen ? "active" : ""}`}>
          <li><Link to="/" className="nav-link" onClick={closeMenu}>Home</Link></li>
          <li><Link to="/questions" className="nav-link" onClick={closeMenu}>Code Arena</Link></li>
          <li><Link to="/sheet" className="nav-link" onClick={closeMenu}>My Sheet</Link></li>
          <li><Link to="/dsa-vault" className="nav-link" onClick={closeMenu}>DSA Vault</Link></li>
          <li><Link to="/club" className="nav-link" onClick={closeMenu}>Clubs</Link></li>

          {currentUser ? (
            <>
              <li className="user-info">
                Hello, {currentUser.email.split('@')[0]}
              </li>
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" onClick={closeMenu}>Login</Link></li>
              <li><Link to="/register" onClick={closeMenu}>Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
