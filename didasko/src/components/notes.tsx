'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast as sonnerToast, Toaster } from 'sonner';
import { Trash, Edit, Plus } from 'lucide-react';

interface NoteProps {
  id: number;
  date: string;
  content: string;
  subtext?: string;
}

export function Notes() {
  const [notes, setNotes] = useState<NoteProps[]>([
    {
      id: 1,
      date: '2024-02-25',
      content: 'Check Exams (Prelim)',
      subtext: 'BSIT 611',
    },
    {
      id: 2,
      date: '2024-02-25',
      content: 'Prepare lesson plan',
      subtext: 'Topic: React Hooks',
    },
    {
      id: 3,
      date: '2024-02-20',
      content: 'Meeting with Faculty',
      subtext: 'Conference Room 2',
    },
  ]);

  const [newNote, setNewNote] = useState<NoteProps>({
    id: 0,
    date: '',
    content: '',
    subtext: '',
  });
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const saveNote = () => {
    if (!newNote.date.trim() || !newNote.content.trim()) {
      sonnerToast.error('Please fill in all required fields!');
      return;
    }

    setNotes((prevNotes) => {
      if (editMode) {
        return prevNotes.map((note) =>
          note.id === newNote.id ? newNote : note,
        );
      } else {
        const newId = prevNotes.length
          ? Math.max(...prevNotes.map((note) => note.id)) + 1
          : 1;
        return [...prevNotes, { ...newNote, id: newId }];
      }
    });

    sonnerToast.success(
      editMode
        ? `Updated: "${newNote.content}"`
        : `Added: "${newNote.content}"`,
    );

    setNewNote({ id: 0, date: '', content: '', subtext: '' });
    setOpen(false);
    setEditMode(false);
  };

  const editNote = (note: NoteProps) => {
    setNewNote(note);
    setEditMode(true);
    setOpen(true);
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
  };

  const deleteNote = () => {
    if (deleteId === null) return;

    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== deleteId));

    sonnerToast.error('Note deleted!');

    setDeleteId(null);
  };

  // ✅ Sort Notes by Date (Descending) & Group Them
  const sortedNotes = [...notes].sort((a, b) => b.date.localeCompare(a.date));
  const groupedNotes: Record<string, NoteProps[]> = {};
  sortedNotes.forEach((note) => {
    if (!groupedNotes[note.date]) {
      groupedNotes[note.date] = [];
    }
    groupedNotes[note.date].push(note);
  });

  // ✅ Convert YYYY-MM-DD to "Day, Month Year" (e.g., "25 February 2024")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0 = January, 11 = December
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const startOfYear = `${currentYear}-01-01`;
  const endOfYear =
    currentMonth === 11 ? `${currentYear + 1}-12-31` : `${currentYear}-12-31`;

  return (
    <>
      <Toaster position='top-center' />
      <div className='bg-white rounded-lg p-4 shadow-sm max-w-lg mx-auto'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-lg font-semibold'>Notes</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='w-8 h-8 rounded-full bg-[#124A69] text-white flex items-center justify-center'
              >
                <Plus size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editMode ? 'Edit Note' : 'Add a New Note'}
                </DialogTitle>
              </DialogHeader>
              <div className='mb-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Date <span className='text-red-500'>*</span>
                </label>
                <div>
                  <Input
                    type='date'
                    value={newNote.date}
                    onChange={(e) =>
                      setNewNote({ ...newNote, date: e.target.value })
                    }
                    min={today} // Disables past dates
                    onKeyDown={(e) => e.preventDefault()} // Prevents manual typing
                    className='text-gray-900 bg-white border border-gray-300 rounded-md cursor-pointer'
                    placeholder=''
                    onClick={(e) =>
                      e.currentTarget.showPicker
                        ? e.currentTarget.showPicker()
                        : null
                    } // Forces date picker to open on click
                  />
                </div>
              </div>
              <div className='mb-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Title <span className='text-red-500'>*</span>
                </label>
                <Input
                  type='text'
                  placeholder='Enter title'
                  value={newNote.content}
                  onChange={(e) => {
                    if (e.target.value.length <= 15) {
                      setNewNote({ ...newNote, content: e.target.value });
                    }
                  }}
                />
                <p className='text-xs text-gray-500 mt-1 text-left'>
                  {newNote.content.length}/15
                </p>
              </div>

              <div className='mb-4'>
                <label className='text-sm font-medium text-gray-700'>
                  Description (Optional)
                </label>
                <Input
                  type='text'
                  placeholder='Additional details'
                  value={newNote.subtext || ''}
                  onChange={(e) => {
                    if (e.target.value.length <= 25) {
                      setNewNote({ ...newNote, subtext: e.target.value });
                    }
                  }}
                />
                <p className='text-xs text-gray-500 mt-1 text-left'>
                  {newNote.subtext ? newNote.subtext.length : 0}/25
                </p>
              </div>
              <Button onClick={saveNote} className='w-full'>
                {editMode ? 'Update Note' : 'Save Note'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* ✅ Notes List Sorted by Date */}
        <div className='max-h-80 overflow-y-auto'>
          {Object.entries(groupedNotes).map(([date, notes]) => (
            <div key={date} className='mb-4'>
              <h3 className='text-md font-bold text-gray-700 border-b pb-1 mb-2'>
                {formatDate(date)}
              </h3>
              {notes.map((note) => (
                <div
                  key={note.id}
                  className='relative p-4 mb-2 border rounded-lg bg-gray-50'
                >
                  {/* Buttons Fixed at Top-Right */}
                  <div className='absolute top-2 right-2 flex gap-2'>
                    <Button
                      variant='outline'
                      size='icon'
                      onClick={() => editNote(note)}
                    >
                      <Edit size={16} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='outline'
                          size='icon'
                          onClick={() => confirmDelete(note.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <p>Are you sure you want to delete this note?</p>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={deleteNote}
                            className='bg-black text-white hover:bg-gray-800'
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Note Content */}
                  <div className='w-full'>
                    <p className='font-semibold'>{note.content}</p>
                    {note.subtext && (
                      <p className='text-sm text-gray-700 whitespace-pre-wrap break-words overflow-y-auto max-h-24'>
                        {note.subtext}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
