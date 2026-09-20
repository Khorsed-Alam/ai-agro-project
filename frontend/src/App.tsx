import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/Layout';

// Auth pages (public)
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';

// App pages (protected)
import { Dashboard } from './pages/Dashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { FarmerDashboard } from './pages/FarmerDashboard';
import { MyFarm } from './pages/MyFarm';
import { Fields } from './pages/Fields';
import { Weather } from './pages/Weather';
import { AIAnalysis } from './pages/AIAnalysis';
import { DiseaseDetection } from './pages/DiseaseDetection';
import { IrrigationPlanner } from './pages/IrrigationPlanner';
import { Algorithms } from './pages/Algorithms';
import { Resources } from './pages/Resources';
import { History } from './pages/History';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Public auth routes ───────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ── Protected app routes ─────────────────────────────────── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Primary AgroAI Dashboard (Restored from Stitch design) */}
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Extension Role Workspaces */}
            <Route path="owner-dashboard" element={<OwnerDashboard />} />
            <Route path="farmer-dashboard" element={<FarmerDashboard />} />

            <Route path="my-farm" element={<MyFarm />} />
            <Route path="fields" element={<Fields />} />
            <Route path="weather" element={<Weather />} />

            {/* AI & Analysis */}
            <Route path="ai-analysis" element={<AIAnalysis />} />
            <Route path="disease-detection" element={<DiseaseDetection />} />
            <Route path="irrigation-planner" element={<IrrigationPlanner />} />
            <Route path="algorithms" element={<Algorithms />} />

            {/* Management */}
            <Route path="resources" element={<Resources />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />

            {/* Backward compatibility redirects */}
            <Route path="farm" element={<Navigate to="/my-farm" replace />} />
            <Route path="irrigation" element={<Navigate to="/irrigation-planner" replace />} />

            {/* Catch-all → dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Root catch-all — redirect to login or dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
