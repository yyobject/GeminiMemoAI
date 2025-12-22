
import React from 'react';
import { Note } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, onToggleFavorite, onDelete }) => {
  const preview = note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content;

  return (
    <div 
      onClick={() => onClick(note)}
      className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col h-full hover:shadow-md active:scale-[0.98]"
      style={{ borderLeftColor: note.color || '#e2e8f0', borderLeftWidth: note.color ? '4px' : '1px' }}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-slate-800 text-lg line-clamp-2 pr-8">{note.title || 'Untitled Note'}</h3>
        <button 
          onClick={(e) => onToggleFavorite(note.id, e)}
          className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${note.isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300 opacity-0 group-hover:opacity-100'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={note.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </button>
      </div>

      <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-grow line-clamp-4">
        {preview || <span className="text-slate-300 italic">No content...</span>}
      </p>

      <div className="mt-auto pt-4 flex flex-wrap gap-2 items-center border-t border-slate-50">
        {note.tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-medium rounded-md uppercase tracking-wider">
            #{tag}
          </span>
        ))}
        <div className="flex-grow"></div>
        <span className="text-[11px] text-slate-400 font-medium">
          {formatDistanceToNow(note.updatedAt)} ago
        </span>
        <button 
          onClick={(e) => onDelete(note.id, e)}
          className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ml-2"
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  );
};

export default NoteCard;
