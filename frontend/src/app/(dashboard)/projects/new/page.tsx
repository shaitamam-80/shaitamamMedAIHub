'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Search, FileText, Target, Layers, BookOpen, Brain } from 'lucide-react';
import { REVIEW_TYPES, ReviewType } from '@/lib/utils/stage-config';

const reviewTypeIcons: Record<ReviewType, any> = {
  systematic_intervention: Search,
  systematic_prevalence: Target,
  systematic_prognosis: Layers,
  systematic_diagnostic: Search,
  systematic_qualitative: Brain,
  scoping: BookOpen,
};

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    topic: '',
    reviewType: '',
    framework: '',
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    // Mock project creation
    console.log('Creating project:', formData);
    // In production, call API to create project
    router.push('/projects/1'); // Mock project ID
  };

  const canProceed = () => {
    if (step === 1) return formData.topic.trim().length > 0;
    if (step === 2) return formData.reviewType.length > 0;
    return true;
  };

  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                    s < step
                      ? 'bg-green-500 text-white'
                      : s === step
                      ? 'bg-blue-500 text-white'
                      : 'bg-[#1e293b] text-[#64748b]'
                  }`}
                >
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 mx-2 transition-all ${
                      s < step ? 'bg-green-500' : 'bg-[#1e293b]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-32 mt-4">
            <span className={`text-sm ${step === 1 ? 'text-blue-500' : 'text-[#64748b]'}`}>נושא</span>
            <span className={`text-sm ${step === 2 ? 'text-blue-500' : 'text-[#64748b]'}`}>סוג סקירה</span>
            <span className={`text-sm ${step === 3 ? 'text-blue-500' : 'text-[#64748b]'}`}>אישור</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-8 min-h-[400px]">
          {/* Step 1: Topic */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-[#f1f5f9] mb-2">מה נושא המחקר שלך?</h2>
              <p className="text-[#94a3b8] mb-6">תאר בקצרה את נושא הסקירה השיטתית</p>

              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-[#f1f5f9] mb-2">
                  נושא המחקר
                </label>
                <textarea
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 bg-[#0a0e1a] border border-[#1e293b] rounded-lg text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="לדוגמה: השפעת הבינה המלאכותית על שיטות הוראה בחינוך הגבוה - סקירה שיטתית של מחקרים שפורסמו בין 2020-2024"
                />
                <p className="text-xs text-[#64748b] mt-2">
                  טיפ: כלול את הנושא, האוכלוסיה, וההקשר המחקרי
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Review Type */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-[#f1f5f9] mb-2">בחר סוג סקירה</h2>
              <p className="text-[#94a3b8] mb-6">בחר את סוג הסקירה המתאימה למטרות המחקר שלך</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(REVIEW_TYPES).map(([reviewTypeKey, reviewTypeData]) => {
                  const Icon = reviewTypeIcons[reviewTypeKey as ReviewType] || FileText;
                  const isSelected = formData.reviewType === reviewTypeKey;

                  return (
                    <button
                      key={reviewTypeKey}
                      onClick={() => setFormData({ ...formData, reviewType: reviewTypeKey })}
                      className={`p-6 rounded-xl border-2 text-right transition-all relative ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-[#1e293b] bg-[#0a0e1a] hover:border-blue-500/50'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mb-3 ${isSelected ? 'text-blue-500' : 'text-[#94a3b8]'}`} />
                      <h3 className={`font-semibold mb-1 ${isSelected ? 'text-blue-500' : 'text-[#f1f5f9]'}`}>
                        {reviewTypeData.he}
                      </h3>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-500 absolute top-4 left-4" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-[#f1f5f9] mb-2">אישור פרטי הפרויקט</h2>
              <p className="text-[#94a3b8] mb-6">בדוק את הפרטים לפני יצירת הפרויקט</p>

              <div className="space-y-6">
                <div className="bg-[#0a0e1a] border border-[#1e293b] rounded-lg p-6">
                  <h3 className="text-sm font-medium text-[#94a3b8] mb-2">נושא המחקר</h3>
                  <p className="text-[#f1f5f9]">{formData.topic}</p>
                </div>

                <div className="bg-[#0a0e1a] border border-[#1e293b] rounded-lg p-6">
                  <h3 className="text-sm font-medium text-[#94a3b8] mb-2">סוג הסקירה</h3>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = reviewTypeIcons[formData.reviewType as ReviewType] || FileText;
                      return <Icon className="w-5 h-5 text-blue-500" />;
                    })()}
                    <span className="text-[#f1f5f9] font-medium">
                      {formData.reviewType ? REVIEW_TYPES[formData.reviewType as ReviewType]?.he : ''}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                  <p className="text-blue-400 text-sm">
                    ✓ הפרויקט יכלול 10 שלבים מותאמים לסוג הסקירה שבחרת
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-3 bg-[#1e293b] text-[#f1f5f9] font-medium rounded-lg hover:bg-[#334155] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            <span>חזרה</span>
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <span>המשך</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>צור פרויקט</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
