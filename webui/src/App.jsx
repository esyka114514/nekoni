import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Jobs from './components/Jobs';
import Services from './components/Services';
import Login from './components/Login';
import NProgress from './components/NProgress';
import { getProjectInfo } from './api';

function Navbar() {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <Link to="/">Nekoni WebUI</Link>
        </div>
        <div className="navbar-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>监控面板</Link>
          <Link to="/jobs" className={location.pathname === '/jobs' ? 'active' : ''}>定时任务</Link>
          <Link to="/services" className={location.pathname === '/services' ? 'active' : ''}>HTTP服务</Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const [projectInfo, setProjectInfo] = useState({ name: 'Nekoni', version: '', github: '' });

  useEffect(() => {
    getProjectInfo().then(res => setProjectInfo(res.data)).catch(() => {});
  }, []);

  return (
    <footer className="footer">
      <div className="footer-content">
        <span>{projectInfo.name} v{projectInfo.version}</span>
        <a href={projectInfo.github} target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </footer>
  );
}

function AppContent() {
  const [progressVisible, setProgressVisible] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setProgressVisible(true);
    
    const timer = setTimeout(() => setProgressVisible(false), 300);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <NProgress visible={progressVisible} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <div className="app">
            <Navbar />
            <div className="main-content">
              <div className="container">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/services" element={<Services />} />
                </Routes>
              </div>
            </div>
            <Footer />
          </div>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
