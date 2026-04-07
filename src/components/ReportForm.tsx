import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, MapPin, Send, CheckCircle2, Loader2, Search, Globe, ChevronRight, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleGenAI, Type } from "@google/genai";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsFetchingSuggestions(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Provide a list of 5 likely location suggestions (city, area, or landmark names) that start with or match: "${searchQuery}". 
          Return ONLY a JSON array of strings.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        });

        const text = response.text;
        if (text) {
          setSuggestions(JSON.parse(text));
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Suggestions error:', error);
      } finally {
        setIsFetchingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 600);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchLocation = async (e?: React.FormEvent, queryOverride?: string) => {
    if (e) e.preventDefault();
    const query = queryOverride || searchQuery;
    
    if (!query.trim()) {
      toast.error('Please enter a location to search');
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find the precise latitude and longitude for the location: "${query}". 
        Return ONLY a JSON object with "lat" and "lng" keys. 
        If it's a general area, provide the center coordinates.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER, description: "Latitude coordinate" },
              lng: { type: Type.NUMBER, description: "Longitude coordinate" }
            },
            required: ["lat", "lng"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('No response from AI');
      
      const result = JSON.parse(text);
      setLocation({ lat: result.lat, lng: result.lng });
      setSearchQuery(query);
      // Auto-populate Area Name if it's empty
      if (!area) {
        setArea(query);
      }
      toast.success(`Location identified: ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Could not pinpoint that location. Please try a more specific address.');
    } finally {
      setIsSearching(false);
    }
  };

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
        className="max-w-md mx-auto glass-card p-12 rounded-[48px] text-center"
      >
        <div className="w-28 h-28 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-inner rotate-6">
          <CheckCircle2 className="w-14 h-14 text-emerald-500" />
        </div>
        <h2 className="text-4xl font-black mb-4 text-secondary tracking-tighter">REPORT SENT!</h2>
        <p className="text-slate-500 mb-12 leading-relaxed font-medium">
          Your alert has been broadcasted to all local responders. Stay safe and wait for contact.
        </p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="btn-primary w-full shadow-2xl"
        >
          Submit Another Alert
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <header className="text-center mb-20">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-3 bg-primary/10 text-primary px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] mb-8 border border-primary/20"
        >
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          Live Emergency Network
        </motion.div>
        <h1 className="text-7xl font-black text-secondary mb-8 tracking-tighter leading-[0.9]">
          NEED <span className="text-primary">HELP?</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-xl mx-auto leading-relaxed font-medium">
          Fill out the form below to alert our rapid response volunteer network in your area.
        </p>
      </header>

      <motion.form 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSubmit}
        className="glass-card p-12 rounded-[48px] space-y-12 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center text-sm font-black shadow-lg">01</div>
            <label className="text-xs font-black text-secondary uppercase tracking-[0.3em]">Select Emergency Type</label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {DISASTER_TYPES.map((dt) => (
              <button
                key={dt.id}
                type="button"
                onClick={() => setType(dt.id)}
                className={`p-8 rounded-[32px] border-4 transition-all duration-500 text-center flex flex-col items-center gap-4 group relative overflow-hidden ${
                  type === dt.id 
                    ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10 scale-105 z-10' 
                    : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white'
                }`}
              >
                <span className="text-4xl group-hover:scale-125 transition-transform duration-500">{dt.icon}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${type === dt.id ? 'text-primary' : 'text-slate-400'}`}>
                  {dt.id}
                </span>
                {type === dt.id && (
                  <motion.div 
                    layoutId="active-bg"
                    className="absolute inset-0 bg-primary/5 -z-10"
                  />
                )}
              </button>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-12">
          <section className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center text-sm font-black shadow-lg">02</div>
                <label className="text-xs font-black text-secondary uppercase tracking-[0.3em]">Severity Level</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['low', 'medium', 'high', 'critical'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`px-4 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      severity === s 
                        ? 'bg-secondary text-white border-secondary shadow-xl' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center text-sm font-black shadow-lg">03</div>
                <label className="text-xs font-black text-secondary uppercase tracking-[0.3em]">Area Name</label>
              </div>
              <input 
                type="text" 
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Dhanmondi, Dhaka"
                className="input-field shadow-sm"
              />
            </div>
          </section>

          <section className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center text-sm font-black shadow-lg">04</div>
                <label className="text-xs font-black text-secondary uppercase tracking-[0.3em]">GPS Location</label>
              </div>
              
              <div className="space-y-4">
                <div className="relative group" ref={suggestionRef}>
                  <div className="relative">
                    <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isFetchingSuggestions ? 'text-primary animate-pulse' : 'text-slate-300 group-focus-within:text-primary'}`} />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation(e)}
                      placeholder="Search location manually..."
                      className="input-field pl-14 pr-24 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={(e) => handleSearchLocation(e)}
                      disabled={isSearching || !searchQuery.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SEARCH'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[1000]"
                      >
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSearchLocation(undefined, suggestion)}
                            className="w-full px-6 py-4 text-left hover:bg-slate-50 flex items-center justify-between group/item transition-colors border-b border-slate-50 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 text-slate-300 group-hover/item:text-primary transition-colors" />
                              <span className="text-sm font-bold text-secondary">{suggestion}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-200 group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px bg-slate-100 flex-1" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">OR</span>
                  <div className="h-px bg-slate-100 flex-1" />
                </div>

                <button
                  type="button"
                  onClick={handleGetLocation}
                  className={`w-full flex items-center justify-center gap-4 px-8 py-5 rounded-2xl border-2 transition-all duration-500 font-black text-xs uppercase tracking-widest shadow-sm ${
                    location 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                      : 'border-slate-200 bg-white hover:border-primary text-slate-500'
                  }`}
                >
                  <MapPin className={`w-5 h-5 ${location ? 'animate-bounce' : ''}`} />
                  {location ? 'COORDINATES SECURED' : 'ACQUIRE GPS SIGNAL'}
                </button>

                {location && (
                  <div className="flex items-center justify-between gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setLocation(null);
                        setSearchQuery('');
                        setArea('');
                      }}
                      className="text-[8px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                    >
                      CLEAR
                    </button>
                  </div>
                )}

                <div className="h-64 rounded-3xl overflow-hidden border-2 border-slate-100 shadow-inner relative z-0">
                  <MapContainer 
                    center={location ? [location.lat, location.lng] : [23.8103, 90.4125]} 
                    zoom={location ? 13 : 7} 
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {location && (
                      <>
                        <Marker position={[location.lat, location.lng]} />
                        <MapUpdater center={[location.lat, location.lng]} />
                      </>
                    )}
                    <MapEvents onLocationSelect={(lat, lng) => setLocation({ lat, lng })} />
                  </MapContainer>
                  {!location && (
                    <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-[400]">
                      <div className="bg-white/90 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                        <Navigation className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Click map to pinpoint location</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center text-sm font-black shadow-lg">05</div>
                <label className="text-xs font-black text-secondary uppercase tracking-[0.3em]">Situation Details</label>
              </div>
              <textarea 
                rows={1}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the situation briefly..."
                className="input-field resize-none shadow-sm"
              />
            </div>
          </section>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full !py-6 !text-2xl group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          {isSubmitting ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <>
              <Send className="w-7 h-7 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500" />
              BROADCAST EMERGENCY ALERT
            </>
          )}
        </button>
      </motion.form>
    </div>
  );
}
