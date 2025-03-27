'use client';

import { useState } from 'react';
import { Clock, Plus, Trash, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Toaster, toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface EventProps {
  id: number;
  date: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

function formatTime(time: string) {
  if (!time) return '';
  const [hour, minute] = time.split(':');
  let hourNum = parseInt(hour, 10);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  hourNum = hourNum % 12 || 12;
  return `${hourNum}:${minute} ${ampm}`;
}

function Event({
  id,
  title,
  description,
  startTime,
  endTime,
  onDelete,
  onEdit,
}: EventProps & {
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}) {
  return (
    <div className='p-3 bg-gray-50 rounded-lg shadow-sm relative'>
      <div className='absolute top-2 right-2 flex space-x-2'>
        <Button
          variant='outline'
          size='icon'
          onClick={() => onEdit(id)}
          className='text-black'
        >
          <Edit size={16} />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='outline' size='icon' className='text-black'>
              <Trash size={16} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                event.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                className='bg-black text-white hover:bg-gray-800'
                onClick={() => onDelete(id)}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className='font-medium'>{title}</div>
      <div className='text-sm text-gray-600'>{description}</div>
      <div className='flex items-center text-xs text-gray-500 mt-1'>
        <Clock size={12} className='mr-1' />
        {formatTime(startTime)} - {formatTime(endTime)}
      </div>
    </div>
  );
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export default function UpcomingEvents() {
  const [events, setEvents] = useState<EventProps[]>([]);
  const [newEvent, setNewEvent] = useState<EventProps>({
    id: 0,
    date: '',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });

  const [open, setOpen] = useState(false);

  const isValidTime = (start: string, end: string) => {
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);

    // If end time is past midnight, add one day
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    return startDate < endDate;
  };

  const addEvent = () => {
    if (
      !newEvent.title.trim() ||
      !newEvent.date.trim() ||
      !newEvent.startTime.trim() ||
      !newEvent.endTime.trim()
    ) {
      toast.error('Please fill in all required fields!');
      return;
    }

    if (!isValidTime(newEvent.startTime, newEvent.endTime)) {
      toast.error('End time must be later than start time!');
      return;
    }

    const formattedDate = formatDate(newEvent.date);

    setEvents((prev) => {
      if (newEvent.id) {
        return prev.map((event) =>
          event.id === newEvent.id
            ? { ...newEvent, date: formattedDate }
            : event,
        );
      } else {
        return [
          {
            ...newEvent,
            id: prev.length ? Math.max(...prev.map((e) => e.id)) + 1 : 1,
            date: formattedDate,
          },
          ...prev,
        ];
      }
    });

    toast.success(
      newEvent.id
        ? `Updated: "${newEvent.title}"`
        : `Added: "${newEvent.title}"`,
    );

    setNewEvent({
      id: 0,
      date: '',
      title: '',
      description: '',
      startTime: '',
      endTime: '',
    });
    setOpen(false);
  };

  const deleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
    toast.error('Event deleted!');
  };

  const editEvent = (id: number) => {
    const eventToEdit = events.find((event) => event.id === id);
    if (eventToEdit) {
      setNewEvent(eventToEdit);
      setOpen(true);
    }
  };

  const groupedEvents = events.reduce(
    (acc: Record<string, EventProps[]>, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    },
    {},
  );

  return (
    <div className='bg-white rounded-lg p-4 shadow-sm mb-4'>
      <Toaster position='top-center' />

      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-lg font-semibold'>Upcoming Events</h2>
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
              <DialogTitle>Add New Event</DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Event Title <span className='text-red-500'>*</span>
                </label>
                <Input
                  type='text'
                  placeholder='Enter event title'
                  value={newEvent.title}
                  onChange={(e) => {
                    if (e.target.value.length <= 15) {
                      setNewEvent({ ...newEvent, title: e.target.value });
                    }
                  }}
                />
                <p className='text-xs text-gray-500'>
                  {newEvent.title.length}/15
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Description (Optional)
                </label>
                <Input
                  type='text'
                  placeholder='Enter description'
                  value={newEvent.description}
                  onChange={(e) => {
                    if (e.target.value.length <= 25) {
                      setNewEvent({ ...newEvent, description: e.target.value });
                    }
                  }}
                />
                <p className='text-xs text-gray-500'>
                  {newEvent.description.length}/25
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Date <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <Input
                    type='date'
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                    min={new Date().toISOString().split('T')[0]}
                    onKeyDown={(e) => e.preventDefault()}
                    onClick={(e) =>
                      (e.currentTarget as HTMLInputElement).showPicker?.()
                    }
                    className='pl-10'
                  />
                  <div className='absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={2}
                      stroke='currentColor'
                      className='w-4 h-4'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M8 7V3m8 4V3m-8 4h8m5 0a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2h18z'
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Time <span className='text-red-500'>*</span>
                </label>
                <div className='flex items-center space-x-2'>
                  <div className='relative w-full'>
                    <Input
                      id='startTime'
                      type='time'
                      value={newEvent.startTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, startTime: e.target.value })
                      }
                      className='pl-10'
                      onKeyDown={(e) => e.preventDefault()} // Prevent manual typing
                    />
                    <button
                      type='button'
                      className='absolute inset-y-0 left-3 flex items-center text-gray-500 cursor-pointer'
                      onClick={() =>
                        (
                          document.getElementById(
                            'startTime',
                          ) as HTMLInputElement
                        )?.showPicker()
                      }
                    >
                      <Clock size={16} />
                    </button>
                  </div>

                  <span className='text-gray-500'>To</span>

                  <div className='relative w-full'>
                    <Input
                      id='endTime'
                      type='time'
                      value={newEvent.endTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, endTime: e.target.value })
                      }
                      disabled={!newEvent.startTime}
                      min={newEvent.startTime}
                      className='pl-10 disabled:bg-gray-200 disabled:cursor-not-allowed'
                      onKeyDown={(e) => e.preventDefault()} // Prevent manual typing
                    />
                    <button
                      type='button'
                      className='absolute inset-y-0 left-3 flex items-center text-gray-500 cursor-pointer'
                      onClick={() =>
                        (
                          document.getElementById('endTime') as HTMLInputElement
                        )?.showPicker()
                      }
                      disabled={!newEvent.startTime}
                    >
                      <Clock size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <Button onClick={addEvent} className='w-full'>
                Save Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className='max-h-60 overflow-y-auto pr-2 space-y-6'>
        {Object.keys(groupedEvents).length > 0 ? (
          Object.entries(groupedEvents)
            .sort(
              ([dateA], [dateB]) =>
                new Date(dateB).getTime() - new Date(dateA).getTime(),
            )
            .map(([date, events]) => (
              <div key={date}>
                <h3 className='text-md font-bold text-gray-700 border-b pb-1 mb-2'>
                  {date}
                </h3>
                <div className='space-y-3'>
                  {events.map((event) => (
                    <Event
                      key={event.id}
                      {...event}
                      onDelete={deleteEvent}
                      onEdit={editEvent}
                    />
                  ))}
                </div>
              </div>
            ))
        ) : (
          <p className='text-sm text-gray-500'>No upcoming events.</p>
        )}
      </div>
    </div>
  );
}
