import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Farm } from './pages/Farm';
import { Fields } from './pages/Fields';
import { AIAnalysis } from './pages/AIAnalysis';
import { Irrigation } from './pages/Irrigation';
import { DiseaseDetection } from './pages/DiseaseDetection';
import { Algorithms } from './pages/Algorithms';
import { History } from './pages/History';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="farm" element={<Farm />} />
          <Route path="fields" element={<Fields />} />
          <Route path="ai-analysis" element={<AIAnalysis />} />
          <Route path="irrigation" element={<Irrigation />} />
          <Route path="disease-detection" element={<DiseaseDetection />} />
          <Route path="algorithms" element={<Algorithms />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
