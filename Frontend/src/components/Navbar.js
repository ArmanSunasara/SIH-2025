import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          🌊 Water Quality Checker
        </Link>
        
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <Link to="/" className="navbar-item">
                Home
              </Link>
              <Link to="/predict" className="navbar-item">
                Predict
              </Link>
              <Link to="/history" className="navbar-item">
                History
              </Link>
              <div className="navbar-user">
                <span>Welcome, {user?.email}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/" className="navbar-item">
                Home
              </Link>
              <Link to="/login" className="navbar-item">
                Login
              </Link>
              <Link to="/register" className="navbar-item">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;