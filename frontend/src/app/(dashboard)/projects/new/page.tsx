'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Search, FileText, Target, Layers, BookOpen, Brain, Loader2, Globe, Stethoscope } from 'lucide-react';
import { REVIEW_TYPES, ReviewType } from '@/lib/utils/stage-config';
import { createProject } from '@/lib/api/backend-client';

const reviewTypeIcons: Record<ReviewType, any> = {
  systematic_intervention: Search,
  systematic_prevalence: Target,
  systematic_prognosis: Layers,
  systematic_diagnostic: Search,
  systematic_qualitative: Brain,
  scoping: BookOpen,
};

// Map review types to their default research framework
const REVIEW_TYPE_FRAMEWORKS: Record<string, string> = {
  'systematic_intervention': 'PICO',
  'systematic_prevalence': 'CoCoPop',
  'systematic_prognosis': 'PFO',
  'systematic_diagnostic': 'PIRD',
  'systematic_qualitative': 'SPIDER',
  'scoping': 'PCC',
};

type SearchSource = 'openalex' | 'pubmed';

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    topic: '',
    reviewType: '',
    framework: '',
    searchSource: 'openalex' as SearchSource,
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const framework = REVIEW_TYPE_FRAMEWORKS[formData.reviewType] || 'PICO';
      const project = await createProject({
        title: formData.topic,
        review_type: formData.reviewType,
        framework: framework,
        search_source: formData.searchSource,
      });
      // Redirect to the newly created project
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      setSubmitError('Failed to create project. Please try again.');
      setIsSubmitting(false);
    }
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
                      : 'bg-[#e2e8f0] text-[#94a3b8]'
                  }`}
                >
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 mx-2 transition-all ${
                      s < step ? 'bg-green-500' : 'bg-[#e2e8f0]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-32 mt-4">
            <span className={`text-sm ${step === 1 ? 'text-blue-500' : 'text-[#94a3b8]'}`}>Topic</span>
            <span className={`text-sm ${step === 2 ? 'text-blue-500' : 'text-[#94a3b8]'}`}>Review Type</span>
            <span className={`text-sm ${step === 3 ? 'text-blue-500' : 'text-[#94a3b8]'}`}>Confirm</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-2xl p-8 min-h-[400px]">
          {/* Step 1: Topic + Search Engine */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-[#0f172a] mb-2">What is your research topic?</h2>
              <p className="text-[#475569] mb-6">Briefly describe your systematic review topic and choose a search engine</p>

              <div className="mb-6">
                <label htmlFor="topic" className="block text-sm font-medium text-[#0f172a] mb-2">
                  Research Topic
                </label>
                <textarea
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="e.g., The impact of AI on teaching methods in higher education — a systematic review of studies published between 2020-2024"
                />
                <p className="text-xs text-[#94a3b8] mt-2">
                  Tip: Include the topic, population, and research context
                </p>
              </div>

              {/* Search Engine Selection */}
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-3">
                  Search Engine
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* OpenAlex Card */}
                  <button
                    onClick={() => setFormData({ ...formData, searchSource: 'openalex' })}
                    className={`p-5 rounded-xl border-2 text-left transition-all relative ${
                      formData.searchSource === 'openalex'
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-[#e2e8f0] bg-[#f8fafc] hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Globe className={`w-7 h-7 mt-0.5 flex-shrink-0 ${formData.searchSource === 'openalex' ? 'text-blue-500' : 'text-[#475569]'}`} />
                      <div>
                        <h3 className={`font-semibold mb-1 ${formData.searchSource === 'openalex' ? 'text-blue-500' : 'text-[#0f172a]'}`}>
                          OpenAlex
                        </h3>
                        <p className="text-xs text-[#94a3b8] leading-relaxed">
                          All academic disciplines — CS, engineering, social sciences, education, and more. 260M+ works.
                        </p>
                      </div>
                    </div>
                    {formData.searchSource === 'openalex' && (
                      <Check className="w-5 h-5 text-blue-500 absolute top-4 right-4" />
                    )}
                  </button>

                  {/* PubMed Card */}
                  <button
                    onClick={() => setFormData({ ...formData, searchSource: 'pubmed' })}
                    className={`p-5 rounded-xl border-2 text-left transition-all relative ${
                      formData.searchSource === 'pubmed'
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-[#e2e8f0] bg-[#f8fafc] hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Stethoscope className={`w-7 h-7 mt-0.5 flex-shrink-0 ${formData.searchSource === 'pubmed' ? 'text-blue-500' : 'text-[#475569]'}`} />
                      <div>
                        <h3 className={`font-semibold mb-1 ${formData.searchSource === 'pubmed' ? 'text-blue-500' : 'text-[#0f172a]'}`}>
                          PubMed
                        </h3>
                        <p className="text-xs text-[#94a3b8] leading-relaxed">
                          Biomedical &amp; life sciences with MeSH terms, clinical filters, and field tags. 37M+ articles.
                        </p>
                      </div>
                    </div>
                    {formData.searchSource === 'pubmed' && (
                      <Check className="w-5 h-5 text-blue-500 absolute top-4 right-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review Type */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-[#0f172a] mb-2">Choose review type</h2>
              <p className="text-[#475569] mb-6">Select the review type that fits your research goals</p>

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
                          : 'border-[#e2e8f0] bg-[#f8fafc] hover:border-blue-500/50'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mb-3 ${isSelected ? 'text-blue-500' : 'text-[#475569]'}`} />
                      <h3 className={`font-semibold mb-1 ${isSelected ? 'text-blue-500' : 'text-[#0f172a]'}`}>
                        {reviewTypeData.en}
                      </h3>
                      {isSelected && (
                        <div className="mt-2 text-xs text-blue-400">
                          Framework: {REVIEW_TYPE_FRAMEWORKS[reviewTypeKey] || 'PICO'}
                        </div>
                      )}
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
              <h2 className="text-2xl font-bold text-[#0f172a] mb-2">Confirm project details</h2>
              <p className="text-[#475569] mb-6">Review the details before creating your project</p>

              <div className="space-y-6">
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-6">
                  <h3 className="text-sm font-medium text-[#475569] mb-2">Research Topic</h3>
                  <p className="text-[#0f172a]">{formData.topic}</p>
                </div>

                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-6">
                  <h3 className="text-sm font-medium text-[#475569] mb-2">Search Engine</h3>
                  <div className="flex items-center gap-2">
                    {formData.searchSource === 'openalex' ? (
                      <Globe className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Stethoscope className="w-5 h-5 text-blue-500" />
                    )}
                    <span className="text-[#0f172a] font-medium">
                      {formData.searchSource === 'openalex'
                        ? 'OpenAlex — All disciplines (260M+ works)'
                        : 'PubMed — Biomedical & life sciences (37M+ articles)'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-6">
                  <h3 className="text-sm font-medium text-[#475569] mb-2">Review Type</h3>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = reviewTypeIcons[formData.reviewType as ReviewType] || FileText;
                      return <Icon className="w-5 h-5 text-blue-500" />;
                    })()}
                    <span className="text-[#0f172a] font-medium">
                      {formData.reviewType ? REVIEW_TYPES[formData.reviewType as ReviewType]?.en : ''}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-[#94a3b8]">
                    Framework: {REVIEW_TYPE_FRAMEWORKS[formData.reviewType] || 'PICO'}
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                  <p className="text-blue-600 text-sm">
                    Your project will include 10 stages tailored to your review type. All tools are available regardless of search engine.
                  </p>
                </div>

                {submitError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-500 text-sm">{submitError}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-3 bg-[#e2e8f0] text-[#0f172a] font-medium rounded-lg hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <span>Next</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating project...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Create Project</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
