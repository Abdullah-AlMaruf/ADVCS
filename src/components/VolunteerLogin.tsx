import { useState } from 'react';
import React from 'react';
import { motion } from 'motion/react';
import { Shield, Loader2, MapPin, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { Volunteer } from '../types';
import { auth, db, googleProvider, signInWithPopup, OperationType, handleFirestoreError } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface VolunteerLoginProps {
  onLogin: (volunteer: Volunteer) => void;
}

export default function VolunteerLogin({ onLogin }: VolunteerLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [area, setArea] = useState('');
  const [phone, setPhone] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const volunteerDoc = await getDoc(doc(db, 'volunteers', user.uid));
      
      if (volunteerDoc.exists()) {
        const volunteerData = volunteerDoc.data() as Volunteer;
        onLogin(volunteerData);
        toast.success('Welcome back, ' + user.displayName);
      } else {
        // Need to register
        setIsRegistering(true);
        toast.info('Please complete your profile to join the volunteer network.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !phone) {
      toast.error('Please provide your area and phone number');
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    setIsLoading(true);
    try {
      const volunteerData: Volunteer = {
        uid: user.uid,
        name: user.displayName || 'Anonymous',
        phone: phone,
        area: area,
        status: 'idle',
      };

      await setDoc(doc(db, 'volunteers', user.uid), volunteerData);
      onLogin(volunteerData);
      toast.success('Registration successful! Welcome to the force.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'volunteers');
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistering) {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 rounded-[48px] relative overflow-hidden"
        >
          <h2 className="text-4xl font-black text-center text-secondary mb-8 tracking-tighter">COMPLETE PROFILE</h2>
          <form onSubmit={handleCompleteProfile} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Assigned Area</label>
              <input 
                type="text" 
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Dhanmondi, Dhaka"
                className="input-field"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Phone Number</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full !py-5 !text-lg"
            >
              {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : 'JOIN NOW'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-12 rounded-[48px] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-primary/10 rotate-6">
          <Shield className="w-12 h-12 text-primary" />
        </div>
        
        <h2 className="text-4xl font-black text-center text-secondary mb-4 tracking-tighter">
          VOLUNTEER LOGIN
        </h2>
        <p className="text-center text-slate-400 mb-12 text-sm font-bold uppercase tracking-[0.2em]">
          Access your operational command.
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="btn-primary w-full !py-5 !text-lg flex items-center justify-center gap-4"
        >
          {isLoading ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <>
              <LogIn className="w-6 h-6" />
              LOGIN WITH GOOGLE
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
