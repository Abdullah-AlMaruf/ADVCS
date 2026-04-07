import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Loader2, MapPin, LogIn, Mail, Phone, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Volunteer } from '../types';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  OperationType,
  handleFirestoreError,
  User
} from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface VolunteerLoginProps {
  onLogin: (volunteer: Volunteer) => void;
}

type AuthMethod = 'google' | 'email';

export default function VolunteerLogin({ onLogin }: VolunteerLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('google');
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Profile Data
  const [area, setArea] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileName, setProfileName] = useState('');

  // Email/Password Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // No cleanup needed currently
  }, []);

  const checkProfileAndLogin = async (user: User) => {
    const volunteerDoc = await getDoc(doc(db, 'volunteers', user.uid));
    if (volunteerDoc.exists()) {
      const volunteerData = volunteerDoc.data() as Volunteer;
      onLogin(volunteerData);
      toast.success('Welcome back, ' + (volunteerData.name || user.displayName || user.email || user.phoneNumber));
    } else {
      setIsRegistering(true);
      setProfileName(user.displayName || '');
      setProfilePhone(user.phoneNumber || '');
      toast.info('Please complete your profile to join the volunteer network.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await checkProfileAndLogin(result.user);
    } catch (error) {
      console.error('Google Login error:', error);
      toast.error('Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      if (isLoginMode) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await checkProfileAndLogin(result.user);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await checkProfileAndLogin(result.user);
      }
    } catch (error: any) {
      console.error('Email Auth error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !profilePhone || !profileName) {
      toast.error('Please fill in all profile fields');
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    setIsLoading(true);
    try {
      const volunteerData: Volunteer = {
        uid: user.uid,
        name: profileName,
        phone: profilePhone,
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Full Name</label>
              <div className="relative group">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
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
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Dhanmondi, Dhaka"
                  className="input-field pl-14"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="input-field pl-14"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full !py-5 !text-lg"
            >
              {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : 'INITIALIZE ACCOUNT'}
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

        {/* Auth Method Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
          <button
            onClick={() => setAuthMethod('google')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMethod === 'google' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
          >
            Google
          </button>
          <button
            onClick={() => setAuthMethod('email')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMethod === 'email' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
          >
            Email
          </button>
        </div>

        <AnimatePresence mode="wait">
          {authMethod === 'google' && (
            <motion.div
              key="google"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
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
                    CONTINUE WITH GOOGLE
                  </>
                )}
              </button>
            </motion.div>
          )}

          {authMethod === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <form onSubmit={handleEmailAuth} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="volunteer@example.com"
                      className="input-field pl-14"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pl-14"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full !py-5 !text-lg flex items-center justify-center gap-4"
                >
                  {isLoading ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <>
                      {isLoginMode ? 'SECURE LOGIN' : 'CREATE ACCOUNT'}
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </form>
              <div className="text-center">
                <button
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-widest transition-colors"
                >
                  {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

