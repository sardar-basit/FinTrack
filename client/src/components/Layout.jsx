import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} />
      <main className="main-content">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
