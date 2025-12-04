import React, { useState } from 'react';
import { Search, Filter, Sparkles, Download, ExternalLink, Clock, ChevronLeft, ChevronRight, Home, FolderKanban, MessageSquare, Database, FileCheck, LogOut, Play } from 'lucide-react';

// ============================================
// COLOR PALETTE (MedAI Hub Design System)
// ============================================
// Primary: Blue-600 (#2563EB) - Main actions, headers
// Secondary: Gray-500 (#6B7280) - Supporting text
// Accent: Indigo-600 (#4F46E5) - AI features
// Success: Emerald-500 (#10B981) - High relevance
// Warning: Amber-500 (#F59E0B) - Medium relevance
// Background: White/Gray-50 - Clean backgrounds

const MOCK_RESULTS = [
  {
    pmid: "12345678",
    title: "Aspirin-induced gastrointestinal bleeding: A comprehensive systematic review",
    abstract: "Background: Aspirin is widely used for cardiovascular protection, but gastrointestinal bleeding remains a significant...",
    journal: "Journal of Clinical Medicine",
    year: 2023,
    authors: ["Smith J", "Johnson M", "+1"],
    studyTypes: ["Systematic Review", "Meta-Analysis"],
    relevance: "high",
    aiSummary: "Strong evidence for dose-dependent GI bleeding risk with aspirin"
  },
  {
    pmid: "87654321",
    title: "Risk factors for aspirin-associated gastric bleeding in elderly patients",
    abstract: "Objective: To identify risk factors for gastric bleeding in elderly patients taking aspirin for cardiac protection...",
    journal: "Gastroenterology Research",
    year: 2022,
    authors: ["Davis R", "Wilson L"],
    studyTypes: ["Cohort Study", "Observational"],
    relevance: "high",
    aiSummary: "Age >75, H. pylori infection, and concurrent anticoagulants increase risk"
  },
  {
    pmid: "11223344",
    title: "Protective effects of proton pump inhibitors in aspirin users",
    abstract: "Introduction: Proton pump inhibitors (PPIs) are commonly prescribed with aspirin to reduce gastrointestinal...",
    journal: "Clinical Pharmacology & Therapeutics",
    year: 2023,
    authors: ["Lee S", "Park H", "+1"],
    studyTypes: ["Randomized Controlled Trial"],
    relevance: "medium",
    aiSummary: "PPIs significantly reduce GI bleeding risk in high-risk patients"
  },
  {
    pmid: "55667788",
    title: "Comparative safety of low-dose aspirin formulations: enteric-coated vs buffered",
    abstract: "Methods: A multicenter randomized trial comparing gastrointestinal outcomes between enteric-coated and buffered...",
    journal: "American Journal of Cardiology",
    year: 2024,
    authors: ["Chen W", "Brown K", "+3"],
    studyTypes: ["Randomized Controlled Trial"],
    relevance: "high",
    aiSummary: "No significant difference in GI bleeding rates between formulations"
  },
  {
    pmid: "99887766",
    title: "Aspirin resistance and clinical outcomes: A meta-analysis",
    abstract: "Background: Aspirin resistance has been associated with increased cardiovascular events, but the clinical...",
    journal: "Thrombosis Research",
    year: 2023,
    authors: ["Martinez A", "Garcia R"],
    studyTypes: ["Meta-Analysis"],
    relevance: "low",
    aiSummary: "Limited direct relevance to adverse effects; focuses on efficacy outcomes"
  }
];

const SAMPLE_QUERY = `("ASPIRIN" OR "ASPIRIN[Substance Name]" OR "ASPIRIN[Pharmacological Action]") AND ("RASH" OR "RASH[Adverse Events]" OR "RASH[Side Effects]") AND ("adverse effects"[Subheading] OR "toxicity"[Subheading] OR "poisoning"[Subheading]) AND hasabstract[text] AND humans[MeSH Terms] AND ("clinical trial"[Publication Type] OR "randomized controlled trial"[Publication Type] OR "case reports"[Publication Type] OR "observational study"[Publication Type]) AND ("last 10 years"[PDat])`;

const sidebarItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'define', label: 'Define', subtitle: 'Research Question Formulator', icon: MessageSquare },
  { id: 'query', label: 'Query', subtitle: 'PubMed Search Builder', icon: Search, active: true },
  { id: 'review', label: 'Review', subtitle: 'Literature Screening', icon: FileCheck },
];

const RelevanceBadge = ({ level }) => {
  const styles = {
    high: 'bg-emerald-500 text-white',
    medium: 'bg-amber-500 text-white',
    low: 'bg-gray-400 text-white'
  };
  const labels = {
    high: 'High Relevance',
    medium: 'Medium Relevance',
    low: 'Low Relevance'
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[level]}`}>
      {labels[level]}
    </span>
  );
};

const StudyTypeBadge = ({ type }) => {
  const getStyle = (type) => {
    if (type.includes('Systematic') || type.includes('Meta')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (type.includes('Randomized')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (type.includes('Cohort') || type.includes('Observational')) return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getStyle(type)}`}>
      {type}
    </span>
  );
};

export default function PubMedSearchScreen() {
  const [query, setQuery] = useState(SAMPLE_QUERY);
  const [filterText, setFilterText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);

  const filteredResults = MOCK_RESULTS.filter(r => 
    filterText === '' || 
    r.title.toLowerCase().includes(filterText.toLowerCase()) ||
    r.journal.toLowerCase().includes(filterText.toLowerCase()) ||
    r.authors.some(a => a.toLowerCase().includes(filterText.toLowerCase()))
  );

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="font-semibold text-gray-900">MedAI Hub</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                item.active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                {item.subtitle && (
                  <div className={`text-xs ${item.active ? 'text-blue-100' : 'text-gray-400'}`}>
                    {item.subtitle}
                  </div>
                )}
              </div>
            </button>
          ))}
        </nav>

        {/* Quick Start Demo Button */}
        <div className="p-3 border-t border-gray-100">
          <button className="w-full flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all">
            <Play className="w-4 h-4" />
            Quick Start Demo
          </button>
          <p className="text-xs text-gray-400 mt-2 px-1">Systematic Literature Review Platform</p>
        </div>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
              S
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">shaitamam@gmail.com</div>
              <div className="text-xs text-gray-400">Researcher</div>
            </div>
          </div>
          <button className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced PubMed Search</h1>
            <p className="text-gray-500 mt-1">Enter or edit PubMed query to search for relevant articles</p>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-28 p-4 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              placeholder="Enter your PubMed query..."
            />
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm disabled:opacity-70"
              >
                {isSearching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search PubMed
                  </>
                )}
              </button>
              <button className="bg-white border border-gray-200 text-gray-700 py-3 px-5 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                Open PubMed
              </button>
            </div>
          </div>

          {/* Results Section */}
          {hasSearched && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Results Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Search Results</h2>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <span className="font-semibold text-blue-600">Found 1,247 articles</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Search time: 4.2s
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all text-sm">
                      <Sparkles className="w-4 h-4" />
                      AI Analysis
                    </button>
                    <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-50 transition-all text-sm">
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>
                
                {/* Filter */}
                <div className="relative mt-4">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter by title, journal, or author..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full sm:w-80 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PMID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Journal</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Authors</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Study Types</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">AI Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredResults.map((result) => (
                      <tr key={result.pmid} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <a href="#" className="text-blue-600 hover:text-blue-800 font-mono text-sm font-medium hover:underline">
                            {result.pmid}
                          </a>
                        </td>
                        <td className="px-6 py-4 max-w-md">
                          <div>
                            <a href="#" className="text-gray-900 font-semibold text-sm hover:text-blue-700 transition-colors line-clamp-2">
                              {result.title}
                            </a>
                            <p className="text-gray-500 text-xs mt-1 line-clamp-2">{result.abstract}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700 text-sm">{result.journal}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700 text-sm font-medium">{result.year}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-700 text-sm">
                            {result.authors.slice(0, 2).join(', ')}
                            {result.authors.length > 2 && (
                              <span className="text-gray-400 ml-1">{result.authors[result.authors.length - 1]}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {result.studyTypes.map((type, i) => (
                              <StudyTypeBadge key={i} type={type} />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <RelevanceBadge level={result.relevance} />
                            <p className="text-xs text-gray-600 leading-relaxed max-w-xs">
                              {result.aiSummary}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-700">1-5</span> of <span className="font-semibold text-gray-700">1,247</span> results
                </span>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed flex items-center gap-1" disabled>
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1">
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
