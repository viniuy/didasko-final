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
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { toast as sonnerToast, Toaster } from 'sonner';
import { Trash, Edit, Plus, CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
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

export default function Notes() {
  const { toast } = useToast();
  const today = new Date();
  const [noteList, setNoteList] = useState<Note[]>([
    {
      title: "Welcome Note",
      content: "This is a sample note to help you get started.",
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
      title: "Note added successfully",
      description: "Your new note has been added.",
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
        title: "Note deleted successfully",
        description: "The note has been removed.",
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
      title: "Note updated successfully",
      description: "Your note has been updated.",
    });
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
              const sortedDates = Object.keys(groupedNotes).sort((a, b) => 
                new Date(b).getTime() - new Date(a).getTime()
              );

              return sortedDates.map((dateKey) => (
                <div key={dateKey}>
                  <div className='flex items-center gap-2 text-[#124A69] mb-1'>
                    <p className='text-xs'>
                      {format(new Date(dateKey), 'MMMM d, yyyy')} ({format(new Date(dateKey), 'EEEE')})
                    </p>
                  </div>
                  {groupedNotes[dateKey].map((note, index) => (
                    <Card
                      key={`${dateKey}-${index}`}
                      className='border-l-[8px] border-[#FAEDCB] mb-1 hover:shadow-md transition-shadow'
                    >
                      <CardContent className='p-2 relative'>
                        <div className='absolute right-1 -top-5 flex gap-0.5'>
                          <Button
                            variant='ghost'
                            className='h-5 w-5 p-0 hover:bg-transparent'
                            onClick={() => handleEditClick(noteList.indexOf(note))}
                          >
                            <Edit className='h-3 w-3' color='#124a69' />
                          </Button>
                          <Button
                            variant='ghost'
                            className='h-5 w-5 p-0 hover:bg-transparent'
                            onClick={() => handleDeleteClick(noteList.indexOf(note))}
                          >
                            <Trash className='h-3 w-3' color='#124a69' />
                          </Button>
                        </div>
                        <div className='-mt-4 -mb-4'>
                          <div className='text-[#124A69] font-medium text-xs mb-0.5'>{note.title}</div>
                          <div className='text-gray-600 text-[11px] whitespace-pre-wrap'>{note.content}</div>
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
      </div>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setOpenDelete(false)}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-[#124A69] text-white hover:bg-[#0a2f42]"
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
                  setEditData({ ...editData, title: e.target.value })
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
                  onSelect={(date) => setEditData({ ...editData, date: date || new Date() })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Label className='text-medium'>Content</Label>
            <Textarea
              placeholder='Add your note content'
              className='resize-none min-h-[100px] max-h-[100px] overflow-y-auto w-full break-words'
              value={editData.content}
              onChange={(e) => {
                if (e.target.value.length <= 30) {
                  setEditData({ ...editData, content: e.target.value })
                }
              }}
            />
            <p className='text-xs flex justify-end mt-2 text-gray-500'>
              {editData.content.length}/30
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setOpenEdit(false)}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={saveEdit}
              className="bg-[#124A69] text-white hover:bg-[#0a2f42]"
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
                    setNewNote({ ...newNote, title: e.target.value })
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
                    onSelect={(date) => setNewNote({ ...newNote, date: date || new Date() })}
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
                value={newNote.content}
                onChange={(e) => {
                  if (e.target.value.length <= 30) {
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                }}
              />
              <p className='text-xs flex justify-end mt-2 text-gray-500'>
                {newNote.content.length}/30
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setOpenAdd(false)}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={saveNewNote}
              className="bg-[#124A69] text-white hover:bg-[#0a2f42]"
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
