import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export default function UpcomingEvent() {
  const today = new Date();
  const [eventList, setEventList] = useState([
    {
      date: new Date(2025, 0, 1),
      items: [{ title: 'NEW YEAR’S DAY', subtitle: '(Regular Holiday)' }],
    },
    {
      date: new Date(2025, 0, 20),
      items: [
        {
          title: 'MOBSTECH Exam',
          subtitle: 'Proctor for BSIT 611',
          time: '11:30 AM - 1:00 PM',
        },
        {
          title: 'WEBSTECH Exam',
          subtitle: 'Proctor for BSIT 611',
          time: '4:00 PM - 5:30 PM',
        },
      ],
    },
  ]);

  const [openDelete, setOpenDelete] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState({
    eventIndex: null,
    itemIndex: null,
    title: '',
    subtitle: '',
    time: '',
  });
  const [openAdd, setOpenAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    subtitle: '',
    date: null,
    time: '',
  });

  function handleAddClick() {
    setOpenAdd(true);
  }

  function saveNewEvent() {
    if (!newEvent.date || !newEvent.title) return; // Ensure required fields are filled

    // Check if the date already exists
    const existingEventIndex = eventList.findIndex(
      (event) =>
        format(event.date, 'yyyy-MM-dd') ===
        format(newEvent.date, 'yyyy-MM-dd'),
    );

    const updatedEvents = [...eventList];

    if (existingEventIndex !== -1) {
      // Add new item to an existing date
      updatedEvents[existingEventIndex].items.push({
        title: newEvent.title,
        subtitle: newEvent.subtitle,
        time: newEvent.time || '',
      });
    } else {
      // Create a new event entry
      updatedEvents.push({
        date: newEvent.date,
        items: [
          {
            title: newEvent.title,
            subtitle: newEvent.subtitle,
            time: newEvent.time || '',
          },
        ],
      });
    }

    setEventList(updatedEvents);
    setOpenAdd(false);
    setNewEvent({ title: '', subtitle: '', date: null, time: '' }); // Reset fields
  }

  function handleDeleteClick(eventIndex, itemIndex) {
    setEventToDelete({ eventIndex, itemIndex });
    setOpenDelete(true);
  }

  function confirmDelete() {
    if (eventToDelete !== null) {
      const updatedEvents = [...eventList];
      updatedEvents[eventToDelete.eventIndex].items.splice(
        eventToDelete.itemIndex,
        1,
      );

      if (updatedEvents[eventToDelete.eventIndex].items.length === 0) {
        updatedEvents.splice(eventToDelete.eventIndex, 1);
      }

      setEventList(updatedEvents);
      setOpenDelete(false);
    }
  }

  function handleEditClick(eventIndex, itemIndex) {
    const item = eventList[eventIndex].items[itemIndex];
    setEditData({
      eventIndex,
      itemIndex,
      title: item.title,
      subtitle: item.subtitle,
      time: item.time || '',
    });
    setOpenEdit(true);
  }

  function saveEdit() {
    const updatedEvents = [...eventList];
    updatedEvents[editData.eventIndex].items[editData.itemIndex] = {
      title: editData.title,
      subtitle: editData.subtitle,
      time: editData.time || '',
    };

    setEventList(updatedEvents);
    setOpenEdit(false);
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <div className='mb-5 max-w-md'>
      <h2 className='text-3xl font-extrabold text-[#FAEDCB] mb-2'>Events</h2>
      <div className='bg-white rounded-lg p-4 shadow-md max-h-100 overflow-y-auto'>
        <div className='absolute top-9 right-10 flex '>
          <Button
            variant='ghost'
            size='icon'
            className='w-10 h-10 rounded-full bg-[#124A69] text-white flex items-center justify-center'
            onClick={handleAddClick} // Open add event dialog
          >
            <Plus />
          </Button>
        </div>
        {eventList.length > 0 ? (
          eventList.map((event, eventIndex) => (
            <div key={eventIndex} className='mb-4'>
              <p className='text-gray-500 font-medium mb-2'>
                {formatDate(event.date)}
              </p>
              {event.items.map((item, itemIndex) => (
                <Card
                  key={itemIndex}
                  className='border-l-12 border-[#004b6b] mb-2 shadow-md'
                >
                  <CardContent className='pl-3 flex relative '>
                    <div className='absolute right-1 -top-4 flex'>
                      <Button
                        variant='ghost'
                        className='transition-transform w-5 h-5 duration-100 hover:scale-110'
                        onClick={() => handleEditClick(eventIndex, itemIndex)}
                      >
                        <Edit color='#124a69' />
                      </Button>
                      <Button
                        variant='ghost'
                        className='transition-transform w-5 h-5 duration-100 hover:scale-110'
                        onClick={() => handleDeleteClick(eventIndex, itemIndex)}
                      >
                        <Trash color='#124a69' />
                      </Button>
                    </div>
                    <div className='ml-2'>
                      <p className='font-bold text-[#004b6b]'>{item.title}</p>
                      <p className='text-gray-600 text-sm'>{item.subtitle}</p>
                      {item.time && (
                        <div className='flex items-center text-gray-500 text-sm mt-1'>
                          <Clock size={14} className='mr-1' /> {item.time}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
        ) : (
          <p className='text-gray-500 text-center'>No upcoming events.</p>
        )}
      </div>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenDelete(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Event</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='space-y-2'>
            <Label className='text-medium'>Title</Label>
            <Input
              placeholder='Title'
              value={editData.title}
              onChange={(e) =>
                setEditData({ ...editData, title: e.target.value })
              }
            />

            <Label className='text-medium'>Description</Label>
            <Textarea
              placeholder='Add a description'
              className='resize-none'
              value={editData.subtitle}
              onChange={(e) =>
                setEditData({ ...editData, subtitle: e.target.value })
              }
            />

            <Label className='text-medium'>Date & Time</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='w-full flex justify-between w-63'
                >
                  {editData.date ? format(editData.date, 'PPP') : 'Pick a date'}
                  <CalendarIcon className='ml-2 h-4 w-4' />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='start' className='w-auto p-0'>
                <Calendar
                  mode='single'
                  selected={editData.date}
                  onSelect={(date) => setEditData({ ...editData, date })}
                  initialFocus
                  disabled={(date) => date < today}
                />
              </PopoverContent>
            </Popover>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenEdit(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={saveEdit}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openAdd} onOpenChange={setOpenAdd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Event</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='space-y-2'>
            <Label className='text-medium'>Title</Label>
            <Input
              placeholder='Title'
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
            />

            <Label className='text-medium'>Description</Label>
            <Textarea
              placeholder='Add a description'
              className='resize-none'
              value={newEvent.subtitle}
              onChange={(e) =>
                setNewEvent({ ...newEvent, subtitle: e.target.value })
              }
            />

            <Label className='text-medium'>Date & Time</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='w-full flex justify-between'
                >
                  {newEvent.date ? format(newEvent.date, 'PPP') : 'Pick a date'}
                  <CalendarIcon className='ml-2 h-4 w-4' />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='start' className='w-auto p-0'>
                <Calendar
                  mode='single'
                  selected={newEvent.date}
                  onSelect={(date) => setNewEvent({ ...newEvent, date })}
                  initialFocus
                  disabled={(date) => date < today}
                />
              </PopoverContent>
            </Popover>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenAdd(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={saveNewEvent}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
