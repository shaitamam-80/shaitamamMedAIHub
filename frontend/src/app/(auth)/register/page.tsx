'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    institution: '',
    language: 'he',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          institution: formData.institution,
          preferred_language: formData.language,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        setError('כתובת האימייל הזו כבר רשומה. נסה להתחבר.');
      } else {
        setError(error.message);
      }
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Success screen
  if (success) {
    return (
      <div className="bg-[#111827] rounded-2xl border border-[#1e293b] p-8 shadow-2xl text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#f1f5f9] mb-2">ההרשמה הושלמה!</h2>
        <p className="text-[#94a3b8] mb-6">
          שלחנו אליך אימייל אימות לכתובת <span className="text-blue-400">{formData.email}</span>
          <br />
          אנא אשר את האימייל כדי להמשיך.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
        >
          עבור להתחברות
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] rounded-2xl border border-[#1e293b] p-8 shadow-2xl">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
          SR Portal
        </h1>
        <p className="text-[#94a3b8] mt-2">צור חשבון חדש</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-[#f1f5f9] mb-2">
            שם מלא
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-lg text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="ישראל ישראלי"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#f1f5f9] mb-2">
            אימייל
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-lg text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#f1f5f9] mb-2">
            סיסמה
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            className="w-full px-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-lg text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="••••••••"
          />
          <p className="text-xs text-[#64748b] mt-1">לפחות 8 תווים</p>
        </div>

        <div>
          <label htmlFor="institution" className="block text-sm font-medium text-[#f1f5f9] mb-2">
            מוסד אקדמי (אופציונלי)
          </label>
          <input
            id="institution"
            name="institution"
            type="text"
            value={formData.institution}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-lg text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="אוניברסיטה עברית"
          />
        </div>

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
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#111827] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              <span>הרשמה</span>
            </>
          )}
        </button>
      </form>

      {/* Login Link */}
      <p className="text-center text-[#94a3b8] text-sm mt-6">
        יש לך כבר חשבון?{' '}
        <Link href="/login" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
          התחברות
        </Link>
      </p>
    </div>
  );
}
