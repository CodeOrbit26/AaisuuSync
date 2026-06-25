import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Topbar />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
