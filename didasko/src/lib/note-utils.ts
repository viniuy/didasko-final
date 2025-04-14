import { format } from 'date-fns';

export interface NoteItem {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  userId: string;
}

export interface GroupedNote {
  date: Date;
  items: NoteItem[];
}

export interface EditNoteData {
  id: string | null;
  title: string;
  description: string;
  date: Date | null;
}

export interface NewNote {
  title: string;
  description: string;
  date: Date | null;
}

export function groupNotesByDate(notes: any[]): GroupedNote[] {
  const groupedNotes: Record<string, NoteItem[]> = {};

  notes.forEach((note: any) => {
    const dateKey = format(new Date(note.date), 'yyyy-MM-dd');

    if (!groupedNotes[dateKey]) {
      groupedNotes[dateKey] = [];
    }

    groupedNotes[dateKey].push({
      id: note.id,
      title: note.title,
      description: note.description,
      date: new Date(note.date),
      userId: note.userId,
    });
  });

  // Convert to array and sort by date
  const sortedNotes: GroupedNote[] = Object.keys(groupedNotes).map(
    (dateKey) => ({
      date: new Date(dateKey),
      items: groupedNotes[dateKey],
    }),
  );

  sortedNotes.sort((a, b) => a.date.getTime() - b.date.getTime());

  return sortedNotes;
}

export function validateNoteInput(note: NewNote | EditNoteData): {
  isValid: boolean;
  errorMessage: string;
} {
  if (!note.title.trim()) {
    return { isValid: false, errorMessage: 'Title is required' };
  }

  if (!note.date) {
    return { isValid: false, errorMessage: 'Date is required' };
  }

  // Check title length
  if (note.title.length > 100) {
    return {
      isValid: false,
      errorMessage: 'Title cannot be longer than 100 characters',
    };
  }

  // Description length check (if needed)
  if (note.description && note.description.length > 500) {
    return {
      isValid: false,
      errorMessage: 'Description cannot be longer than 500 characters',
    };
  }

  return { isValid: true, errorMessage: '' };
}
