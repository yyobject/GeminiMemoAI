
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  color?: string;
}

export enum AIServiceType {
  SUMMARIZE = 'summarize',
  EXPAND = 'expand',
  FIX_GRAMMAR = 'fix_grammar',
  SUGGEST_TAGS = 'suggest_tags'
}

export interface AISuggestion {
  content: string;
  tags?: string[];
}
