'use client';

import { useState } from 'react';
import { Save, User, Mail, Building2, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    fullName: 'ישראל ישראלי',
    email: 'israel@example.com',
    institution: 'האוניברסיטה העברית',
    language: 'he',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Mock save
    setTimeout(() => {
      setIsSaving(false);
      alert('ההגדרות נשמרו בהצלחה');
    }, 1000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f1f5f9] mb-2">הגדרות</h1>
        <p className="text-[#94a3b8]">נהל את פרטי החשבון וההעדפות שלך</p>
      </div>

      {/* Settings Form */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Section */}
          <div>
            <h2 className="text-xl font-semibold text-[#f1f5f9] mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>פרופיל</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[#f1f5f9] mb-2">
                  שם מלא
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-lg text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#f1f5f9] mb-2">
                  אימייל
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-lg text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                </div>
              </div>

              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-[#f1f5f9] mb-2">
                  מוסד אקדמי
                </label>
                <div className="relative">
                  <input
                    id="institution"
                    name="institution"
                    type="text"
                    value={formData.institution}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-lg text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              <span>העדפות</span>
            </h2>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-[#f1f5f9] mb-2">
                שפה מועדפת
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-lg text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="he">עברית</option>
                <option value="en">English</option>
              </select>
              <p className="text-xs text-[#64748b] mt-1">
                השפה בה תוצגנה התגובות והממשק
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
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>שמור שינויים</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
