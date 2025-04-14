'use client';

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
import { useEffect, useState } from 'react';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { Role } from '@/lib/types';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { getEvents } from '@/lib/actions/events';

import {
  EventItem,
  GroupedEvent,
  EditData,
  NewEvent,
  validateTime,
  groupEventsByDate,
  formatTimeTo12Hour,
} from '@/lib/event-utils';

import {
  canUserManageEvents,
  handleDeleteEvent,
  handleSaveNewEvent,
  handleUpdateEvent,
} from '@/lib/event-handlers';

export default function UpcomingEvents() {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const userRole = session?.user?.role as Role | undefined;

  const [eventList, setEventList] = useState<GroupedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authorized to manage events
  const canManageEvents = canUserManageEvents(userRole);

  const [openDelete, setOpenDelete] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState<EditData>({
    id: null,
    title: '',
    description: '',
    date: null,
    fromTime: '',
    toTime: '',
    dates: [],
  });

  const [openAdd, setOpenAdd] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: '',
    description: '',
    date: null,
    fromTime: '',
    toTime: '',
    dates: [],
  });

  const [timeError, setTimeError] = useState<string>('');

  // Function to show toast notifications
  const showToast = (
    title: string,
    description: string,
    variant: 'default' | 'destructive' = 'default',
  ) => {
    toast({
      title,
      description,
      variant,
    });
  };

  // Function to refresh events
  const refreshEvents = async () => {
    const { events, error } = await getEvents();

    if (error) {
      showToast('Error', error, 'destructive');
      return false;
    }

    setEventList(groupEventsByDate(events));
    return true;
  };

  // Fetch events from database
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      await refreshEvents();
      setIsLoading(false);
    };

    fetchEvents();
  }, []);

  // Skeleton UI for loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className='mb-2'>
        <h2 className='text-lg font-semibold text-[#FAEDCB] mb-1'>
          Upcoming Events
        </h2>
        <div className='bg-white rounded-lg p-2 shadow-md h-70 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#124A69] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#0a2f42]'>
          <div className='absolute right-7'>
            <div className='w-6 h-6 rounded-full bg-gray-200 animate-pulse'></div>
          </div>

          <div className='space-y-4 mt-1'>
            {/* Just two date groups */}
            {Array.from({ length: 2 }).map((_, dayIndex) => (
              <div key={dayIndex} className='mb-4'>
                {/* Date header skeleton */}
                <div className='h-4 w-40 bg-gray-200 rounded animate-pulse mb-2'></div>

                {/* Just one event per day */}
                <div className='mb-3 border-l-[8px] border-gray-200 rounded-lg p-3'>
                  <div className='flex justify-between'>
                    <div className='w-full'>
                      {/* Event title skeleton */}
                      <div className='h-4 w-40 bg-gray-200 rounded animate-pulse mb-2'></div>

                      {/* Event time skeleton */}
                      <div className='flex items-center gap-1 mb-2'>
                        <div className='w-4 h-4 rounded-full bg-gray-200 animate-pulse'></div>
                        <div className='h-3 w-24 bg-gray-200 rounded animate-pulse'></div>
                      </div>

                      {/* Simpler description */}
                      <div className='h-2 w-full bg-gray-100 rounded animate-pulse'></div>
                    </div>

                    {/* Action buttons skeleton */}
                    <div className='flex gap-1'>
                      <div className='w-5 h-5 rounded-full bg-gray-200 animate-pulse'></div>
                      <div className='w-5 h-5 rounded-full bg-gray-200 animate-pulse'></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function handleAddClick() {
    if (!canManageEvents) {
      showToast(
        'Unauthorized',
        'Only Admin and Academic Head can add events',
        'destructive',
      );
      return;
    }

    setOpenAdd(true);
    setTimeError('');
    setNewEvent({
      title: '',
      description: '',
      date: null,
      fromTime: '',
      toTime: '',
      dates: [],
    });
  }

  function handleTimeChange(
    event: React.ChangeEvent<HTMLInputElement>,
    isFromTime: boolean,
  ) {
    const newTime = event.target.value;
    const currentFromTime = isFromTime ? newTime : newEvent.fromTime;
    const currentToTime = isFromTime ? newEvent.toTime : newTime;

    if (!validateTime(currentFromTime, currentToTime)) {
      setTimeError('End time cannot be earlier than start time');
    } else {
      setTimeError('');
    }

    setNewEvent((prev) => ({
      ...prev,
      [isFromTime ? 'fromTime' : 'toTime']: newTime,
    }));
  }

  function handleEditTimeChange(
    event: React.ChangeEvent<HTMLInputElement>,
    isFromTime: boolean,
  ) {
    const newTime = event.target.value;
    const currentFromTime = isFromTime ? newTime : editData.fromTime;
    const currentToTime = isFromTime ? editData.toTime : newTime;

    if (!validateTime(currentFromTime, currentToTime)) {
      setTimeError('End time cannot be earlier than start time');
    } else {
      setTimeError('');
    }

    setEditData((prev) => ({
      ...prev,
      [isFromTime ? 'fromTime' : 'toTime']: newTime,
    }));
  }

  async function saveNewEvent() {
    const result = await handleSaveNewEvent({
      newEvent,
      userRole,
      onSuccess: (message) => showToast('Success', message),
      onError: (error) => showToast('Error', error, 'destructive'),
    });

    if (result?.success) {
      await refreshEvents();
      setOpenAdd(false);
    }
  }

  function handleDeleteClick(eventId: string) {
    if (!canManageEvents) {
      showToast(
        'Unauthorized',
        'Only Admin and Academic Head can delete events',
        'destructive',
      );
      return;
    }

    setEventToDelete(eventId);
    setOpenDelete(true);
  }

  async function confirmDelete() {
    if (!eventToDelete) return;

    const result = await handleDeleteEvent({
      eventId: eventToDelete,
      userRole,
      onSuccess: (message) => showToast('Success', message),
      onError: (error) => showToast('Error', error, 'destructive'),
    });

    if (result?.success) {
      await refreshEvents();
      setOpenDelete(false);
      setEventToDelete(null);
    }
  }

  function handleEditClick(event: EventItem) {
    if (!canManageEvents) {
      showToast(
        'Unauthorized',
        'Only Admin and Academic Head can edit events',
        'destructive',
      );
      return;
    }

    setEditData({
      id: event.id,
      title: event.title,
      description: event.description || '',
      date: event.date,
      fromTime: event.fromTime || '',
      toTime: event.toTime || '',
      dates: [],
    });
    setOpenEdit(true);
  }

  async function saveEdit() {
    const result = await handleUpdateEvent({
      editData,
      userRole,
      onSuccess: (message) => showToast('Success', message),
      onError: (error) => showToast('Error', error, 'destructive'),
    });

    if (result?.success) {
      await refreshEvents();
      setOpenEdit(false);
    }
  }

  // Add new date to the event
  function addNewDate() {
    setNewEvent((prev) => ({
      ...prev,
      dates: [
        ...prev.dates,
        {
          date: null,
          fromTime: '',
          toTime: '',
        },
      ],
    }));
  }

  // Remove a date from the event
  function removeDate(index: number) {
    setNewEvent((prev) => ({
      ...prev,
      dates: prev.dates.filter((_, i) => i !== index),
    }));
  }

  // Handle date change for additional dates
  function handleAdditionalDateChange(index: number, date: Date | null) {
    setNewEvent((prev) => {
      const newDates = [...prev.dates];
      newDates[index] = { ...newDates[index], date };
      return { ...prev, dates: newDates };
    });
  }

  // Handle time change for additional dates
  function handleAdditionalTimeChange(
    index: number,
    value: string,
    isFromTime: boolean,
  ) {
    setNewEvent((prev) => {
      const newDates = [...prev.dates];
      if (isFromTime) {
        newDates[index] = { ...newDates[index], fromTime: value };
      } else {
        newDates[index] = { ...newDates[index], toTime: value };
      }
      return { ...prev, dates: newDates };
    });
  }

  return (
    <div className='mb-2'>
      <div className='flex justify-between items-center mb-1'>
        <h2 className='text-lg font-semibold text-[#FAEDCB]'>
          Upcoming Events
        </h2>
        {canManageEvents && (
          <Button
            variant='ghost'
            size='icon'
            className='w-6 h-6 rounded-full bg-[#124A69] text-white flex items-center justify-center hover:bg-[#0a2f42]'
            onClick={handleAddClick}
          >
            <Plus className='w-3 h-3' />
          </Button>
        )}
      </div>
      <div className='bg-white rounded-lg p-2 shadow-md h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#124A69] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#0a2f42]'>
        <div className='space-y-2 mt-2'>
          {isLoading ? (
            <p className='text-gray-500 text-xs text-center'>
              Loading events...
            </p>
          ) : eventList.length > 0 ? (
            eventList.map((event, eventIndex) => (
              <div key={eventIndex}>
                <div className='flex items-center gap-2 text-[#124A69] mb-1'>
                  <p className='text-xs'>
                    {format(event.date, 'MMMM d, yyyy')} (
                    {format(event.date, 'EEEE')})
                  </p>
                </div>
                {event.items.map((item) => (
                  <Card
                    key={item.id}
                    className='border-l-[8px] border-[#124A69] mb-1 hover:shadow-md transition-shadow'
                  >
                    <CardContent className='p-2 relative'>
                      {canManageEvents && (
                        <div className='absolute right-1 -top-5 flex gap-0.5'>
                          <Button
                            variant='ghost'
                            className='h-5 w-5 p-0 hover:bg-transparent'
                            onClick={() => handleEditClick(item)}
                          >
                            <Edit className='h-3 w-3' color='#124a69' />
                          </Button>
                          <Button
                            variant='ghost'
                            className='h-5 w-5 p-0 hover:bg-transparent'
                            onClick={() => handleDeleteClick(item.id)}
                          >
                            <Trash className='h-3 w-3' color='#124a69' />
                          </Button>
                        </div>
                      )}
                      <div className='-mt-4 -mb-4'>
                        <div className='text-[#124A69] font-medium text-xs mb-0.5'>
                          {item.title}
                        </div>
                        <div className='text-gray-600 text-[11px]'>
                          {item.description}
                        </div>
                        {item.fromTime && item.toTime && (
                          <div className='flex items-center text-gray-500 text-[11px]'>
                            <Clock className='w-3 h-3 mr-0.5' />
                            {formatTimeTo12Hour(item.fromTime)} -{' '}
                            {formatTimeTo12Hour(item.toTime)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))
          ) : (
            <p className='text-gray-500 text-xs text-center'>
              No upcoming events.
            </p>
          )}
        </div>
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
            <Label className='text-medium'>Title *</Label>
            <Input
              placeholder='Title'
              value={editData.title}
              onChange={(e) => {
                if (e.target.value.length <= 20) {
                  setEditData({ ...editData, title: e.target.value });
                }
              }}
            />
            <p className='text-xs flex justify-end mt-2 text-gray-500'>
              {editData.title.length}/20
            </p>

            <Label className='text-medium'>Description</Label>
            <Textarea
              placeholder='Add a description'
              className='resize-none'
              value={editData.description}
              onChange={(e) => {
                if (e.target.value.length <= 50) {
                  setEditData({ ...editData, description: e.target.value });
                }
              }}
            />
            <p className='text-xs flex justify-end mt-2 text-gray-500'>
              {editData.description.length}/50
            </p>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label className='text-medium'>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-full flex justify-between'
                    >
                      {editData.date
                        ? format(editData.date, 'PPP')
                        : 'Pick a date'}
                      <CalendarIcon className='ml-2 h-4 w-4' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align='start' className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={editData.date || undefined}
                      onSelect={(date) =>
                        setEditData({ ...editData, date: date || null })
                      }
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className='text-medium'>Time</Label>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <Input
                      type='time'
                      value={editData.fromTime}
                      onChange={(e) => handleEditTimeChange(e, true)}
                    />
                  </div>
                  <div>
                    <Input
                      type='time'
                      value={editData.toTime}
                      onChange={(e) => handleEditTimeChange(e, false)}
                    />
                  </div>
                </div>
                {timeError && (
                  <p className='text-sm text-red-500 mt-1'>{timeError}</p>
                )}
              </div>
            </div>
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
              disabled={!editData.title || !editData.date || !!timeError}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openAdd} onOpenChange={setOpenAdd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Event</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='space-y-3'>
            <div>
              <Label className='text-medium'>Title *</Label>
              <Input
                placeholder='Title'
                value={newEvent.title}
                onChange={(e) => {
                  if (e.target.value.length <= 50) {
                    setNewEvent({ ...newEvent, title: e.target.value });
                  }
                }}
              />
              <p className='text-[10px] flex justify-end mt-1 text-gray-500'>
                {newEvent.title.length}/50
              </p>
            </div>
            <div>
              <Label className='text-medium'>Description</Label>
              <Textarea
                placeholder='Add a description'
                className='resize-none h-16'
                value={newEvent.description}
                onChange={(e) => {
                  if (e.target.value.length <= 100) {
                    setNewEvent({ ...newEvent, description: e.target.value });
                  }
                }}
              />
              <p className='text-[10px] flex justify-end mt-1 text-gray-500'>
                {newEvent.description.length}/100
              </p>
            </div>

            <div className='space-y-2'>
              <Label className='text-medium'>Date and Time *</Label>
              <div className='space-y-1'>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant='outline'
                          className='w-full h-7 text-[11px] flex justify-between'
                        >
                          {newEvent.date
                            ? format(newEvent.date, 'MMM d, yyyy')
                            : 'Pick a date'}
                          <CalendarIcon className='ml-1 h-3 w-3' />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align='start' className='w-auto p-0'>
                        <Calendar
                          mode='single'
                          selected={newEvent.date || undefined}
                          onSelect={(date) =>
                            setNewEvent({
                              ...newEvent,
                              date: date || null,
                            })
                          }
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className='grid grid-cols-2 gap-1'>
                    <Input
                      type='time'
                      value={newEvent.fromTime}
                      onChange={(e) => handleTimeChange(e, true)}
                      className='h-7 text-[11px]'
                      placeholder='Start'
                    />
                    <Input
                      type='time'
                      value={newEvent.toTime}
                      onChange={(e) => handleTimeChange(e, false)}
                      className='h-7 text-[11px]'
                      placeholder='End'
                    />
                  </div>
                </div>
              </div>
              {timeError && (
                <p className='text-[11px] text-red-500'>{timeError}</p>
              )}

              {/* Additional Dates Section */}
              {newEvent.dates.length > 0 && (
                <div className='mt-2'>
                  <div className='flex justify-between items-center'>
                    <Label className='text-medium'>Additional Dates</Label>
                    <span className='text-[10px] text-gray-500'>
                      {newEvent.dates.length} additional{' '}
                      {newEvent.dates.length === 1 ? 'date' : 'dates'}
                    </span>
                  </div>
                  <div
                    className={`mt-1 space-y-2 ${
                      newEvent.dates.length > 6
                        ? 'max-h-60 overflow-y-auto pr-1'
                        : ''
                    }`}
                  >
                    {newEvent.dates.map((dateItem, index) => (
                      <div
                        key={index}
                        className='border p-2 rounded-md relative'
                      >
                        <button
                          onClick={() => removeDate(index)}
                          className='absolute right-1 top-1 text-gray-500 hover:text-red-500'
                          type='button'
                        >
                          <Trash className='h-3 w-3' />
                        </button>
                        <div className='grid grid-cols-2 gap-2'>
                          <div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant='outline'
                                  className='w-full h-7 text-[11px] flex justify-between'
                                >
                                  {dateItem.date
                                    ? format(dateItem.date, 'MMM d, yyyy')
                                    : 'Pick a date'}
                                  <CalendarIcon className='ml-1 h-3 w-3' />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                align='start'
                                className='w-auto p-0'
                              >
                                <Calendar
                                  mode='single'
                                  selected={dateItem.date || undefined}
                                  onSelect={(date) =>
                                    handleAdditionalDateChange(
                                      index,
                                      date || null,
                                    )
                                  }
                                  disabled={(date) =>
                                    date <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className='grid grid-cols-2 gap-1'>
                            <Input
                              type='time'
                              value={dateItem.fromTime}
                              onChange={(e) =>
                                handleAdditionalTimeChange(
                                  index,
                                  e.target.value,
                                  true,
                                )
                              }
                              className='h-7 text-[11px]'
                              placeholder='Start'
                            />
                            <Input
                              type='time'
                              value={dateItem.toTime}
                              onChange={(e) =>
                                handleAdditionalTimeChange(
                                  index,
                                  e.target.value,
                                  false,
                                )
                              }
                              className='h-7 text-[11px]'
                              placeholder='End'
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Date Button */}
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='mt-1 text-[11px] w-full'
                onClick={addNewDate}
              >
                <Plus className='mr-1 h-3 w-3' /> Add Another Date
              </Button>
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
              onClick={saveNewEvent}
              className='bg-[#124A69] text-white hover:bg-[#0a2f42] h-8 text-xs'
              disabled={!newEvent.title || !newEvent.date || !!timeError}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
