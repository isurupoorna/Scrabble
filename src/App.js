import React from 'react';
import ScrabbleGame from './components/ScrabbleGame';
import ErrorBoundary from './components/ErrorBoundary';
import DevelopmentBanner from './components/DevelopmentBanner';
import './styles/App.scss';

function App() {
  return (
    <div className="App">
      <DevelopmentBanner />
      <ErrorBoundary>
        <header className="app-header">
          <h1>Scrabble Game</h1>
        </header>
        <main className="app-main">
          <ScrabbleGame />
        </main>
      </ErrorBoundary>
    </div>
  );
}

export default App;