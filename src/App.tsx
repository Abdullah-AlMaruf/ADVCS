import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Volunteer } from './types';
import Navbar from './components/Navbar';
import ReportForm from './components/ReportForm';
import VolunteerDashboard from './components/VolunteerDashboard';
import VolunteerLogin from './components/VolunteerLogin';
import { Toaster, toast } from 'sonner';

const socket = io();

export default function App() {
  const [user, setUser] = useState<Volunteer | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('sohayok_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    socket.on('new_report', (report) => {
      // Only show toast if user is a volunteer
      if (!user) return;

      const isUrgent = report.severity === 'critical' || report.severity === 'high';
      
      toast(isUrgent ? '🚨 EMERGENCY ALERT' : '⚠️ New Disaster Report', {
        description: `${report.type.toUpperCase()} in ${report.area}: ${report.description}`,
        duration: isUrgent ? 10000 : 5000,
        action: {
          label: 'View Dashboard',
          onClick: () => window.location.href = '/volunteer/dashboard'
        },
        className: isUrgent ? 'bg-red-600 text-white border-none' : '',
      });
    });

    return () => {
      socket.off('new_report');
    };
  }, [user]);

  const handleLogin = (volunteer: Volunteer) => {
    setUser(volunteer);
    localStorage.setItem('sohayok_user', JSON.stringify(volunteer));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sohayok_user');
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<ReportForm />} />
            <Route 
              path="/volunteer/login" 
              element={user ? <Navigate to="/volunteer/dashboard" /> : <VolunteerLogin onLogin={handleLogin} />} 
            />
            <Route 
              path="/volunteer/dashboard" 
              element={user ? <VolunteerDashboard user={user} /> : <Navigate to="/volunteer/login" />} 
            />
          </Routes>
        </main>
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}
