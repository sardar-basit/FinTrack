import { Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getInitials } from '../utils/format';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <button className="btn btn-ghost btn-sm" onClick={toggleSidebar} style={{ padding: '8px', width: 36, height: 36 }}><Menu size={20} /></button>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={toggleTheme} style={{ width: 36, height: 36, padding: 0 }}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>
        <button className="btn btn-ghost btn-sm" style={{ width: 36, height: 36, padding: 0 }} onClick={() => navigate('/profile')}>
          <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem', background: isAdmin ? '#7c3aed' : '#10b981', cursor: 'pointer' }}>{getInitials(user?.name)}</div>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
