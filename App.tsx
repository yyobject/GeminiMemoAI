
import React, { useState, useEffect, useMemo } from 'react';
import { Note } from './types';
import NoteCard from './components/NoteCard';
import NoteEditor from './components/NoteEditor';
// Added checkIsOnPlatform to imports
import { storage, UserInfo, checkIsOnPlatform } from './lib/platform';

const STORAGE_KEY = 'gemini-notes-v1';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  // Load from Platform Storage
  useEffect(() => {
    const initApp = async () => {
      await storage.init();
      const [savedNotes, currentUser] = await Promise.all([
        storage.get<Note[]>(STORAGE_KEY),
        storage.getUser()
      ]);
      
      if (savedNotes) {
        setNotes(savedNotes);
      }
      setUser(currentUser);
      setIsLoaded(true);
    };
    initApp();
  }, []);

  // Sync to Platform Storage on change
  useEffect(() => {
    if (isLoaded) {
      storage.set(STORAGE_KEY, notes);
    }
  }, [notes, isLoaded]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             note.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = !selectedTag || note.tags.includes(selectedTag);
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, searchQuery, selectedTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [notes]);

  const createNewNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false,
    };
    setEditingNote(newNote);
  };

  const handleSaveNote = (updatedNote: Note) => {
    setNotes(prev => {
      const index = prev.findIndex(n => n.id === updatedNote.id);
      if (index > -1) {
        const newNotes = [...prev];
        newNotes[index] = updatedNote;
        return newNotes;
      }
      return [updatedNote, ...prev];
    });
    setEditingNote(null);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isFavorite: !n.isFavorite, updatedAt: Date.now() } : n));
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium animate-pulse text-lg">Initializing Gemini Workspace...</div>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar - Desktop Only */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-100 flex-shrink-0 flex flex-col h-screen sticky top-0 hidden md:flex">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9z"></path><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gemini Memo</h1>
          </div>

          <nav className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">View</p>
              <div className="space-y-1">
                <button 
                  onClick={() => setSelectedTag(null)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${!selectedTag ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  All Notes
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Labels</p>
              <div className="space-y-1 max-h-[40vh] overflow-y-auto no-scrollbar">
                {allTags.length === 0 ? (
                  <p className="px-4 text-xs text-slate-300 italic">No tags yet</p>
                ) : (
                  allTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedTag === tag ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      #{tag}
                    </button>
                  ))
                )}
              </div>
            </div>
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-50">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Demo User'}</p>
              {/* Fix: checkIsOnPlatform is now imported from ./lib/platform */}
              <p className="text-[10px] text-slate-400 font-medium truncate">{checkIsOnPlatform() ? 'Cloud Sync Enabled' : 'Local Storage Mode'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col h-screen overflow-hidden bg-slate-50/50">
        {/* Top Header */}
        <header className="px-6 md:px-10 py-6 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {selectedTag ? `Notes tagged #${selectedTag}` : 'My Workspace'}
            </h2>
            <p className="text-sm text-slate-400 font-medium">{filteredNotes.length} notes available</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group flex-grow md:flex-grow-0">
              <input 
                type="text" 
                placeholder="Search notes..."
                className="w-full md:w-64 bg-white border border-slate-100 rounded-xl px-10 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            
            <button 
              onClick={createNewNote}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              New Note
            </button>
          </div>
        </header>

        {/* Notes Grid */}
        <div className="px-6 md:px-10 pb-20 overflow-y-auto flex-grow scroll-smooth">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-slate-300"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <p className="text-xl font-medium text-slate-500">No notes found matching your criteria</p>
              <button onClick={() => {setSearchQuery(''); setSelectedTag(null)}} className="mt-4 text-indigo-600 font-semibold hover:underline">Clear all filters</button>
            </div>
          ) : (
            <div className="masonry-grid pb-20">
              {filteredNotes.map(note => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onClick={setEditingNote}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteNote}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Editor Modal */}
      {editingNote && (
        <NoteEditor 
          note={editingNote} 
          onSave={handleSaveNote}
          onClose={() => setEditingNote(null)}
        />
      )}

      {/* Floating Action Button (Mobile Only) */}
      <button 
        onClick={createNewNote}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center animate-bounce duration-1000"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>
  );
};

export default App;
