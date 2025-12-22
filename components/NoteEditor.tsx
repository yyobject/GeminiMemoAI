
import React, { useState, useEffect } from 'react';
import { Note, AIServiceType } from '../types';
import { processNoteWithAI, getSmartTags } from '../services/geminiService';

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onClose: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onClose }) => {
  const [editedNote, setEditedNote] = useState<Note>({ ...note });
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const colors = [
    { name: 'Default', value: '#e2e8f0' },
    { name: 'Blue', value: '#60a5fa' },
    { name: 'Green', value: '#4ade80' },
    { name: 'Red', value: '#f87171' },
    { name: 'Yellow', value: '#fbbf24' },
    { name: 'Purple', value: '#a78bfa' },
  ];

  const handleAIAction = async (type: AIServiceType) => {
    if (!editedNote.content && type !== AIServiceType.EXPAND) return;
    
    setIsAIProcessing(true);
    try {
      const result = await processNoteWithAI(type, editedNote.content, editedNote.title);
      
      if (type === AIServiceType.SUMMARIZE) {
        setEditedNote(prev => ({
          ...prev,
          content: `${prev.content}\n\n--- AI Summary ---\n${result}`
        }));
      } else if (type === AIServiceType.SUGGEST_TAGS) {
        // Fix: Moved logic into functional update to access 'prev' state
        setEditedNote(prev => {
          const newTags = result.split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t && !prev.tags.includes(t));
          return {
            ...prev,
            tags: [...new Set([...prev.tags, ...newTags])]
          };
        });
      } else {
        setEditedNote(prev => ({ ...prev, content: result }));
      }
    } catch (error) {
      alert("AI Action failed: " + (error as Error).message);
    } finally {
      setIsAIProcessing(false);
    }
  };

  const generateSmartTags = async () => {
    setIsAIProcessing(true);
    const tags = await getSmartTags(editedNote.content, editedNote.title);
    setEditedNote(prev => ({
      ...prev,
      tags: [...new Set([...prev.tags, ...tags])]
    }));
    setIsAIProcessing(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!editedNote.tags.includes(newTag)) {
        setEditedNote(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedNote(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const save = () => {
    onSave({ ...editedNote, updatedAt: Date.now() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <div className="flex gap-2">
              {colors.map(c => (
                <button 
                  key={c.value} 
                  onClick={() => setEditedNote(prev => ({...prev, color: c.value}))}
                  className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${editedNote.color === c.value ? 'border-indigo-500 scale-125' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button 
              onClick={save}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* AI Toolbar */}
        <div className="px-6 py-3 bg-slate-50 flex flex-wrap gap-2 items-center overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Gemini Tools</span>
          
          <button 
            disabled={isAIProcessing}
            onClick={() => handleAIAction(AIServiceType.SUMMARIZE)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21v-7a5 45 0 1 1 5-5H4"></path><path d="M20 21v-7a5 45 0 0 0-5-5h5"></path><path d="M12 21V12"></path></svg>
            Summarize
          </button>

          <button 
            disabled={isAIProcessing}
            onClick={() => handleAIAction(AIServiceType.FIX_GRAMMAR)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Fix Writing
          </button>

          <button 
            disabled={isAIProcessing}
            onClick={generateSmartTags}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            Smart Tags
          </button>

          {isAIProcessing && (
            <div className="flex items-center gap-2 ml-4">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-indigo-500 font-medium italic">Gemini is thinking...</span>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col p-8 overflow-y-auto">
          <input 
            type="text" 
            placeholder="Note Title"
            className="w-full text-4xl font-bold text-slate-800 placeholder:text-slate-200 border-none focus:ring-0 mb-6"
            value={editedNote.title}
            onChange={(e) => setEditedNote(prev => ({ ...prev, title: e.target.value }))}
          />

          <textarea 
            placeholder="Start typing your thoughts..."
            className="w-full flex-grow text-lg text-slate-600 placeholder:text-slate-200 border-none focus:ring-0 resize-none leading-relaxed"
            value={editedNote.content}
            onChange={(e) => setEditedNote(prev => ({ ...prev, content: e.target.value }))}
          />

          {/* Tags */}
          <div className="mt-8 pt-6 border-t border-slate-50">
            <div className="flex flex-wrap gap-2 mb-4">
              {editedNote.tags.map(tag => (
                <span key={tag} className="group flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full uppercase tracking-wider transition-all">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="opacity-40 group-hover:opacity-100 hover:text-indigo-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </span>
              ))}
              <input 
                type="text" 
                placeholder="+ Add tag..."
                className="bg-transparent border-none text-xs text-slate-400 placeholder:text-slate-300 focus:ring-0 w-24 p-1"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
