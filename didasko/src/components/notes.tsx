'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import {
  Trash,
  Edit,
  Plus,
  CalendarIcon,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  handleSaveNewNote,
  handleUpdateNote,
  handleDeleteNote,
} from '@/lib/note-handlers';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  description: string | null;
  date: Date;
}

export default function Notes() {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [noteList, setNoteList] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [openDelete, setOpenDelete] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState<Note>({
    id: '',
    title: '',
    description: '',
    date: new Date(),
  });
  const [openAdd, setOpenAdd] = useState(false);
  const [newNote, setNewNote] = useState<Note>({
    id: '',
    title: '',
    description: '',
    date: new Date(),
  });
  const [openEditDatePicker, setOpenEditDatePicker] = useState(false);
  const [openAddDatePicker, setOpenAddDatePicker] = useState(false);

  const previousStatus = useRef(status);

  const [alert, setAlert] = useState<{
    show: boolean;
    title: string;
    description: string;
    variant: 'success' | 'error';
  }>({
    show: false,
    title: '',
    description: '',
    variant: 'success',
  });

  const showAlert = (
    title: string,
    description: string,
    variant: 'success' | 'error' = 'success',
  ) => {
    setAlert({
      show: true,
      title,
      description,
      variant,
    });

    setTimeout(() => {
      setAlert((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    // Only fetch notes once when component mounts or session changes from unauthenticated to authenticated
    if (
      !noteList.length ||
      (status === 'authenticated' &&
        previousStatus.current === 'unauthenticated')
    ) {
      fetchNotes();
    }

    // Keep track of previous status to detect meaningful changes
    previousStatus.current = status;
  }, [status, session]);

  async function fetchNotes() {
    try {
      setIsLoading(true);

      const response = await fetch('/api/notes');

      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data.notes)) {
          const processedNotes = data.notes.map((note: any) => ({
            ...note,
            date: new Date(note.date),
          }));
          setNoteList(processedNotes);
        } else {
          setNoteList([]);
        }
      } else {
        throw new Error('Failed to fetch notes');
      }
    } catch (error) {
      showAlert('Error', 'Failed to fetch notes', 'error');
      setNoteList([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Create a manual refresh function that can be called when needed
  const refreshNotes = async () => {
    setIsLoading(true);
    await fetchNotes();
    setIsLoading(false);
  };

  // Skeleton UI for loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className='mb-2'>
        <h2 className='text-lg font-semibold text-[#FAEDCB] mb-1'>Notes</h2>
        <div className='bg-white rounded-lg p-2 shadow-md h-70 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#124A69] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#0a2f42]'>
          <div className='absolute right-7'>
            <div className='w-6 h-6 rounded-full bg-gray-200 animate-pulse'></div>
          </div>

          <div className='space-y-3 mt-1'>
            {/* Date header skeleton */}
            <div className='h-4 w-32 bg-gray-200 rounded animate-pulse'></div>

            {/* Just 2 note item skeletons */}
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className='border-l-[8px] border-gray-200 rounded-md p-2 mb-2'
              >
                <div className='flex justify-between'>
                  <div className='w-full'>
                    <div className='h-3 w-24 bg-gray-200 rounded animate-pulse mb-1'></div>
                    <div className='h-2 w-2/3 bg-gray-100 rounded animate-pulse'></div>
                  </div>
                  <div className='flex space-x-1'>
                    <div className='w-4 h-4 bg-gray-200 rounded-full animate-pulse'></div>
                    <div className='w-4 h-4 bg-gray-200 rounded-full animate-pulse'></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <div>Please sign in to view notes</div>;
  }

  function handleAddClick() {
    setOpenAdd(true);
  }

  const saveNewNote = async () => {
    if (!newNote.title.trim()) {
      showAlert('Error', 'Title is required', 'error');
      return;
    }

    if (!session?.user?.id) {
      showAlert('Error', 'User ID not found. Please sign in again.', 'error');
      return;
    }

    const result = await handleSaveNewNote(
      {
        title: newNote.title,
        description: newNote.description || '',
        date: newNote.date,
      },
      session.user.id,
      () => {
        setOpenAdd(false);
        setNewNote({
          id: '',
          title: '',
          description: '',
          date: new Date(),
        });
        refreshNotes();
      },
    );

    if (result.success) {
      showAlert('Success', 'Note added successfully', 'success');
    } else {
      showAlert('Error', result.error || 'Failed to add note', 'error');
    }
  };

  function handleDeleteClick(noteId: string) {
    setNoteToDelete(noteId);
    setOpenDelete(true);
  }

  async function confirmDelete() {
    try {
      console.log('Confirm delete called for note ID:', noteToDelete);

      if (!noteToDelete) {
        console.log('No note ID to delete');
        return;
      }

      const response = await fetch(`/api/notes/${noteToDelete}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);

      const responseText = await response.text();
      console.log('Delete response text:', responseText);

      if (response.ok) {
        console.log('Note deleted successfully');
        setOpenDelete(false);
        setNoteToDelete(null);
        refreshNotes();
        showAlert('Success', 'Note deleted successfully', 'success');
      } else {
        console.log('Failed to delete note');
        showAlert('Error', 'Failed to delete note', 'error');
      }
    } catch (error) {
      console.error('Error in confirmDelete:', error);
      showAlert('Error', 'An error occurred while deleting the note', 'error');
    }
  }

  function handleEditClick(note: Note) {
    setEditData(note);
    setOpenEdit(true);
  }

  const saveEdit = async () => {
    if (!editData.title.trim()) {
      showAlert('Error', 'Title is required', 'error');
      return;
    }

    if (!session?.user?.id) {
      showAlert('Error', 'User ID not found. Please sign in again.', 'error');
      return;
    }

    const result = await handleUpdateNote(
      {
        id: editData.id,
        title: editData.title,
        description: editData.description || '',
        date: editData.date,
      },
      session.user.id,
      () => {
        setOpenEdit(false);
        refreshNotes();
      },
    );

    if (result.success) {
      showAlert('Success', 'Note updated successfully', 'success');
    } else {
      showAlert('Error', result.error || 'Failed to update note', 'error');
    }
  };

  return (
    <div className='mb-2'>
      {alert.show && (
        <div className='fixed top-4 right-4 z-50 w-80 animate-in fade-in slide-in-from-top-2'>
          <Alert
            variant={alert.variant === 'success' ? 'default' : 'destructive'}
            className={cn(
              'relative border-l-4',
              alert.variant === 'success'
                ? 'border-l-[#124A69] bg-[#F0F7FA] text-[#124A69]'
                : 'border-l-red-500 bg-red-50 text-red-800',
            )}
          >
            <div className='flex items-start gap-3'>
              {alert.variant === 'success' ? (
                <CheckCircle2 className='h-4 w-4 text-[#124A69] mt-0.5' />
              ) : (
                <AlertCircle className='h-4 w-4 text-red-500 mt-0.5' />
              )}
              <div className='flex-1'>
                <AlertDescription className='text-sm font-medium'>
                  {alert.description}
                </AlertDescription>
              </div>
              <Button
                variant='ghost'
                size='icon'
                className={cn(
                  'absolute right-1 top-1 h-6 w-6 p-0 hover:bg-transparent',
                  alert.variant === 'success'
                    ? 'text-[#124A69] hover:text-[#0a2f42]'
                    : 'text-red-500 hover:text-red-700',
                )}
                onClick={() => setAlert((prev) => ({ ...prev, show: false }))}
              >
                <X className='h-3 w-3' />
              </Button>
            </div>
          </Alert>
        </div>
      )}
      <div className='flex justify-between items-center mb-1'>
        <h2 className='text-lg font-semibold text-[#FAEDCB] mb-1'>Notes</h2>
        <Button
          variant='ghost'
          size='icon'
          className='w-6 h-6 rounded-full bg-[#124A69] text-white flex items-center justify-center hover:bg-[#0a2f42]'
          onClick={handleAddClick}
        >
          <Plus className='w-3 h-3' />
        </Button>
      </div>
      <div className='bg-white rounded-lg p-2 shadow-md h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#124A69] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#0a2f42]'>
        {noteList.length > 0 ? (
          (() => {
            // Group notes by date while preserving order
            const groupedNotes: { [key: string]: Note[] } = {};
            noteList.forEach((note) => {
              const dateKey = format(note.date, 'yyyy-MM-dd');
              if (!groupedNotes[dateKey]) {
                groupedNotes[dateKey] = [];
              }
              groupedNotes[dateKey].push(note);
            });

            // Sort dates (newest first)
            const sortedDates = Object.keys(groupedNotes).sort(
              (a, b) => new Date(b).getTime() - new Date(a).getTime(),
            );

            return sortedDates.map((dateKey) => (
              <div key={dateKey}>
                <div className='flex items-center gap-2 text-[#124A69] mb-1'>
                  <p className='text-xs'>
                    {format(new Date(dateKey), 'MMMM d, yyyy')} (
                    {format(new Date(dateKey), 'EEEE')})
                  </p>
                </div>
                {groupedNotes[dateKey].map((note) => (
                  <Card
                    key={note.id}
                    className='border-l-[8px] border-[#FAEDCB] mb-1 hover:shadow-md transition-shadow'
                  >
                    <CardContent className='p-2 relative'>
                      <div className='absolute right-1 -top-5 flex gap-0.5'>
                        <Button
                          variant='ghost'
                          className='h-5 w-5 p-0 hover:bg-transparent'
                          onClick={() => handleEditClick(note)}
                        >
                          <Edit className='h-3 w-3' color='#124a69' />
                        </Button>
                        <Button
                          variant='ghost'
                          className='h-5 w-5 p-0 hover:bg-transparent'
                          onClick={() => handleDeleteClick(note.id)}
                        >
                          <Trash className='h-3 w-3' color='#124a69' />
                        </Button>
                      </div>
                      <div className='-mt-4 -mb-4'>
                        <div className='text-[#124A69] font-medium text-xs mb-0.5'>
                          {note.title}
                        </div>
                        <div className='text-gray-600 text-[11px] whitespace-pre-wrap'>
                          {note.description}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ));
          })()
        ) : (
          <div className='flex items-center justify-center h-full min-h-[200px]'>
            <p className='text-gray-500 text-xs text-center'>No notes yet.</p>
          </div>
        )}
      </div>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent className=''>
          <AlertDialogHeader className=''>
            <AlertDialogTitle className='text-xl font-semibold'>
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-gray-600'>
              This action cannot be undone. This will permanently delete the
              note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='gap-2'>
            <AlertDialogCancel
              onClick={() => setOpenDelete(false)}
              className='border-0 bg-gray-100 hover:bg-gray-200 text-gray-900'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-[#124A69] hover:bg-[#0a2f42] text-white'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
        <AlertDialogContent className='max-w-[425px] w-full h-[500px]'>
          <AlertDialogHeader className='space-y-3'>
            <AlertDialogTitle className='text-xl font-semibold'>
              Edit Note
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className='space-y-4'>
            <div>
              <Label className='text-sm font-medium mb-2 block'>Title *</Label>
              <Input
                placeholder='Title'
                value={editData.title}
                onChange={(e) => {
                  if (e.target.value.length <= 15) {
                    setEditData({ ...editData, title: e.target.value });
                  }
                }}
                className='rounded-lg'
              />
              <p className='text-xs flex justify-end mt-2 text-gray-500'>
                {editData.title.length}/15
              </p>
            </div>

            <div>
              <Label className='text-sm font-medium mb-2 block'>Date *</Label>
              <Popover
                modal
                open={openEditDatePicker}
                onOpenChange={setOpenEditDatePicker}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full flex justify-between rounded-lg'
                  >
                    {editData.date
                      ? format(editData.date, 'PPP')
                      : 'Pick a date'}
                    <CalendarIcon className='ml-2 h-4 w-4' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align='start'
                  className='w-auto p-0'
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Calendar
                    mode='single'
                    selected={editData.date}
                    onSelect={(date) =>
                      setEditData({ ...editData, date: date || new Date() })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className='text-sm font-medium mb-2 block'>Content</Label>
              <Textarea
                placeholder='Add your note content'
                className='resize-none min-h-[100px] max-h-[100px] overflow-y-auto w-full break-words rounded-lg'
                value={editData.description || ''}
                onChange={(e) => {
                  if (e.target.value.length <= 30) {
                    setEditData({ ...editData, description: e.target.value });
                  }
                }}
              />
              <p className='text-xs flex justify-end mt-2 text-gray-500'>
                {(editData.description || '').length}/30
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setOpenAdd(false)}
              className='bg-gray-100 text-gray-700 hover:bg-gray-200 h-8 text-xs'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={saveEdit}
              className='bg-[#124A69] text-white hover:bg-[#0a2f42] h-8 text-xs'
              disabled={!editData.title.trim()}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openAdd} onOpenChange={setOpenAdd}>
        <AlertDialogContent className='max-w-[425px] w-full h-[500px]'>
          <AlertDialogHeader className='space-y-3'>
            <AlertDialogTitle className='text-xl font-semibold'>
              Add New Note
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className='space-y-4'>
            <div>
              <Label className='text-sm font-medium mb-2 block'>Title *</Label>
              <Input
                placeholder='Title'
                value={newNote.title}
                onChange={(e) => {
                  if (e.target.value.length <= 15) {
                    setNewNote({ ...newNote, title: e.target.value });
                  }
                }}
                className='rounded-lg'
              />
              <p className='text-xs flex justify-end mt-2 text-gray-500'>
                {newNote.title.length}/15
              </p>
            </div>

            <div>
              <Label className='text-sm font-medium mb-2 block'>Date *</Label>
              <Popover
                modal
                open={openAddDatePicker}
                onOpenChange={setOpenAddDatePicker}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full flex justify-between rounded-lg'
                  >
                    {newNote.date ? format(newNote.date, 'PPP') : 'Pick a date'}
                    <CalendarIcon className='ml-2 h-4 w-4' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align='start'
                  className='w-auto p-0'
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Calendar
                    mode='single'
                    selected={newNote.date}
                    onSelect={(date) =>
                      setNewNote({ ...newNote, date: date || new Date() })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className='text-sm font-medium mb-2 block'>Content</Label>
              <Textarea
                placeholder='Add your note content'
                className='resize-none min-h-[100px] max-h-[200px] overflow-y-auto w-full break-words whitespace-pre-wrap rounded-lg'
                value={newNote.description || ''}
                onChange={(e) => {
                  if (e.target.value.length <= 30) {
                    setNewNote({ ...newNote, description: e.target.value });
                  }
                }}
              />
              <p className='text-xs flex justify-end mt-2 text-gray-500'>
                {(newNote.description || '').length}/30
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setOpenAdd(false)}
              className='bg-gray-100 text-gray-700 hover:bg-gray-200 h-8 text-xs'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={saveNewNote}
              className='bg-[#124A69] text-white hover:bg-[#0a2f42] h-8 text-xs'
              disabled={!newNote.title.trim()}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
