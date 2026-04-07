import { Link } from 'react-router-dom';
import { Shield, User, LogOut, AlertTriangle } from 'lucide-react';
import { Volunteer } from '../types';

interface NavbarProps {
  user: Volunteer | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between max-w-7xl">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-primary p-2.5 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-primary/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl font-black tracking-tighter text-secondary leading-none">SOHAYOK</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Relief Network</span>
          </div>
        </Link>

        <div className="flex items-center gap-10">
          <Link 
            to="/" 
            className="text-xs font-black text-slate-500 hover:text-primary transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            <AlertTriangle className="w-4 h-4" />
            Report
          </Link>
          
          {user ? (
            <div className="flex items-center gap-8">
              <Link 
                to="/volunteer/dashboard" 
                className="text-xs font-black text-slate-500 hover:text-primary transition-all flex items-center gap-2 uppercase tracking-widest"
              >
                <Shield className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="h-8 w-px bg-slate-100" />
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-black text-secondary">{user.name}</span>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-widest">{user.area}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6 text-secondary" />
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2.5 hover:bg-red-50 rounded-2xl transition-all text-red-500 hover:scale-110 active:scale-90"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <Link 
              to="/volunteer/login" 
              className="btn-primary !px-8 !py-3 !text-xs !rounded-xl"
            >
              Volunteer Portal
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
