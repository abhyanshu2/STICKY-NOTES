import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import legacyMarkup from './legacy-template.html?raw';
import { startLegacyApp } from './legacy.js';
import './index.css';

function App() {
  const appRef = useRef(null);
  useEffect(() => {
    appRef.current.innerHTML = legacyMarkup;
    startLegacyApp();
  }, []);
  return <div ref={appRef} className="min-h-screen w-full" />;
}

createRoot(document.getElementById('root')).render(<App />);

