import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.mustChangePassword) navigate('/change-password');
  }, [user, navigate]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`main-content ${!sidebarOpen ? 'full' : ''}`} style={{ marginLeft: !isMobile && sidebarOpen ? 'var(--sidebar-width)' : 0 }}>
        <Navbar toggleSidebar={() => setSidebarOpen(o => !o)} />
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
