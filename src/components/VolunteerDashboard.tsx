import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Activity,
  Users,
  ChevronRight,
  Filter,
  Search,
  RefreshCcw,
  Navigation,
  Trash2,
  Edit2,
  X,
  Map as MapIcon,
  Layers
} from 'lucide-react';
import { DisasterReport, Volunteer } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
import 'leaflet/dist/leaflet.css';
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const socket = io();

interface VolunteerDashboardProps {
  user: Volunteer;
}

interface EditModalProps {
  report: DisasterReport;
  onClose: () => void;
  onSave: (updated: Partial<DisasterReport>) => void;
}

function EditReportModal({ report, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState({
    type: report.type,
    severity: report.severity,
    area: report.area,
    description: report.description,
    status: report.status
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
          <div>
            <h3 className="text-3xl font-bold">Edit Report</h3>
            <p className="text-white/60 text-xs uppercase tracking-widest mt-1">Reference ID: #{report.id}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-10 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Disaster Type</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                className="input-field appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%234A4A38%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:16px_16px] bg-[right_1rem_center] bg-no-repeat"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="input-field appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%234A4A38%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:16px_16px] bg-[right_1rem_center] bg-no-repeat"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Area</label>
            <input
              type="text"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-4 pt-6">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              className="btn-primary flex-1"
            >
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface DeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmationModal({ onClose, onConfirm }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden p-10 text-center"
      >
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-inner">
          <Trash2 className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-3xl font-bold text-primary mb-3">Delete Report?</h3>
        <p className="text-secondary mb-10 leading-relaxed font-serif italic">"This action cannot be undone. The report will be permanently removed from the system."</p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-8 py-3.5 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200 active:scale-95"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface MapModalProps {
  report: DisasterReport;
  onClose: () => void;
}

function ReportMapModal({ report, onClose }: MapModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-secondary text-white">
          <div>
            <h3 className="text-3xl font-bold uppercase tracking-tighter">Location Map</h3>
            <p className="text-white/60 text-xs uppercase tracking-widest mt-1">{report.type} in {report.area}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="h-[500px] relative z-0">
          <MapContainer
            center={[report.lat!, report.lng!]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[report.lat!, report.lng!]}>
              <Popup>
                <div className="font-bold">{report.type}</div>
                <div className="text-xs">{report.area}</div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
        <div className="p-6 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="btn-secondary">Close Map</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function VolunteerDashboard({ user }: VolunteerDashboardProps) {
  const [reports, setReports] = useState<DisasterReport[]>([]);
  const [stats, setStats] = useState({ totalReports: 0, activeVolunteers: 0, completedTasks: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingReport, setEditingReport] = useState<DisasterReport | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.8103, 90.4125]);
  const [mapZoom, setMapZoom] = useState(7);
  const [viewingMapReport, setViewingMapReport] = useState<DisasterReport | null>(null);

  const fetchData = async () => {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/stats')
      ]);
      const reportsData = await reportsRes.json();
      const statsData = await statsRes.json();
      setReports(reportsData);
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Handle viewMap query parameter
    const params = new URLSearchParams(window.location.search);
    const viewMapId = params.get('viewMap');
    if (viewMapId) {
      // We need to wait for reports to be loaded
    }

    socket.on('new_report', (report) => {
      setReports(prev => [report, ...prev]);
      setStats(prev => ({ ...prev, totalReports: prev.totalReports + 1 }));
    });

    socket.on('report_updated', (updatedReport) => {
      setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    });

    socket.on('report_deleted', (reportId) => {
      setReports(prev => prev.filter(r => r.id !== reportId));
    });

    socket.on('stats_updated', (newStats) => {
      setStats(newStats);
    });

    return () => {
      socket.off('new_report');
      socket.off('report_updated');
      socket.off('report_deleted');
      socket.off('stats_updated');
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewMapId = params.get('viewMap');
    if (viewMapId && reports.length > 0) {
      const report = reports.find(r => r.id === parseInt(viewMapId));
      if (report && report.lat && report.lng) {
        setViewingMapReport(report);
        // Clear the query parameter without refreshing
        window.history.replaceState({}, '', '/volunteer/dashboard');
      }
    }
  }, [reports]);

  const handleAction = async (reportId: number, status: string) => {
    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportId,
          volunteer_id: user.id,
          status
        }),
      });

      if (response.ok) {
        toast.success(`Task status updated to ${status}`);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleDelete = async (reportId: number) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Report deleted successfully');
        setReports(prev => prev.filter(r => r.id !== reportId));
        setDeletingReportId(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete report');
      }
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const handleUpdate = async (reportId: number, updatedData: Partial<DisasterReport>) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        toast.success('Report updated successfully');
        setEditingReport(null);
      }
    } catch (error) {
      toast.error('Failed to update report');
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'active': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-16 py-12 px-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <Activity className="w-3 h-3" />
            Operational Command
          </motion.div>
          <h1 className="text-7xl font-black text-secondary tracking-tighter leading-[0.8]">
            VOLUNTEER <span className="text-primary">HUB</span>
          </h1>
          <p className="text-xl text-slate-400 font-medium">Real-time coordination for rapid disaster response.</p>
        </div>
        <div className="flex items-center gap-6 bg-white p-4 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center shadow-xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="pr-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Authenticated As</p>
            <p className="text-lg font-black text-secondary">{user.name}</p>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">{user.area} Sector</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: 'Active Alerts', value: stats.totalReports, icon: AlertTriangle, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Responders', value: stats.activeVolunteers, icon: Users, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Resolved', value: stats.completedTasks, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-10 rounded-[48px] flex items-center gap-8 group hover:scale-[1.05] transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
            <div className={`w-20 h-20 rounded-3xl ${stat.bg} flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-500`}>
              <stat.icon className={`w-10 h-10 ${stat.color}`} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
              <p className="text-5xl font-black text-secondary tracking-tighter">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="glass-card rounded-[56px] overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-slate-50/30">
          <div className="flex items-center gap-6">
            <h2 className="text-4xl font-black text-secondary tracking-tighter">LIVE FEED</h2>
            <button
              onClick={fetchData}
              className="p-3.5 bg-white hover:bg-primary hover:text-white rounded-2xl transition-all text-slate-400 shadow-xl shadow-slate-200/50 active:rotate-180 duration-700"
              title="Refresh Feed"
            >
              <RefreshCcw className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex bg-white p-1.5 rounded-2xl border-2 border-slate-100 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                  viewMode === 'list' ? 'bg-secondary text-white shadow-2xl' : 'text-slate-400 hover:text-secondary hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3 h-3" />
                List View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                  viewMode === 'map' ? 'bg-secondary text-white shadow-2xl' : 'text-slate-400 hover:text-secondary hover:bg-slate-50'
                }`}
              >
                <MapIcon className="w-3 h-3" />
                Map View
              </button>
            </div>

            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search area or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-8 py-4 rounded-2xl border-2 border-slate-100 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary/20 w-full md:w-96 bg-white transition-all shadow-sm"
              />
            </div>
            <div className="flex bg-white p-1.5 rounded-2xl border-2 border-slate-100 shadow-sm">
              {(['all', 'pending', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    filter === f ? 'bg-secondary text-white shadow-2xl' : 'text-slate-400 hover:text-secondary hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          <AnimatePresence mode="wait">
            {viewMode === 'map' ? (
              <motion.div
                key="map-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[600px] relative z-0"
              >
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapUpdater center={mapCenter} zoom={mapZoom} />
                  <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                    <button
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            setMapCenter([pos.coords.latitude, pos.coords.longitude]);
                            setMapZoom(13);
                          });
                        }
                      }}
                      className="p-3 bg-white hover:bg-primary hover:text-white rounded-2xl shadow-2xl border border-slate-100 transition-all group"
                      title="My Location"
                    >
                      <Navigation className="w-5 h-5 group-active:scale-90 transition-transform" />
                    </button>
                    <button
                      onClick={() => {
                        setMapCenter([23.8103, 90.4125]);
                        setMapZoom(7);
                      }}
                      className="p-3 bg-white hover:bg-secondary hover:text-white rounded-2xl shadow-2xl border border-slate-100 transition-all group"
                      title="Reset View"
                    >
                      <Layers className="w-5 h-5 group-active:scale-90 transition-transform" />
                    </button>
                  </div>
                  {filteredReports.filter(r => r.lat && r.lng).map(report => (
                    <Marker
                      key={report.id}
                      position={[report.lat!, report.lng!]}
                      eventHandlers={{
                        click: () => {
                          setMapCenter([report.lat!, report.lng!]);
                          setMapZoom(15);
                        }
                      }}
                    >
                      <Popup className="custom-popup">
                        <div className="p-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${
                              report.severity === 'critical' ? 'bg-red-500' :
                              report.severity === 'high' ? 'bg-orange-500' :
                              'bg-blue-500'
                            }`} />
                            <h4 className="font-black text-secondary uppercase tracking-tighter">{report.type}</h4>
                          </div>
                          <p className="text-xs font-bold text-slate-500">{report.area}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-2">{report.description}</p>
                          <div className="pt-2 flex gap-2">
                            <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                            <button
                              onClick={() => {
                                setViewMode('list');
                                setSearchQuery(report.area);
                              }}
                              className="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-primary text-white hover:bg-primary-dark transition-colors"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </motion.div>
            ) : (
              <motion.div
                key="list-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {isLoading ? (
                  <div className="p-40 text-center text-slate-300">
                    <Activity className="w-16 h-16 animate-spin mx-auto mb-8 opacity-20" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs">Synchronizing Data...</p>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="p-40 text-center text-slate-300">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                      <Search className="w-10 h-10 opacity-20" />
                    </div>
                    <p className="font-black uppercase tracking-[0.3em] text-xs">No matching signals found.</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <motion.div
                      key={report.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-10 hover:bg-slate-50/50 transition-all group relative overflow-hidden"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-10">
                        <div className="flex gap-8">
                          <button
                            onClick={() => report.lat && report.lng && setViewingMapReport(report)}
                            className={`w-20 h-20 rounded-[32px] flex items-center justify-center shrink-0 border-4 ${getStatusColor(report.status)} shadow-2xl group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 ${report.lat && report.lng ? 'cursor-pointer' : 'cursor-default'}`}
                            title={report.lat && report.lng ? "View on Map" : ""}
                          >
                            <AlertTriangle className="w-10 h-10" />
                          </button>
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-4">
                              <h3 className="text-3xl font-black text-secondary tracking-tighter capitalize">{report.type}</h3>
                              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-2 ${getStatusColor(report.status)}`}>
                                {report.status}
                              </span>
                              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-2 ${
                                report.severity === 'critical' ? 'bg-red-50 text-red-600 border-red-100' :
                                report.severity === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                'bg-slate-50 text-slate-500 border-slate-100'
                              }`}>
                                {report.severity}
                              </span>
                              {report.area === user.area && (
                                <span className="bg-primary text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20">
                                  Sector Priority
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-8 text-xs font-black text-slate-400 uppercase tracking-widest">
                              <span className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                {report.area}
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                {formatDistanceToNow(new Date(report.created_at))} ago
                              </span>
                            </div>
                            <p className="text-slate-500 leading-relaxed max-w-3xl text-lg font-medium">{report.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 self-end xl:self-center">
                          {/* Admin Controls */}
                          <div className="flex gap-3 mr-6 pr-6 border-r-2 border-slate-100">
                            <button
                              onClick={() => setEditingReport(report)}
                              className="p-4 bg-white hover:bg-blue-50 text-blue-500 rounded-2xl transition-all hover:scale-110 active:scale-90 shadow-sm border border-slate-100"
                              title="Edit Report"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setDeletingReportId(report.id)}
                              className="p-4 bg-white hover:bg-red-50 text-red-500 rounded-2xl transition-all hover:scale-110 active:scale-90 shadow-sm border border-slate-100"
                              title="Delete Report"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          {report.status === 'pending' && (
                            <button
                              onClick={() => handleAction(report.id, 'accepted')}
                              className="btn-primary !px-8 !py-4 !text-xs group/btn shadow-2xl"
                            >
                              DEPLOY TO SITE
                              <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform duration-500" />
                            </button>
                          )}
                          {report.status === 'active' && (
                            <div className="flex gap-4">
                              <button
                                onClick={() => handleAction(report.id, 'helping')}
                                className="px-8 py-4 rounded-2xl bg-accent text-white text-xs font-black uppercase tracking-widest hover:bg-accent/90 transition-all shadow-2xl shadow-accent/30 flex items-center gap-3 active:scale-95"
                              >
                                <Activity className="w-5 h-5" />
                                Assisting
                              </button>
                              <button
                                onClick={() => handleAction(report.id, 'completed')}
                                className="px-8 py-4 rounded-2xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-200 flex items-center gap-3 active:scale-95"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                                Resolve
                              </button>
                            </div>
                          )}
                          {report.lat && report.lng && (
                            <button
                              onClick={() => setViewingMapReport(report)}
                              className="p-4 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-primary transition-all text-slate-400 hover:text-primary hover:scale-110 active:scale-90 shadow-sm"
                              title="View on Map"
                            >
                              <Navigation className="w-6 h-6" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editingReport && (
          <EditReportModal
            report={editingReport}
            onClose={() => setEditingReport(null)}
            onSave={(data) => handleUpdate(editingReport.id, data)}
          />
        )}

        {deletingReportId && (
          <DeleteConfirmationModal
            onClose={() => setDeletingReportId(null)}
            onConfirm={() => handleDelete(deletingReportId)}
          />
        )}

        {viewingMapReport && (
          <ReportMapModal
            report={viewingMapReport}
            onClose={() => setViewingMapReport(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

