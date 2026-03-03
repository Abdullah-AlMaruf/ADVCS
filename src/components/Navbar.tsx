import { Link } from 'react-router-dom';
import { Shield, User, LogOut, AlertTriangle } from 'lucide-react';
import { Volunteer } from '../types';

interface NavbarProps {
  user: Volunteer | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-[#5A5A40]/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-[#5A5A40] p-1.5 rounded-lg group-hover:scale-110 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-[#5A5A40]">Sohayok</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link 
            to="/" 
            className="text-sm font-medium hover:text-[#5A5A40] transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4" />
            Report Disaster
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                to="/volunteer/dashboard" 
                className="text-sm font-medium hover:text-[#5A5A40] transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#5A5A40]/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-[#5A5A40]" />
                </div>
                <span className="text-sm font-semibold hidden sm:inline">{user.name}</span>
                <button 
                  onClick={onLogout}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <Link 
              to="/volunteer/login" 
              className="bg-[#5A5A40] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#4A4A30] transition-all shadow-sm hover:shadow-md"
            >
              Volunteer Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
