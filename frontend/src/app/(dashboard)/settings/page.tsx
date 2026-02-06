'use client';

import { useState, useEffect } from 'react';
import { Save, User, Building2, Globe, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getProfile, updateProfile } from '@/lib/api/backend-client';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    institution: '',
    language: 'he',
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load profile on mount
  useEffect(() => {
    getProfile()
      .then((profile) => {
        setFormData({
          fullName: profile.full_name || '',
          institution: profile.institution || '',
          language: profile.preferred_language || 'he',
        });
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
        setStatus({ type: 'error', message: 'Failed to load profile data' });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear status when user starts editing
    if (status) setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      await updateProfile({
        full_name: formData.fullName,
        institution: formData.institution,
        preferred_language: formData.language,
      });
      setStatus({ type: 'success', message: 'ההגדרות נשמרו בהצלחה' });
    } catch (err) {
      console.error('Failed to save settings:', err);
      setStatus({ type: 'error', message: 'שגיאה בשמירת ההגדרות. נסה שוב.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-[#94a3b8] text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f1f5f9] mb-2">Settings</h1>
        <p className="text-[#94a3b8]">Manage your account details and preferences</p>
      </div>

      {/* Status Banner */}
      {status && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg flex items-center gap-2 text-sm ${
            status.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Section */}
          <div>
            <h2 className="text-xl font-semibold text-[#f1f5f9] mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[#f1f5f9] mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-lg text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                </div>
              </div>

              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-[#f1f5f9] mb-2">
                  Academic Institution
                </label>
                <div className="relative">
                  <input
                    id="institution"
                    name="institution"
                    type="text"
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder="Enter your institution"
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-lg text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#1e293b]" />

          {/* Preferences Section */}
          <div>
            <h2 className="text-xl font-semibold text-[#f1f5f9] mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span>Preferences</span>
            </h2>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-[#f1f5f9] mb-2">
                Preferred Language
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-lg text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="he">Hebrew</option>
                <option value="en">English</option>
              </select>
              <p className="text-xs text-[#64748b] mt-1">
                Language used for AI responses and interface
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
