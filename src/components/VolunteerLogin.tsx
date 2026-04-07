import { useState } from 'react';
import React from 'react';
import { motion } from 'motion/react';
import { Shield, Phone, User, Loader2, ArrowRight, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Volunteer } from '../types';

interface VolunteerLoginProps {
  onLogin: (volunteer: Volunteer) => void;
}

export default function VolunteerLogin({ onLogin }: VolunteerLoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || (isRegistering && (!formData.name || !formData.area))) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isRegistering ? '/api/volunteers/register' : '/api/volunteers/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        onLogin(data);
        toast.success(isRegistering ? 'Registration successful!' : 'Welcome back!');
      } else {
        toast.error(data.error || 'Authentication failed');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-12 rounded-[48px] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-primary/10 rotate-6 group hover:rotate-12 transition-transform duration-500">
          <Shield className="w-12 h-12 text-primary" />
        </div>
        
        <h2 className="text-4xl font-black text-center text-secondary mb-4 tracking-tighter">
          {isRegistering ? 'JOIN THE FORCE' : 'WELCOME BACK'}
        </h2>
        <p className="text-center text-slate-400 mb-12 text-sm font-bold uppercase tracking-[0.2em]">
          {isRegistering 
            ? 'Become a rapid responder today.' 
            : 'Access your operational command.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {isRegistering && (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="input-field pl-14"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Assigned Area</label>
                <div className="relative group">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g. Dhanmondi, Dhaka"
                    className="input-field pl-14"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Phone Number</label>
            <div className="relative group">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="017XXXXXXXX"
                className="input-field pl-14"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full !py-5 !text-lg group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            {isLoading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <>
                {isRegistering ? 'INITIALIZE ACCOUNT' : 'SECURE LOGIN'}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-500" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 pt-10 border-t border-slate-100 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-[0.3em] transition-colors"
          >
            {isRegistering ? 'Already have an account? Login' : 'New volunteer? Register here'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
