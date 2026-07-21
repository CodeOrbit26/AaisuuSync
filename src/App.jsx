import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Accounts from './pages/Accounts/Accounts';
import LinkedInAutomation from './pages/LinkedInAutomation/LinkedInAutomation';
import ReelAutomation from './pages/ReelAutomation/ReelAutomation';
import YTAutomation from './pages/YTAutomation/YTAutomation';
import InstagramDM from './pages/InstagramDM/InstagramDM';
import Settings from './pages/Settings/Settings';
import UpgradePlan from './pages/UpgradePlan/UpgradePlan';
import GetHelp from './pages/GetHelp/GetHelp';
import LearnMore from './pages/LearnMore/LearnMore';
import Notifications from './pages/Notifications/Notifications';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import './App.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AuthRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Auth routes — outside Layout, no sidebar/topbar */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />

      {/* Protected app routes — inside Layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/linkedin-automation" element={<LinkedInAutomation />} />
        <Route path="/reel-automation" element={<ReelAutomation />} />
        <Route path="/yt-automation" element={<YTAutomation />} />
        <Route path="/instagram-dm" element={<InstagramDM />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/upgrade" element={<UpgradePlan />} />
        <Route path="/get-help" element={<GetHelp />} />
        <Route path="/learn-more" element={<LearnMore />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      {/* Catch-all → redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
