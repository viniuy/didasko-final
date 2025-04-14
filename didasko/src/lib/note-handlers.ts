import { normalizeDate } from '@/lib/date-utils';

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

    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: noteData.title,
        description: noteData.description,
        date: normalizedDate,
      }),
    });

    if (!response.ok) {
      const responseData = await response.json();
      return {
        success: false,
        error: responseData.error || 'Failed to save note',
      };
    }

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

    const response = await fetch('/api/notes', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: noteData.id,
        title: noteData.title,
        description: noteData.description,
        date: normalizedDate,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to update note' };
    }

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

    const response = await fetch('/api/notes', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: noteId }),
    });

    console.log('Delete response status:', response.status);

    // For debugging - print response body
    const responseText = await response.text();
    console.log('Delete response body:', responseText);

    let responseData;
    try {
      // Try to parse the response as JSON if possible
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { error: 'Could not parse response' };
    }

    if (!response.ok) {
      console.log('Error response:', responseData);
      return {
        success: false,
        error: responseData.error || 'Failed to delete note',
      };
    }

    console.log('Note deleted successfully');
    onSuccess();
    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: 'Failed to delete note' };
  }
}
