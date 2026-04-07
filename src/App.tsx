import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Volunteer, DisasterReport } from './types';
import Navbar from './components/Navbar';
import ReportForm from './components/ReportForm';
import VolunteerDashboard from './components/VolunteerDashboard';
import VolunteerLogin from './components/VolunteerLogin';
import { Toaster, toast } from 'sonner';
import { auth, db, onAuthStateChanged, OperationType, handleFirestoreError } from './firebase';
import { collection, query, orderBy, onSnapshot, limit, doc, getDoc } from 'firebase/firestore';

function NotificationManager({ user }: { user: Volunteer | null }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const report = { id: change.doc.id, ...change.doc.data() } as DisasterReport;
          
          // Only notify if it's a new report (not just initial load)
          const now = Date.now();
          const reportTime = report.createdAt?.toMillis ? report.createdAt.toMillis() : 0;
          
          if (now - reportTime < 10000) { // Within last 10 seconds
            const isUrgent = report.severity === 'critical' || report.severity === 'high';
            
            toast(isUrgent ? '🚨 EMERGENCY ALERT' : '⚠️ New Disaster Report', {
              description: `${report.type.toUpperCase()} in ${report.area}: ${report.description}`,
              duration: isUrgent ? 15000 : 8000,
              action: report.lat && report.lng ? {
                label: 'View Map',
                onClick: () => {
                  navigate(`/volunteer/dashboard?viewMap=${report.id}`);
                }
              } : {
                label: 'View Dashboard',
                onClick: () => {
                  navigate('/volunteer/dashboard');
                }
              },
              className: isUrgent ? 'bg-red-600 text-white border-none shadow-2xl' : 'bg-white text-secondary border-slate-100 shadow-xl',
            });
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    return () => unsubscribe();
  }, [user, navigate]);

  return null;
}

export default function App() {
  const [user, setUser] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const volunteerDoc = await getDoc(doc(db, 'volunteers', firebaseUser.uid));
          if (volunteerDoc.exists()) {
            setUser(volunteerDoc.data() as Volunteer);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching volunteer profile:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (volunteer: Volunteer) => {
    setUser(volunteer);
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans">
        <NotificationManager user={user} />
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
