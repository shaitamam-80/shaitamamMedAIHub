import React, { useState } from 'react';
import { Search, Home, FolderKanban, MessageSquare, FileCheck, LogOut, Play, FileText, ChevronRight, Sparkles, Clock, CheckCircle2, AlertCircle, Plus, Filter, ArrowRight } from 'lucide-react';

// ============================================
// MedAI Hub - Project Selection Screen (Redesigned)
// ============================================

const MOCK_PROJECTS = [
  {
    id: 1,
    name: "CBT vs SSRIs for Anxiety",
    framework: "PICO",
    status: "ready",
    updatedAt: "2 hours ago",
    components: {
      P: "Adults with GAD",
      I: "Cognitive Behavioral Therapy",
      C: "SSRIs/Benzodiazepines",
      O: "Anxiety reduction, QoL"
    }
  },
  {
    id: 2,
    name: "Exercise in Elderly Depression",
    framework: "PICO",
    status: "ready",
    updatedAt: "1 day ago",
    components: {
      P: "Elderly patients (65+) with depression",
      I: "Structured exercise programs",
      C: "Standard care",
      O: "Depression symptoms, mobility"
    }
  },
  {
    id: 3,
    name: "Telehealth Patient Experience",
    framework: "SPIDER",
    status: "in_progress",
    updatedAt: "3 days ago",
    components: {
      S: "Primary care patients",
      PI: "Telehealth consultations",
      D: "Mixed methods",
      E: "User experience",
      R: "Satisfaction, barriers"
    }
  },
  {
    id: 4,
    name: "Diabetes Prevention Programs",
    framework: "PEO",
    status: "ready",
    updatedAt: "1 week ago",
    components: {
      P: "Pre-diabetic adults",
      E: "Lifestyle intervention programs",
      O: "HbA1c levels, weight loss"
    }
  }
];

const sidebarItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'define', label: 'Define', subtitle: 'Research Question Formulator', icon: MessageSquare },
  { id: 'query', label: 'Query', subtitle: 'PubMed Search Builder', icon: Search, active: true },
  { id: 'review', label: 'Review', subtitle: 'Literature Screening', icon: FileCheck },
];

const steps = [
  { id: 'select', label: 'Select Project', icon: FileText, active: true },
  { id: 'generate', label: 'Generate Query', icon: Sparkles },
  { id: 'builder', label: 'Query Builder', icon: Play },
  { id: 'results', label: 'Search Results', icon: FileCheck },
];

const frameworkColors = {
  PICO: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  SPIDER: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  PEO: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  CoCoPop: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
};

const StatusBadge = ({ status }) => {
  if (status === 'ready') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Ready
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" />
      In Progress
    </span>
  );
};

const ProjectCard = ({ project, isSelected, onSelect }) => {
  const colors = frameworkColors[project.framework] || frameworkColors.PICO;
  
  return (
    <button
      onClick={() => onSelect(project)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
        isSelected 
          ? 'border-blue-500 bg-blue-50/50 shadow-md' 
          : `border-gray-200 bg-white hover:border-blue-300`
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{project.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${colors.badge}`}>
              {project.framework}
            </span>
            <StatusBadge status={project.status} />
          </div>
        </div>
        <ArrowRight className={`w-5 h-5 transition-all ${isSelected ? 'text-blue-600' : 'text-gray-300'}`} />
      </div>

      {/* Framework Components Preview */}
      <div className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
        <div className="space-y-1.5">
          {Object.entries(project.components).slice(0, 3).map(([key, value]) => (
            <div key={key} className="flex items-start gap-2">
              <span className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold ${colors.badge}`}>
                {key}
              </span>
              <span className="text-xs text-gray-600 line-clamp-1">{value}</span>
            </div>
          ))}
          {Object.keys(project.components).length > 3 && (
            <span className="text-xs text-gray-400 pl-7">+{Object.keys(project.components).length - 3} more...</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        Updated {project.updatedAt}
      </div>
    </button>
  );
};

export default function ProjectSelectionScreen() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFramework, setFilterFramework] = useState('all');

  const filteredProjects = MOCK_PROJECTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFramework = filterFramework === 'all' || p.framework === filterFramework;
    return matchesSearch && matchesFramework;
  });

  const readyProjects = filteredProjects.filter(p => p.status === 'ready');
  const inProgressProjects = filteredProjects.filter(p => p.status === 'in_progress');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="font-semibold text-gray-900">MedAI Hub</span>
          </div>
        </div>

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

        <div className="p-3 border-t border-gray-100">
          <button className="w-full flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all">
            <Play className="w-4 h-4" />
            Quick Start Demo
          </button>
          <p className="text-xs text-gray-400 mt-2 px-1">Systematic Literature Review Platform</p>
        </div>

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
        <div className="max-w-5xl mx-auto p-6">
          
          {/* Page Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Search className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">PubMed Query Builder</h1>
              </div>
              <p className="text-gray-500">Generate and execute optimized search strategies</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    step.active 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <step.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Project Selection Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Section Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Select Your Project</h2>
                  <p className="text-sm text-gray-500">Choose a project with completed research question formulation</p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all">
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <select
                  value={filterFramework}
                  onChange={(e) => setFilterFramework(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                >
                  <option value="all">All Frameworks</option>
                  <option value="PICO">PICO</option>
                  <option value="SPIDER">SPIDER</option>
                  <option value="PEO">PEO</option>
                  <option value="CoCoPop">CoCoPop</option>
                </select>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="p-5">
              {/* Ready Projects */}
              {readyProjects.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Ready for Query Generation ({readyProjects.length})
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {readyProjects.map(project => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        isSelected={selectedProject?.id === project.id}
                        onSelect={setSelectedProject}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress Projects */}
              {inProgressProjects.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    In Progress ({inProgressProjects.length})
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {inProgressProjects.map(project => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        isSelected={selectedProject?.id === project.id}
                        onSelect={setSelectedProject}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredProjects.length === 0 && (
                <div className="text-center py-12">
                  <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No projects found</p>
                  <button className="mt-3 text-blue-600 text-sm font-medium hover:underline">
                    Create your first project
                  </button>
                </div>
              )}
            </div>

            {/* Action Footer */}
            {selectedProject && (
              <div className="p-5 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Selected: <span className="font-semibold text-gray-900">{selectedProject.name}</span>
                    </p>
                    <p className="text-xs text-gray-400">{selectedProject.framework} Framework</p>
                  </div>
                  <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm">
                    Continue to Query Generation
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
