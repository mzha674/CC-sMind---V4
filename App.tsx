import React, { useState } from 'react';
import { KnowledgeGraphData, AppMode } from './types';
import DataImporter from './components/DataImporter';
import ScenarioSolver from './components/ScenarioSolver';

// Initial dummy data
const INITIAL_DATA: KnowledgeGraphData = {
  nodes: [
    { id: "Artificial Intelligence", group: "Technology", val: 8 },
    { id: "Machine Learning", group: "Technology", val: 5 },
    { id: "Neural Networks", group: "Concept", val: 4 },
    { id: "Healthcare", group: "Industry", val: 6 },
    { id: "Diagnostics", group: "Application", val: 4 },
    { id: "Privacy", group: "Regulation", val: 5 },
    { id: "GDPR", group: "Regulation", val: 4 },
  ],
  links: [
    { source: "Artificial Intelligence", target: "Machine Learning", relationship: "includes" },
    { source: "Machine Learning", target: "Neural Networks", relationship: "uses" },
    { source: "Artificial Intelligence", target: "Healthcare", relationship: "transforms" },
    { source: "Healthcare", target: "Diagnostics", relationship: "requires" },
    { source: "Artificial Intelligence", target: "Privacy", relationship: "impacts" },
    { source: "Privacy", target: "GDPR", relationship: "governed by" },
  ]
};

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<KnowledgeGraphData>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<AppMode>(AppMode.IMPORT_DATA);

  // Handle merging new knowledge into existing graph
  const updateGraph = (newNodes: any[], newLinks: any[]) => {
    setGraphData(prev => {
      const nodeMap = new Map(prev.nodes.map(n => [n.id.toLowerCase(), n]));
      newNodes.forEach(node => {
        if (!nodeMap.has(node.id.toLowerCase())) {
          nodeMap.set(node.id.toLowerCase(), { ...node, val: 5 });
        }
      });

      const linkSet = new Set(prev.links.map(l => `${l.source}-${l.target}-${l.relationship}`));
      const finalLinks = [...prev.links];

      newLinks.forEach(link => {
        const key = `${link.source}-${link.target}-${link.relationship}`;
        if (!linkSet.has(key)) {
          if (nodeMap.has(link.source.toLowerCase()) && nodeMap.has(link.target.toLowerCase())) {
             finalLinks.push(link);
             linkSet.add(key);
          }
        }
      });

      return { nodes: Array.from(nodeMap.values()), links: finalLinks };
    });
  };

  return (
    <div className="flex h-screen w-full text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-100">
      
      {/* Sidebar - Gemini Style: Glassy, Rounded Pills, Soft Colors */}
      <aside className="w-80 flex-shrink-0 bg-[#0f121a]/80 backdrop-blur-xl border-r border-slate-800/50 flex flex-col justify-between z-20">
        <div className="p-6">
          <div className="h-16 flex items-center mb-6">
            {/* Logo Area */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group hover:scale-105 transition-transform duration-300">
                 {/* Super Cute Cat Logo with Big Eyes */}
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
                    {/* Ears */}
                    <path d="M5 6L7 2L10 5L14 5L17 2L19 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    {/* Head */}
                    <path d="M19 6C19 6 21 8 21 13C21 18 17 22 12 22C7 22 3 18 3 13C3 8 5 6 5 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    {/* Big Eyes */}
                    <circle cx="8.5" cy="12.5" r="2.5" fill="white" />
                    <circle cx="15.5" cy="12.5" r="2.5" fill="white" />
                    {/* Eye Sparkles (Pupils) */}
                    <circle cx="8.5" cy="12.5" r="1" fill="#3b82f6" />
                    <circle cx="15.5" cy="12.5" r="1" fill="#3b82f6" />
                    <circle cx="9.2" cy="11.8" r="0.5" fill="white" />
                    <circle cx="16.2" cy="11.8" r="0.5" fill="white" />
                    {/* Mouth */}
                    <path d="M10 17C10.5 18 11.5 18 12 17C12.5 18 13.5 18 14 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                 </svg>
              </div>
              <span className="font-bold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">CC'sMind</span>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab(AppMode.IMPORT_DATA)}
              className={`w-full flex items-center px-4 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === AppMode.IMPORT_DATA 
                  ? 'bg-blue-500/10 text-blue-400' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${activeTab === AppMode.IMPORT_DATA ? 'text-blue-400' : 'text-slate-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Data Import
            </button>

            <button
              onClick={() => setActiveTab(AppMode.SOLVE_SCENARIO)}
              className={`w-full flex items-center px-4 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === AppMode.SOLVE_SCENARIO 
                  ? 'bg-purple-500/10 text-purple-400' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${activeTab === AppMode.SOLVE_SCENARIO ? 'text-purple-400' : 'text-slate-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Event Solutions
            </button>
          </nav>
        </div>

        <div className="p-6">
             <div className="p-5 rounded-3xl bg-slate-800/30 border border-slate-700/30">
               <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Knowledge Base Stats</h3>
               <div className="flex justify-between items-center mb-3">
                 <span className="text-sm text-slate-300">Entities</span>
                 <span className="text-sm font-bold text-white bg-slate-700/50 px-2 py-0.5 rounded-md">{graphData.nodes.length}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-slate-300">Connections</span>
                 <span className="text-sm font-bold text-white bg-slate-700/50 px-2 py-0.5 rounded-md">{graphData.links.length}</span>
               </div>
               <div className="mt-5 pt-4 border-t border-slate-700/30 flex items-center gap-2">
                 <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                 <span className="text-xs text-emerald-400 font-medium">Model Online</span>
               </div>
             </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full relative overflow-hidden">
        <div className="h-full w-full max-w-5xl mx-auto p-8 lg:p-12 overflow-y-auto custom-scrollbar">
           {activeTab === AppMode.IMPORT_DATA && (
             <div className="animate-fade-in">
               <DataImporter currentGraph={graphData} onUpdateGraph={updateGraph} />
             </div>
           )}
           {activeTab === AppMode.SOLVE_SCENARIO && (
             <div className="animate-fade-in">
               <ScenarioSolver knowledgeGraph={graphData} />
             </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default App;