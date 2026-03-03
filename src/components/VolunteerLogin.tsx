import { useState } from 'react';
import React from 'react';
import { motion } from 'motion/react';
import { Shield, Phone, User, Loader2, ArrowRight } from 'lucide-react';
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
    <div className="max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[32px] shadow-xl border border-[#5A5A40]/10"
      >
        <div className="w-16 h-16 bg-[#5A5A40]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-[#5A5A40]" />
        </div>
        
        <h2 className="font-serif text-2xl font-bold text-center text-[#5A5A40] mb-2">
          {isRegistering ? 'স্বেচ্ছাসেবক নিবন্ধন' : 'স্বেচ্ছাসেবক লগইন'}
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          {isRegistering 
            ? 'আপনার এলাকার মানুষের পাশে দাঁড়াতে আজই যুক্ত হোন।' 
            : 'আপনার ড্যাশবোর্ডে প্রবেশ করতে ফোন নম্বর দিন।'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#5A5A40] mb-1 uppercase tracking-wider">নাম (Full Name)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="আপনার নাম লিখুন"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5A5A40] mb-1 uppercase tracking-wider">এলাকা (Area)</label>
                <input 
                  type="text" 
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="যেমন: ধানমন্ডি, ঢাকা"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-[#5A5A40] mb-1 uppercase tracking-wider">ফোন নম্বর (Phone Number)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="০১৭XXXXXXXX"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#5A5A40] text-white py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#4A4A30] transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isRegistering ? 'নিবন্ধন করুন' : 'লগইন করুন'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm font-medium text-[#5A5A40] hover:underline"
          >
            {isRegistering ? 'ইতিমধ্যে একাউন্ট আছে? লগইন করুন' : 'নতুন স্বেচ্ছাসেবক? নিবন্ধন করুন'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
