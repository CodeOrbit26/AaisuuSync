import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Accounts from './pages/Accounts/Accounts';
import LinkedInAutomation from './pages/LinkedInAutomation/LinkedInAutomation';
import ReelAutomation from './pages/ReelAutomation/ReelAutomation';
import YTAutomation from './pages/YTAutomation/YTAutomation';
import InstagramDM from './pages/InstagramDM/InstagramDM';
import Settings from './pages/Settings/Settings';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/linkedin-automation" element={<LinkedInAutomation />} />
        <Route path="/reel-automation" element={<ReelAutomation />} />
        <Route path="/yt-automation" element={<YTAutomation />} />
        <Route path="/instagram-dm" element={<InstagramDM />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

