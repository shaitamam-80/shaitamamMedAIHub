import React, { useState } from 'react';
import { Search, BookOpen, Table, Play, ExternalLink, Copy, Plus, ChevronRight, Beaker, FileText, Filter, Calendar, Globe, Check, Zap, Home, FolderKanban, MessageSquare, FileCheck, LogOut } from 'lucide-react';

// ============================================
// COLOR PALETTE (MedAI Hub Design System)
// ============================================
// Primary: Blue-600 (#2563EB) - Main actions, headers
// Secondary: Gray-500 (#6B7280) - Supporting text
// Accent: Indigo-600 (#4F46E5) - AI features
// Success: Emerald-500 (#10B981) - Positive states
// Background: Gray-50 (#F9FAFB) - Page background

const MOCK_DATA = {
  framework_type: "PICO",
  concepts: [
    { key: "P", label: "Population", original_value: "Adults with Generalized Anxiety Disorder (GAD)", mesh_descriptor: "Anxiety Disorders", synonyms: "GAD, chronic anxiety" },
    { key: "I", label: "Intervention", original_value: "Cognitive Behavioral Therapy (CBT)", mesh_descriptor: "Cognitive Behavioral Therapy", synonyms: "CBT, cognitive therapy" },
    { key: "C", label: "Comparison", original_value: "Psychotropic Drugs (SSRI/Benzodiazepines)", mesh_descriptor: "Psychotropic Drugs", synonyms: "SSRI, benzodiazepine, pharmacotherapy" },
    { key: "O", label: "Outcome", original_value: "Reduction in anxiety symptoms and quality of life", mesh_descriptor: "Treatment Outcome, Quality of Life", synonyms: "effectiveness, QoL" },
  ],
  strategies: {
    comprehensive: {
      name: "Strategy A: Full Coverage (High Sensitivity)",
      purpose: "Retrieve all studies (I and C separately) for a comprehensive systematic review.",
      formula: "(P AND I AND O) OR (P AND C AND O) [Split Search]",
      query: '(("Anxiety Disorders"[Mesh] OR GAD[tiab]) AND ("CBT"[Mesh] OR CBT[tiab]) AND ("Quality of Life"[Mesh] OR QoL[tiab])) OR (("Anxiety Disorders"[Mesh] OR GAD[tiab]) AND ("Psychotropic Drugs"[Mesh] OR SSRI*[tiab]) AND ("Quality of Life"[Mesh] OR QoL[tiab]))',
      expected_yield: "High (5000+ results)",
      hedge_applied: null
    },
    direct: {
      name: "Strategy B: Direct Comparison (High Specificity)",
      purpose: "Identify head-to-head studies mentioning both treatments together.",
      formula: "P AND I AND C AND O [Majr Focused]",
      query: '("Anxiety Disorders"[Majr] AND "CBT"[tiab] AND "Psychotropic Drugs"[Majr] AND "Quality of Life"[Majr])',
      expected_yield: "Medium (100-500 results)",
      hedge_applied: null
    },
    clinical: {
      name: "Strategy C: Clinical Filtered (RCT-Focused)",
      purpose: "Focus on high-quality evidence (such as RCTs) based on Strategy B.",
      formula: "Strategy B + RCT Hedge + Animal Exclusion",
      query: '(("Anxiety Disorders"[Majr] AND "CBT"[tiab] AND "Psychotropic Drugs"[Majr] AND "Quality of Life"[Majr])) AND ((randomized controlled trial[pt] OR randomized[tiab])) NOT (animals[mh] NOT humans[mh])',
      expected_yield: "Low-Medium (50-200 results)",
      hedge_applied: "RCT_COCHRANE",
      hedge_citation: "Lefebvre C, et al. Cochrane Handbook 2019"
    }
  },
  toolbox: [
    { category: "Article Type", label: "Systematic Reviews", query: 'AND (systematic review[pt] OR meta-analysis[pt])', icon: FileText },
    { category: "Article Type", label: "Randomized Controlled Trials", query: 'AND (randomized controlled trial[pt])', icon: Beaker },
    { category: "Date", label: "Last 5 Years", query: 'AND ("last 5 years"[dp])', icon: Calendar },
    { category: "Language", label: "English Only", query: 'AND English[lang]', icon: Globe },
  ]
};

const steps = [
  { id: 1, label: "Define Question", status: "completed" },
  { id: 2, label: "Expand Terms", status: "completed" },
  { id: 3, label: "Build Query", status: "active" },
  { id: 4, label: "Execute & Screen", status: "pending" },
];

const sidebarItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'define', label: 'Define', subtitle: 'Research Question Formulator', icon: MessageSquare },
  { id: 'query', label: 'Query', subtitle: 'PubMed Search Builder', icon: Search, active: true },
  { id: 'review', label: 'Review', subtitle: 'Literature Screening', icon: FileCheck },
];

export default function QueryBuilderV2() {
  const [currentStrategy, setCurrentStrategy] = useState('comprehensive');
  const [currentQuery, setCurrentQuery] = useState(MOCK_DATA.strategies.comprehensive.query);
  const [copied, setCopied] = useState(false);
  const [addedFilters, setAddedFilters] = useState([]);

  const strategy = MOCK_DATA.strategies[currentStrategy];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddFilter = (filter) => {
    if (!addedFilters.includes(filter.label)) {
      const newQuery = `(${currentQuery}) ${filter.query}`;
      setCurrentQuery(newQuery);
      setAddedFilters([...addedFilters, filter.label]);
    }
  };

  const handleStrategyChange = (key) => {
    setCurrentStrategy(key);
    setCurrentQuery(MOCK_DATA.strategies[key].query);
    setAddedFilters([]);
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
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          
          {/* Page Header with Stepper */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">PubMed Query Architect</h1>
            <p className="text-gray-500 mt-1">Build and validate advanced search strategies for systematic literature reviews.</p>
            
            {/* Stepper */}
            <div className="mt-5 flex items-center overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                    step.status === 'active' ? 'bg-blue-50 text-blue-700' :
                    step.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.status === 'active' ? 'bg-blue-600 text-white' :
                      step.status === 'completed' ? 'bg-emerald-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {step.status === 'completed' ? <Check className="w-3 h-3" /> : step.id}
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 mx-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Report Summary */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Search Strategy Report
            </h2>
            <p className="mt-2 text-gray-600 text-sm leading-relaxed">
              This report presents three search strategies created for the project's <span className="font-semibold text-blue-600">PICO</span> framework. 
              MeSH data has been expanded and <span className="font-semibold text-blue-600">Split Query</span> logic was used to cover the comparison between the two interventions.
            </p>
          </div>

          {/* Concept Analysis Table */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Table className="w-5 h-5 text-gray-500" />
              Concept Analysis & MeSH Expansion
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold text-xs">Concept</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold text-xs">Original Term</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold text-xs">MeSH Descriptor</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold text-xs">Entry Terms</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {MOCK_DATA.concepts.map((c) => (
                    <tr key={c.key} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                            {c.key}
                          </span>
                          <span className="text-gray-500 text-xs">{c.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs max-w-xs">{c.original_value}</td>
                      <td className="px-4 py-3">
                        <code className="text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs font-mono">{c.mesh_descriptor}</code>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs italic">{c.synonyms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategy Tabs */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800">Proposed Search Strategies</h3>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
              {[
                { key: 'comprehensive', label: 'Comprehensive (Split/OR)' },
                { key: 'direct', label: 'Direct Comparison (AND)' },
                { key: 'clinical', label: 'Clinical Filtered' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleStrategyChange(tab.key)}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    currentStrategy === tab.key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Strategy Content */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <h4 className="text-base font-bold text-gray-800">{strategy.name}</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Expected: {strategy.expected_yield}
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                <strong>Purpose:</strong> {strategy.purpose}
              </p>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <strong className="block mb-1 text-blue-700 text-xs">Logical Formula:</strong>
                <code className="text-gray-700 text-sm font-mono">{strategy.formula}</code>
              </div>

              {strategy.hedge_applied && (
                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-sm text-indigo-800 flex items-start gap-2">
                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" />
                  <div>
                    <strong>Applied Hedge:</strong> {strategy.hedge_applied}
                    <p className="text-xs mt-0.5 opacity-75">{strategy.hedge_citation}</p>
                  </div>
                </div>
              )}

              <div>
                <strong className="text-gray-700 text-sm block mb-2">Full Query</strong>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {strategy.query}
                </pre>
              </div>
            </div>
          </div>

          {/* Execute & Toolbox Grid */}
          <div className="grid lg:grid-cols-3 gap-5">
            
            {/* Toolbox */}
            <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base font-semibold mb-2 text-gray-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                Toolbox
              </h3>
              <p className="text-xs text-gray-500 mb-3">Select filters to add to the current query.</p>
              <div className="space-y-2">
                {MOCK_DATA.toolbox.map((item, index) => {
                  const Icon = item.icon;
                  const isAdded = addedFilters.includes(item.label);
                  return (
                    <div key={index} className={`p-2.5 border rounded-lg flex justify-between items-center transition-all ${
                      isAdded ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isAdded ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <div>
                          <div className="font-medium text-gray-700 text-sm">{item.label}</div>
                          <div className="text-xs text-gray-400">{item.category}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddFilter(item)}
                        disabled={isAdded}
                        className={`text-xs font-bold py-1 px-2.5 rounded-md flex items-center gap-1 transition-all ${
                          isAdded
                            ? 'bg-emerald-500 text-white cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {isAdded ? 'Added' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Execute Search */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base font-semibold mb-3 text-gray-900">Execute Search</h3>
              
              <label className="text-sm font-medium text-gray-700">Current Query</label>
              <div className="relative mt-2">
                <textarea
                  readOnly
                  value={currentQuery}
                  className="w-full p-3 rounded-lg bg-gray-900 text-gray-100 font-mono text-xs h-28 resize-none"
                />
                <button
                  onClick={handleCopy}
                  className={`absolute top-2 right-2 p-1.5 rounded-md transition-all ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                {copied && (
                  <span className="absolute top-2 right-12 bg-emerald-500 text-white text-xs px-2 py-1 rounded">
                    Copied!
                  </span>
                )}
              </div>

              {addedFilters.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-gray-500">Active filters:</span>
                  {addedFilters.map((f, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Results per Page</label>
                  <select className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-sm">
                    <option>20</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Sort By</label>
                  <select className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-sm">
                    <option>Relevance</option>
                    <option>Publication Date</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all text-sm">
                  <Play className="w-4 h-4" />
                  Execute Search
                </button>
                <button className="bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center gap-2 border border-gray-200 text-sm">
                  <ExternalLink className="w-4 h-4" />
                  PubMed
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
