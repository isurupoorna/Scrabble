import React from 'react';
import '../styles/ErrorBoundary.scss';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In a real app, you might want to send this to an error reporting service
    // reportErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">
              <div className="error-symbol">⚠️</div>
            </div>
            
            <div className="error-content">
              <h1>Oops! Something went wrong</h1>
              <p className="error-description">
                We're sorry, but something unexpected happened. The game encountered an error and needs to be restarted.
              </p>
              
              <div className="error-actions">
                <button 
                  className="btn btn-primary"
                  onClick={this.handleReload}
                >
                  Reload Game
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={this.handleReset}
                >
                  Try Again
                </button>
              </div>

              <div className="error-help">
                <h3>What you can try:</h3>
                <ul>
                  <li>Refresh the page to restart the game</li>
                  <li>Check your internet connection</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Try using a different browser</li>
                </ul>
              </div>

              {/* Technical error details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="error-details">
                  <summary>Technical Details (Development Only)</summary>
                  <div className="error-stack">
                    <h4>Error Message:</h4>
                    <pre>{this.state.error.toString()}</pre>
                    
                    {this.state.errorInfo && (
                      <>
                        <h4>Component Stack:</h4>
                        <pre>{this.state.errorInfo.componentStack}</pre>
                      </>
                    )}
                    
                    {this.state.error.stack && (
                      <>
                        <h4>Error Stack:</h4>
                        <pre>{this.state.error.stack}</pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
          
          <div className="error-footer">
            <p>
              If this problem persists, please contact support with the error details above.
            </p>
            <div className="error-id">
              Error ID: {Date.now().toString(36)}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;