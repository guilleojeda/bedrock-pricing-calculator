import React from 'react';
import MainLayout from './layouts/MainLayout';
import CalculatorPage from './pages/CalculatorPage';
// Remove default App.css import if no longer needed, or keep if you add custom App-level styles
// import './App.css';

function App() {
  return (
    <MainLayout>
      <CalculatorPage />
    </MainLayout>
  );
}

export default App;
