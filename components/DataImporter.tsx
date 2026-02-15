import React, { useState, useRef } from 'react';
import { extractKnowledgeFromText, FileInput } from '../services/geminiService';
import { KnowledgeGraphData } from '../types';

interface DataImporterProps {
  currentGraph: KnowledgeGraphData;
  onUpdateGraph: (newNodes: any[], newLinks: any[]) => void;
}

const DataImporter: React.FC<DataImporterProps> = ({ currentGraph, onUpdateGraph }) => {
  const [inputText, setInputText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; fileInput: FileInput } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processInput = async () => {
    setIsProcessing(true);
    setNotification(null);

    try {
      // Prioritize uploaded file if exists, otherwise use text input
      const input = uploadedFile ? uploadedFile.fileInput : inputText;
      
      const result = await extractKnowledgeFromText(input, currentGraph);
      
      onUpdateGraph(result.nodes, result.links);
      
      // Reset state
      setInputText('');
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setNotification({
        type: 'success',
        message: `Successfully integrated ${result.nodes.length} entities & ${result.links.length} links into the graph.`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'error',
        message: "Processing failed. Please check the input format and try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allowed mime types for binary processing
    const binaryMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/msword', // doc
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
      'application/vnd.ms-powerpoint' // ppt
    ];

    const isBinary = binaryMimeTypes.includes(file.type);

    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result as string;
      
      if (isBinary) {
        // For binary files, we keep the base64 data for the API
        // result format is "data:application/pdf;base64,....."
        const base64Data = result.split(',')[1];
        setUploadedFile({
          name: file.name,
          fileInput: {
            mimeType: file.type,
            data: base64Data
          }
        });
        setInputText(''); // Clear text input if file is selected
      } else {
        // For text-based files, we can just put it in the textarea
        setInputText(result);
        setUploadedFile(null);
      }
    };

    if (isBinary) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    
    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
  };

  return (
    <div className="flex flex-col gap-10 max-w-4xl mx-auto">
      <div className="text-center space-y-4 mb-4">
        <h2 className="text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 pb-2">
          Knowledge Ingestion
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Upload documents or input raw text. The AI will analyze, structure, and expand your neural knowledge graph.
        </p>
      </div>

      <div className="bg-[#13161f] rounded-[2rem] p-8 border border-slate-800/50 shadow-2xl">
        
        {/* File Upload Zone - Gemini Style */}
        <div 
          className={`group border-2 border-dashed transition-all duration-300 rounded-3xl p-8 mb-6 cursor-pointer text-center relative
            ${uploadedFile 
              ? 'border-emerald-500/50 bg-emerald-500/5' 
              : 'border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/30'
            }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            // Extended Accept List
            accept=".txt,.md,.json,.csv,.log,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={handleFileUpload}
          />
          
          {uploadedFile ? (
            <div className="flex flex-col items-center justify-center gap-3 animate-fade-in">
               <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>
               </div>
               <div>
                  <p className="text-emerald-200 font-medium text-lg">{uploadedFile.name}</p>
                  <p className="text-emerald-500/60 text-sm mt-1">Ready for analysis</p>
               </div>
               <button 
                  onClick={clearFile}
                  className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-full transition-colors z-10"
               >
                 Remove File
               </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              </div>
              <div>
                  <p className="text-slate-200 font-medium text-lg">Upload Source File</p>
                  <p className="text-slate-500 text-sm mt-1">PDF, Excel, Word, PPT, TXT, JSON</p>
              </div>
            </div>
          )}
        </div>

        {/* Text Area (Disabled if binary file uploaded) */}
        {!uploadedFile && (
          <div className="relative mb-6 animate-fade-in">
            <textarea
              className="w-full h-64 bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-600 font-sans text-base leading-relaxed shadow-inner"
              placeholder="Or paste your raw knowledge content here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing}
            />
            {inputText && (
              <div className="absolute bottom-6 right-6 text-xs text-slate-500 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-sm">
                {inputText.length} chars
              </div>
            )}
          </div>
        )}

        {notification && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-300 border border-red-500/20'
          }`}>
             {notification.type === 'success' ? (
                 <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             ) : (
                 <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             )}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={processInput}
            disabled={isProcessing || (!inputText.trim() && !uploadedFile)}
            className={`
              px-8 py-4 rounded-full font-semibold text-white shadow-lg transition-all duration-300 flex items-center gap-2
              ${isProcessing || (!inputText.trim() && !uploadedFile)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'gemini-button-gradient hover:shadow-blue-500/30 hover:-translate-y-0.5'
              }
            `}
          >
            {isProcessing ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </>
            ) : (
                <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Ingest Knowledge
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataImporter;