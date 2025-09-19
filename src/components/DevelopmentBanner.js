import React from 'react';
import '../styles/DevelopmentBanner.scss';

const DevelopmentBanner = () => {
  if (process.env.NODE_ENV !== 'development' || !process.env.REACT_APP_USE_MOCK_BACKEND) {
    return null;
  }

  return (
    <div className="development-banner">
      <div className="banner-content">
        <div className="banner-icon">🔧</div>
        <div className="banner-text">
          <strong>Development Mode:</strong> Using mock backend for testing
        </div>
        <div className="banner-features">
          • Simulated game state • Bot opponent • Timer countdown • Move validation
        </div>
      </div>
    </div>
  );
};

export default DevelopmentBanner;
