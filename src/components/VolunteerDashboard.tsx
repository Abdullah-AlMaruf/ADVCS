import { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { DisasterReport, Volunteer } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

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
        className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#5A5A40] text-white">
          <h3 className="font-serif text-xl font-bold">Edit Report</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5A5A40] mb-1 uppercase tracking-wider">Type</label>
            <input 
              type="text" 
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#5A5A40] mb-1 uppercase tracking-wider">Severity</label>
              <select 
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5A5A40] mb-1 uppercase tracking-wider">Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5A5A40] mb-1 uppercase tracking-wider">Area</label>
            <input 
              type="text" 
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5A5A40] mb-1 uppercase tracking-wider">Description</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-full border border-gray-200 font-bold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSave(formData)}
              className="flex-1 px-6 py-3 rounded-full bg-[#5A5A40] text-white font-bold hover:bg-[#4A4A30] transition-all shadow-lg"
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
        className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden p-8 text-center"
      >
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-[#5A5A40] mb-2">Delete Report?</h3>
        <p className="text-gray-500 mb-8">This action cannot be undone. The report will be permanently removed from the system.</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-full border border-gray-200 font-bold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-6 py-3 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg"
          >
            Delete
          </button>
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
        // Optimistically remove from local state
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
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Reports', value: stats.totalReports, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Volunteers', value: stats.activeVolunteers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed Tasks', value: stats.completedTasks, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[24px] shadow-sm border border-[#5A5A40]/10 flex items-center gap-4"
          >
            <div className={`p-4 rounded-2xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-serif font-bold text-[#5A5A40]">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[32px] shadow-xl border border-[#5A5A40]/10 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="font-serif text-2xl font-bold text-[#5A5A40]">Disaster Reports</h2>
            <button 
              onClick={fetchData}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              title="Refresh"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search area or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 w-full md:w-64"
              />
            </div>
            <div className="flex bg-gray-100 p-1 rounded-full">
              {(['all', 'pending', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    filter === f ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="p-20 text-center text-gray-400">
                <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-20 text-center text-gray-400">
                <p>No reports found matching your criteria.</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <motion.div 
                  key={report.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${getStatusColor(report.status)}`}>
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg text-[#5A5A40] capitalize">{report.type}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            report.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                            report.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            {report.severity}
                          </span>
                          {report.area === user.area && (
                            <span className="bg-[#5A5A40] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                              Your Area
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {report.area}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDistanceToNow(new Date(report.created_at))} ago
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{report.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {/* Action Buttons */}
                      <div className="flex gap-2 mr-4 pr-4 border-r border-gray-100">
                        <button 
                          onClick={() => setEditingReport(report)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-colors"
                          title="Edit Report"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeletingReportId(report.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {report.status === 'pending' && (
                        <button 
                          onClick={() => handleAction(report.id, 'accepted')}
                          className="bg-[#5A5A40] text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-[#4A4A30] transition-all flex items-center gap-2 shadow-sm"
                        >
                          Accept Task
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                      {report.status === 'active' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAction(report.id, 'helping')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                          >
                            <Activity className="w-4 h-4" />
                            Helping
                          </button>
                          <button 
                            onClick={() => handleAction(report.id, 'completed')}
                            className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete
                          </button>
                        </div>
                      )}
                      {report.lat && report.lng && (
                        <a 
                          href={`https://www.google.com/maps?q=${report.lat},${report.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 border border-gray-200 rounded-full hover:bg-white hover:border-[#5A5A40] transition-all text-gray-400 hover:text-[#5A5A40]"
                          title="View on Map"
                        >
                          <Navigation className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit Modal */}
      {editingReport && (
        <EditReportModal 
          report={editingReport} 
          onClose={() => setEditingReport(null)}
          onSave={(data) => handleUpdate(editingReport.id, data)}
        />
      )}

      {/* Delete Modal */}
      {deletingReportId && (
        <DeleteConfirmationModal 
          onClose={() => setDeletingReportId(null)}
          onConfirm={() => handleDelete(deletingReportId)}
        />
      )}
    </div>
  );
}

