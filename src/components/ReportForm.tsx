import { useState } from 'react';
import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, MapPin, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DISASTER_TYPES = [
  { id: 'flood', label: 'বন্যা (Flood)', icon: '🌊' },
  { id: 'fire', label: 'আগুন (Fire)', icon: '🔥' },
  { id: 'cyclone', label: 'ঘূর্ণিঝড় (Cyclone)', icon: '🌪️' },
  { id: 'accident', label: 'দুর্ঘটনা (Accident)', icon: '🚑' },
  { id: 'other', label: 'অন্যান্য (Other)', icon: '⚠️' },
];

export default function ReportForm() {
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        toast.success('Location captured successfully');
      },
      () => {
        toast.error('Unable to retrieve your location');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !area || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          severity,
          area,
          description,
          lat: location?.lat,
          lng: location?.lng,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        toast.success('Report submitted successfully! Local volunteers have been notified.');
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white p-8 rounded-[32px] shadow-xl text-center border border-[#5A5A40]/10"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="font-serif text-2xl font-bold mb-4 text-[#5A5A40]">রিপোর্ট সফল হয়েছে!</h2>
        <p className="text-gray-600 mb-8">
          আপনার এলাকার স্বেচ্ছাসেবকদের জানানো হয়েছে। তারা দ্রুত আপনার সাথে যোগাযোগ করবে।
        </p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="bg-[#5A5A40] text-white px-8 py-3 rounded-full font-medium hover:bg-[#4A4A30] transition-all"
        >
          আরেকটি রিপোর্ট করুন
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="text-center mb-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
        >
          <AlertTriangle className="w-4 h-4" />
          Emergency Reporting System
        </motion.div>
        <h1 className="font-serif text-4xl font-bold text-[#5A5A40] mb-4">সাহায্য প্রয়োজন?</h1>
        <p className="text-gray-600">নিচের তথ্যগুলো পূরণ করুন। আপনার এলাকার স্বেচ্ছাসেবকরা দ্রুত ব্যবস্থা নেবে।</p>
      </header>

      <motion.form 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-[32px] shadow-xl border border-[#5A5A40]/10 space-y-6"
      >
        <div>
          <label className="block text-sm font-bold text-[#5A5A40] mb-3 uppercase tracking-wider">দুর্যোগের ধরন (Disaster Type)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DISASTER_TYPES.map((dt) => (
              <button
                key={dt.id}
                type="button"
                onClick={() => setType(dt.id)}
                className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${
                  type === dt.id 
                    ? 'border-[#5A5A40] bg-[#5A5A40]/5 shadow-inner' 
                    : 'border-gray-100 hover:border-[#5A5A40]/30 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{dt.icon}</span>
                <span className="text-xs font-bold">{dt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-[#5A5A40] mb-2 uppercase tracking-wider">তীব্রতা (Severity)</label>
            <select 
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all bg-white"
            >
              <option value="low">Low (স্বল্প)</option>
              <option value="medium">Medium (মাঝারি)</option>
              <option value="high">High (তীব্র)</option>
              <option value="critical">Critical (অত্যন্ত জরুরি)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#5A5A40] mb-2 uppercase tracking-wider">এলাকার নাম (Area Name)</label>
            <input 
              type="text" 
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="যেমন: ধানমন্ডি, ঢাকা"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#5A5A40] mb-2 uppercase tracking-wider">লোকেশন (Location)</label>
          <button
            type="button"
            onClick={handleGetLocation}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
              location 
                ? 'border-green-500 bg-green-50 text-green-700' 
                : 'border-dashed border-gray-300 hover:border-[#5A5A40] text-gray-500'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {location ? 'Location Captured' : 'Get Current Location'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#5A5A40] mb-2 uppercase tracking-wider">বিস্তারিত (Description)</label>
          <textarea 
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="পরিস্থিতি সম্পর্কে বিস্তারিত লিখুন..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#5A5A40] text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#4A4A30] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              রিপোর্ট পাঠান (Send Report)
            </>
          )}
        </button>
      </motion.form>
    </div>
  );
}
