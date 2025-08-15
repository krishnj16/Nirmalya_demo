import React, { useState, useEffect } from 'react';
import nirmalyaLogo from '../assets/Nirmalya_logo.jpg';
import Predictor from './Predictor';
import ImageUploaderPage from './Components/ImageUploadPage';
import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showMainContent, setShowMainContent] = useState(false);
  const [showPredictor, setShowPredictor] = useState(false);
  const [isExiting, setIsExiting] = useState(false); // New state for fade-out
  const [showClassifier, setShowClassifier] = useState(false);
  // This effect handles the splash screen timing
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    return () => clearTimeout(splashTimer);
  }, []);

  // This effect handles the fade-in of the main content
  useEffect(() => {
    if (!showSplash) {
      const contentTimer = setTimeout(() => {
        setShowMainContent(true);
      }, 500);
      return () => clearTimeout(contentTimer);
    }
  }, [showSplash]);

  // This function handles the transition from welcome page to predictor
  const handleLaunchPredictor = () => {
    setIsExiting(true); // Start the fade-out animation
    setTimeout(() => {
      setShowPredictor(true); // Show the predictor after the animation
    }, 500); // This duration must match the CSS transition time
  };
  const handleLaunchClassifier = () => {
  setIsExiting(true);
  setTimeout(() => {
    setShowClassifier(true);
  }, 500);
};

  return (
    <>
      {/* --- Splash Screen --- */}
      <div id="splash-screen" className={showSplash ? '' : 'hidden'}>
        <div className="logo-container">
          <img
            src={nirmalyaLogo}
            alt="Nirmalya Logo"
            className="splash-logo"
          />
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div
        id="main-content"
        className={`main-container ${showMainContent ? 'visible' : ''}`}
      >
        {/* The Welcome page, which will fade out */}
        {!showPredictor &&  !showClassifier && (
          <div className={`welcome-section ${isExiting ? 'exiting' : ''}`}>
            <div className="title-container">
              <img
                src={nirmalyaLogo}
                alt="Nirmalya Logo"
                className="main-logo"
              />
              <h1 className="main-title">Nirmalya</h1>
            </div>
            <p className="main-subtitle">
              Welcome to the future of waste management.
            </p>
            <button
              className="launch-button"
              onClick={handleLaunchPredictor}
            >
              <span>Launch Reward Predictor</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
             <button
      className="launch-button"
      style={{ marginTop: '1rem', backgroundColor: '#4caf50' }}
      onClick={handleLaunchClassifier}
    >
      <span>Use Classifier</span>
      
    </button>
          </div>
        )}




       


        {/* The predictor, which appears after the welcome page fades */}
        {showPredictor && <Predictor />}
        {showClassifier && <ImageUploaderPage />}

      </div>
    </>
  );
}

export default App;
