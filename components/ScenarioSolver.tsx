import React, { useState } from 'react';
import { solveScenarioWithIntegration } from '../services/geminiService';
import { KnowledgeGraphData, ScenarioResult } from '../types';
import { jsPDF } from 'jspdf';

interface ScenarioSolverProps {
  knowledgeGraph: KnowledgeGraphData;
}

const ScenarioSolver: React.FC<ScenarioSolverProps> = ({ knowledgeGraph }) => {
  const [scenario, setScenario] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSolve = async () => {
    if (!scenario.trim()) return;
    setIsSolving(true);
    setResult(null);

    try {
      const response = await solveScenarioWithIntegration(scenario, knowledgeGraph);
      setResult(response);
    } catch (e) {
      console.error(e);
      setResult({ solution: "Error generating solution. Please try again.", sources: [] });
    } finally {
      setIsSolving(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = result.solution + "\n\nSources:\n" + result.sources.map(s => `${s.title}: ${s.uri}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (type: 'pdf' | 'doc' | 'excel' | 'txt') => {
    if (!result) return;
    const fileName = "scenario-solution";

    try {
      if (type === 'txt') {
        const element = document.createElement("a");
        const file = new Blob([result.solution + "\n\nSources:\n" + result.sources.map(s => s.uri).join('\n')], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `${fileName}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } 
      else if (type === 'doc') {
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
        const footer = "</body></html>";
        const htmlContent = result.solution.replace(/\n/g, "<br/>");
        const sourcesHtml = result.sources.length ? `<h3>Sources</h3><ul>${result.sources.map(s => `<li><a href="${s.uri}">${s.title}</a></li>`).join('')}</ul>` : "";
        const sourceHTML = header + "<h1>Scenario Solution</h1>" + htmlContent + "<br/><hr/>" + sourcesHtml + footer;
        
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const element = document.createElement("a");
        element.href = source;
        element.download = `${fileName}.doc`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
      else if (type === 'excel') {
        const csvHeader = "\uFEFFSection,Content\n";
        const solutionRow = `Solution,"${result.solution.replace(/"/g, '""')}"\n`;
        const sourceRows = result.sources.map(s => `Source,"${s.title} (${s.uri})"`).join('\n');
        
        const csvContent = csvHeader + solutionRow + sourceRows;
        const element = document.createElement("a");
        const file = new Blob([csvContent], {type: 'text/csv;charset=utf-8'});
        element.href = URL.createObjectURL(file);
        element.download = `${fileName}.csv`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
      else if (type === 'pdf') {
         const doc = new jsPDF();
         doc.setFontSize(20);
         doc.text("Strategic Action Plan", 10, 20);
         doc.setFontSize(12);
         const splitText = doc.splitTextToSize(result.solution, 180);
         let y = 30;
         for(let i = 0; i < splitText.length; i++) {
           if (y > 280) { doc.addPage(); y = 20; }
           doc.text(splitText[i], 10, y);
           y += 7;
         }
         if (result.sources.length > 0) {
            y += 10;
            if (y > 280) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.text("Sources:", 10, y);
            y += 10;
            doc.setFontSize(10);
            result.sources.forEach(s => {
               const sourceText = `${s.title} - ${s.uri}`;
               const splitSource = doc.splitTextToSize(sourceText, 180);
               splitSource.forEach((line: string) => {
                   if (y > 280) { doc.addPage(); y = 20; }
                   doc.text(line, 10, y);
                   y += 5;
               });
               y += 2;
            });
         }
         doc.save(`${fileName}.pdf`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please check console for details.");
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto h-full">
       <div className="text-center space-y-4 mb-4">
        <h2 className="text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 pb-2">
          Event Solutions
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Describe a scenario. We will combine internal data with global search to generate a practical action plan.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-[#13161f] rounded-[2rem] p-2 border border-slate-800/50 shadow-2xl relative group">
        <textarea
          className="w-full bg-transparent border-none text-slate-200 focus:ring-0 outline-none resize-none h-40 p-6 font-sans text-lg placeholder:text-slate-600"
          placeholder="Ask about a specific event or problem..."
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          disabled={isSolving}
        />
        <div className="flex justify-between items-center px-4 pb-4">
             <div className="text-slate-600 text-sm ml-2 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${scenario.length > 0 ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                Gemini 3 Pro Ready
             </div>
             <button
              onClick={handleSolve}
              disabled={isSolving || !scenario.trim()}
              className={`
                 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                 ${isSolving || !scenario.trim()
                    ? 'bg-slate-800 text-slate-500' 
                    : 'bg-white text-blue-600 hover:scale-110' 
                 }
              `}
            >
              {isSolving ? (
                   <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              )}
            </button>
        </div>
      </div>

      {/* Result Section */}
      <div className="flex-1 mt-6">
        {isSolving ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-8">
             <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute inset-0 border-4 border-t-transparent border-blue-500/50 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-b-transparent border-purple-500/50 rounded-full animate-spin duration-reverse" style={{animationDuration: '2s'}}></div>
             </div>
             <div className="text-center space-y-2">
                <h3 className="text-xl font-medium text-white">Synthesizing Solution</h3>
                <div className="flex gap-2 justify-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-200"></span>
                </div>
             </div>
          </div>
        ) : result ? (
          <div className="animate-fade-in space-y-8 pb-12">
            <div className="bg-[#13161f] rounded-[2rem] p-8 md:p-10 border border-slate-800/50 shadow-2xl relative overflow-hidden">
              
              {/* Header with Title and Export Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-700/50 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <svg className="text-white w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white">Strategic Plan</h3>
                      <p className="text-xs text-slate-400 mt-1">AI Generated & Verified</p>
                    </div>
                  </div>

                  {/* HIGH VISIBILITY EXPORT TOOLBAR */}
                  <div className="flex items-center gap-2 bg-[#0f121a] p-2 rounded-xl border border-slate-700 shadow-inner">
                    <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-red-500/20" title="Export as PDF">
                        <span className="font-bold text-[10px]">PDF</span>
                    </button>
                    <button onClick={() => handleExport('doc')} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-blue-500/20" title="Export as Word">
                        <span className="font-bold text-[10px]">DOC</span>
                    </button>
                    <button onClick={() => handleExport('excel')} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-emerald-500/20" title="Export as CSV/Excel">
                        <span className="font-bold text-[10px]">XLS</span>
                    </button>
                    <button onClick={() => handleExport('txt')} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-slate-600" title="Download Text">
                       <span className="font-bold text-[10px]">TXT</span>
                    </button>
                    <div className="w-px h-5 bg-slate-700 mx-1"></div>
                    <button 
                      onClick={handleCopy} 
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors min-w-[70px] justify-center"
                      title="Copy to Clipboard"
                    >
                       {copied ? (
                         <span className="text-emerald-400 text-xs font-bold">Copied!</span>
                       ) : (
                         <span className="text-xs font-bold">Copy</span>
                       )}
                    </button>
                  </div>
              </div>
              
              <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed">
                <div className="whitespace-pre-wrap">{result.solution}</div>
              </div>
            </div>

            {result.sources.length > 0 && (
              <div className="pl-6 animate-fade-in delay-100">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6 ml-2">
                  Sources & Grounding
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-4 p-5 rounded-2xl bg-[#1e2330]/50 hover:bg-[#1e2330] border border-slate-800 hover:border-blue-500/30 transition-all duration-300 group"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-blue-300 group-hover:text-blue-200 transition-colors line-clamp-2">
                          {source.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-1">{source.uri}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center mt-12 opacity-40">
             <div className="w-24 h-24 rounded-full bg-gradient-to-b from-slate-800 to-transparent mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
             </div>
            <p className="text-base text-slate-400">Ready to analyze complex scenarios</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioSolver;