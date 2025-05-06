import { normalizeDate } from '@/lib/date-utils';
import axiosInstance from '@/lib/axios';

interface NoteData {
  id?: string;
  title: string;
  description: string;
  date: Date;
}

interface HandlerResult {
  success: boolean;
  error?: string;
}

export async function handleSaveNewNote(
  noteData: NoteData,
  _userId: string,
  onSuccess: () => void,
): Promise<HandlerResult> {
  try {
    if (!noteData.title.trim()) {
      return { success: false, error: 'Title is required' };
    }

    if (!noteData.date) {
      return { success: false, error: 'Date is required' };
    }

    const normalizedDate = normalizeDate(noteData.date);

    await axiosInstance.post('/notes', {
      title: noteData.title,
      description: noteData.description,
      date: normalizedDate,
    });

    onSuccess();
    return { success: true };
  } catch (error) {
    console.error('Error saving note:', error);
    return { success: false, error: 'Failed to save note' };
  }
}

export async function handleUpdateNote(
  noteData: NoteData,
  _userId: string,
  onSuccess: () => void,
): Promise<HandlerResult> {
  try {
    if (!noteData.id) {
      return { success: false, error: 'Note ID is required' };
    }

    if (!noteData.title.trim()) {
      return { success: false, error: 'Title is required' };
    }

    if (!noteData.date) {
      return { success: false, error: 'Date is required' };
    }

    const normalizedDate = normalizeDate(noteData.date);

    const response = await axiosInstance.put('/notes', {
      id: noteData.id,
      title: noteData.title,
      description: noteData.description,
      date: normalizedDate,
    });

    onSuccess();
    return { success: true };
  } catch (error) {
    console.error('Error updating note:', error);
    return { success: false, error: 'Failed to update note' };
  }
}

export async function handleDeleteNote(
  noteId: string,
  _userId: string,
  onSuccess: () => void,
): Promise<HandlerResult> {
  try {
    console.log('Attempting to delete note with ID:', noteId);

    if (!noteId) {
      console.log('Error: Note ID is required');
      return { success: false, error: 'Note ID is required' };
    }

    await axiosInstance.delete('/notes', {
      data: { id: noteId },
    });

    console.log('Note deleted successfully');
    onSuccess();
    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: 'Failed to delete note' };
  }
}
