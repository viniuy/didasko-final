'use client';

import { useState } from 'react';
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

interface Note {
  title: string;
  content: string;
  date: Date;
}

// NoteCard component for displaying individual notes
interface NoteCardProps {
  note: Note;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  index: number;
}

function NoteCard({ note, onEdit, onDelete, index }: NoteCardProps) {
  return (
    <Card className='mb-2'>
      <CardContent className='p-3'>
        <div className='flex justify-between items-start'>
          <div>
            <h3 className='font-medium text-[#124A69]'>{note.title}</h3>
            <p className='text-sm text-gray-500'>
              {format(note.date, 'MMMM d, yyyy')}
            </p>
          </div>
          <div className='flex space-x-1'>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => onEdit(index)}
            >
              <Edit className='h-4 w-4 text-[#124A69]' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => onDelete(index)}
            >
              <Trash className='h-4 w-4 text-red-500' />
            </Button>
          </div>
        </div>
        <p className='mt-2 text-sm text-gray-700 whitespace-pre-line'>
          {note.content}
        </p>
      </CardContent>
    </Card>
  );
}

export default function Notes() {
  const { toast } = useToast();
  const [noteList, setNoteList] = useState<Note[]>([
    {
      title: 'Welcome Note',
      content: 'This is a sample note to help you get started.',
      date: new Date(),
    },
  ]);

  const [openDelete, setOpenDelete] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState<Note>({
    title: '',
    content: '',
    date: new Date(),
  });
  const [openAdd, setOpenAdd] = useState(false);
  const [newNote, setNewNote] = useState<Note>({
    title: '',
    content: '',
    date: new Date(),
  });

  function handleAddClick() {
    setOpenAdd(true);
  }

  function saveNewNote() {
    if (!newNote.title || !newNote.date) return;

    const updatedNotes = [...noteList];

    // Add new note at the end
    updatedNotes.push({
      title: newNote.title,
      content: newNote.content,
      date: newNote.date,
    });

    // Sort notes by date (newest first), but maintain order within same date
    updatedNotes.sort((a, b) => {
      const dateA = format(a.date, 'yyyy-MM-dd');
      const dateB = format(b.date, 'yyyy-MM-dd');
      if (dateA === dateB) {
        // If same date, maintain the order (newer additions at the end)
        return 0;
      }
      // Otherwise sort by date
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    setNoteList(updatedNotes);
    setOpenAdd(false);
    setNewNote({ title: '', content: '', date: new Date() });

    toast({
      title: 'Note added successfully',
      description: 'Your new note has been added.',
    });
  }

  function handleDeleteClick(index: number) {
    setNoteToDelete(index);
    setOpenDelete(true);
  }

  function confirmDelete() {
    if (noteToDelete !== null) {
      const updatedNotes = [...noteList];
      updatedNotes.splice(noteToDelete, 1);
      setNoteList(updatedNotes);
      setOpenDelete(false);
      setNoteToDelete(null);

      toast({
        title: 'Note deleted successfully',
        description: 'The note has been removed.',
      });
    }
  }

  function handleEditClick(index: number) {
    const note = noteList[index];
    setEditData({
      title: note.title,
      content: note.content,
      date: note.date,
    });
    setOpenEdit(true);
  }

  function saveEdit() {
    if (!editData.title) return;

    const updatedNotes = [...noteList];
    updatedNotes[noteToDelete!] = {
      title: editData.title,
      content: editData.content,
      date: editData.date,
    };

    setNoteList(updatedNotes);
    setOpenEdit(false);

    toast({
      title: 'Note updated successfully',
      description: 'Your note has been updated.',
    });
  }

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
        <div className='space-y-2 mt-2'>
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
                  <h3 className='text-sm font-medium text-gray-500 mb-1'>
                    {format(new Date(dateKey), 'MMMM d, yyyy')}
                  </h3>
                  {groupedNotes[dateKey].map((note) => {
                    const globalIndex = noteList.findIndex((n) => n === note);
                    return (
                      <NoteCard
                        key={globalIndex}
                        note={note}
                        index={globalIndex}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                      />
                    );
                  })}
                </div>
              ));
            })()
          ) : (
            <p className='text-center text-gray-500 py-4'>
              No notes yet. Add your first note!
            </p>
          )}
        </div>
      </div>

      {/* Add Note Dialog */}
      <AlertDialog open={openAdd} onOpenChange={setOpenAdd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Note</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Title</Label>
              <Input
                id='title'
                value={newNote.title}
                onChange={(e) =>
                  setNewNote({ ...newNote, title: e.target.value })
                }
                placeholder='Enter note title'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='content'>Content</Label>
              <Textarea
                id='content'
                value={newNote.content}
                onChange={(e) =>
                  setNewNote({ ...newNote, content: e.target.value })
                }
                placeholder='Enter note content'
                rows={4}
              />
            </div>
            <div className='space-y-2'>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-start text-left font-normal'
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {newNote.date ? (
                      format(newNote.date, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={newNote.date}
                    onSelect={(date) =>
                      date && setNewNote({ ...newNote, date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveNewNote}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Note Dialog */}
      <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Note</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-title'>Title</Label>
              <Input
                id='edit-title'
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
                placeholder='Enter note title'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-content'>Content</Label>
              <Textarea
                id='edit-content'
                value={editData.content}
                onChange={(e) =>
                  setEditData({ ...editData, content: e.target.value })
                }
                placeholder='Enter note content'
                rows={4}
              />
            </div>
            <div className='space-y-2'>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-start text-left font-normal'
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {editData.date ? (
                      format(editData.date, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={editData.date}
                    onSelect={(date) =>
                      date && setEditData({ ...editData, date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveEdit}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
