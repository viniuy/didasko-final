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
import { Trash, Edit, Plus, CalendarIcon } from 'lucide-react';
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

  const previousStatus = useRef(status);

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);

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
      console.log('Starting to fetch notes...');
      setIsLoading(true);

      // Direct API call without user ID
      const response = await fetch('/api/notes');
      console.log('Notes response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched notes data:', data);

        if (Array.isArray(data.notes)) {
          const processedNotes = data.notes.map((note: any) => ({
            ...note,
            date: new Date(note.date),
          }));
          setNoteList(processedNotes);
        } else {
          console.error('Notes data is not an array:', data.notes);
          setNoteList([]);
        }
      } else {
        throw new Error('Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch notes',
        variant: 'destructive',
      });
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
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    const result = await handleSaveNewNote(
      {
        title: newNote.title,
        description: newNote.description || '',
        date: newNote.date,
      },
      session?.user?.id || '',
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
      toast({
        title: 'Success',
        description: 'Note added successfully',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to add note',
        variant: 'destructive',
      });
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

      // Direct API call to delete the note using the ID in the URL path
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

        toast({
          title: 'Success',
          description: 'Note deleted successfully',
        });
      } else {
        console.log('Failed to delete note');
        toast({
          title: 'Error',
          description: 'Failed to delete note',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error in confirmDelete:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the note',
        variant: 'destructive',
      });
    }
  }

  function handleEditClick(note: Note) {
    setEditData(note);
    setOpenEdit(true);
  }

  const saveEdit = async () => {
    if (!editData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    const result = await handleUpdateNote(
      {
        id: editData.id,
        title: editData.title,
        description: editData.description || '',
        date: editData.date,
      },
      session?.user?.id || '',
      () => {
        setOpenEdit(false);
        refreshNotes();
      },
    );

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Note updated successfully',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update note',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='mb-2'>
      <h2 className='text-lg font-semibold text-[#FAEDCB] mb-1'>Notes</h2>
      <div className='bg-white rounded-lg p-2 shadow-md h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#124A69] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#0a2f42]'>
        <div className='absolute right-7 '>
          <Button
            variant='ghost'
            size='icon'
            className='w-6 h-6 rounded-full bg-[#124A69] text-white flex items-center justify-center hover:bg-[#0a2f42]'
            onClick={handleAddClick}
          >
            <Plus className='w-3 h-3' />
          </Button>
        </div>

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
          <p className='text-gray-500 text-xs text-center'>No notes yet.</p>
        )}
      </div>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setOpenDelete(false)}
              className='bg-gray-100 text-gray-700 hover:bg-gray-200'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-[#124A69] text-white hover:bg-[#0a2f42]'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Note</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='space-y-2'>
            <Label className='text-medium'>Title *</Label>
            <Input
              placeholder='Title'
              value={editData.title}
              onChange={(e) => {
                if (e.target.value.length <= 15) {
                  setEditData({ ...editData, title: e.target.value });
                }
              }}
            />
            <p className='text-xs flex justify-end mt-2 text-gray-500'>
              {editData.title.length}/15
            </p>

            <Label className='text-medium'>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='w-full flex justify-between'
                >
                  {editData.date ? format(editData.date, 'PPP') : 'Pick a date'}
                  <CalendarIcon className='ml-2 h-4 w-4' />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='start' className='w-auto p-0'>
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

            <Label className='text-medium'>Content</Label>
            <Textarea
              placeholder='Add your note content'
              className='resize-none min-h-[100px] max-h-[100px] overflow-y-auto w-full break-words'
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
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setOpenEdit(false)}
              className='bg-gray-100 text-gray-700 hover:bg-gray-200'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={saveEdit}
              className='bg-[#124A69] text-white hover:bg-[#0a2f42]'
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openAdd} onOpenChange={setOpenAdd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Note</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='space-y-2'>
            <div>
              <Label className='text-medium'>Title *</Label>
              <Input
                placeholder='Title'
                value={newNote.title}
                onChange={(e) => {
                  if (e.target.value.length <= 15) {
                    setNewNote({ ...newNote, title: e.target.value });
                  }
                }}
              />
              <p className='text-xs flex justify-end mt-2 text-gray-500'>
                {newNote.title.length}/15
              </p>
            </div>

            <div>
              <Label className='text-medium'>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full flex justify-between'
                  >
                    {newNote.date ? format(newNote.date, 'PPP') : 'Pick a date'}
                    <CalendarIcon className='ml-2 h-4 w-4' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align='start' className='w-auto p-0'>
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
              <Label className='text-medium'>Content</Label>
              <Textarea
                placeholder='Add your note content'
                className='resize-none min-h-[100px] max-h-[200px] overflow-y-auto w-full break-words whitespace-pre-wrap'
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
              className='bg-gray-100 text-gray-700 hover:bg-gray-200'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={saveNewNote}
              className='bg-[#124A69] text-white hover:bg-[#0a2f42]'
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
