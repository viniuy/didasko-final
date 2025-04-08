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
import { useToast } from '@/components/ui/use-toast';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface EventItem {
  title: string;
  subtitle: string;
  fromTime?: string;
  toTime?: string;
}

interface Event {
  date: Date;
  items: EventItem[];
}

interface EventToDelete {
  eventIndex: number;
  itemIndex: number;
}

interface EditData {
  eventIndex: number | null;
  itemIndex: number | null;
  title: string;
  subtitle: string;
  date: Date | null;
  fromTime: string;
  toTime: string;
}

interface NewEvent {
  title: string;
  subtitle: string;
  dates: Array<{
    date: Date | null;
    fromTime: string;
    toTime: string;
  }>;
}

function convertTo12Hour(time: string): string {
  if (!time) return '';

  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return `${hour12}:${minutes} ${ampm}`;
}

function convertTo24Hour(time: string): string {
  if (!time) return '';

  const [timeStr, period] = time.split(' ');
  const [hours, minutes] = timeStr.split(':');
  let hour = parseInt(hours);

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

export default function UpcomingEvent() {
  const { toast } = useToast();
  const today = new Date();
  const [eventList, setEventList] = useState<Event[]>([
    {
      date: new Date(2025, 0, 1),
      items: [{ title: "NEW YEAR'S DAY", subtitle: '(Regular Holiday)' }],
    },
    {
      date: new Date(2025, 0, 20),
      items: [
        {
          title: 'MOBSTECH Exam',
          subtitle: 'Proctor for BSIT 611',
          fromTime: '2:00 PM',
          toTime: '3:00 PM',
        },
        {
          title: 'WEBSTECH Exam',
          subtitle: 'Proctor for BSIT 611',
          fromTime: '2:00 PM',
          toTime: '3:00 PM',
        },
      ],
    },
  ]);

  const [openDelete, setOpenDelete] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventToDelete | null>(
    null,
  );

  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState<EditData>({
    eventIndex: null,
    itemIndex: null,
    title: '',
    subtitle: '',
    date: null,
    fromTime: '',
    toTime: '',
  });
  const [openAdd, setOpenAdd] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: '',
    subtitle: '',
    dates: [
      {
        date: null,
        fromTime: '',
        toTime: '',
      },
    ],
  });
  const [timeError, setTimeError] = useState<string>('');

  function handleAddClick() {
    setOpenAdd(true);
    setTimeError('');
  }

  function validateTime(fromTime: string, toTime: string): boolean {
    if (!fromTime || !toTime) return true;
    return fromTime <= toTime;
  }

  function handleTimeChange(
    dateIndex: number,
    event: React.ChangeEvent<HTMLInputElement>,
    isFromTime: boolean,
  ) {
    const newTime = event.target.value;
    const updatedDates = [...newEvent.dates];
    const currentFromTime = isFromTime
      ? newTime
      : updatedDates[dateIndex].fromTime;
    const currentToTime = isFromTime ? updatedDates[dateIndex].toTime : newTime;

    if (!validateTime(currentFromTime, currentToTime)) {
      setTimeError('End time cannot be earlier than start time');
    } else {
      setTimeError('');
    }

    updatedDates[dateIndex] = {
      ...updatedDates[dateIndex],
      [isFromTime ? 'fromTime' : 'toTime']: newTime,
    };

    setNewEvent((prev) => ({
      ...prev,
      dates: updatedDates,
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

  function checkTimeOverlap(
    date: Date,
    fromTime: string,
    toTime: string,
    excludeEventIndex?: number,
  ): boolean {
    return eventList.some((event, eventIndex) => {
      if (excludeEventIndex !== undefined && eventIndex === excludeEventIndex) {
        return false;
      }

      if (format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
        return event.items.some((item) => {
          if (!item.fromTime || !item.toTime || !fromTime || !toTime)
            return false;

          const itemStart = convertTo24Hour(item.fromTime);
          const itemEnd = convertTo24Hour(item.toTime);

          return fromTime <= itemEnd && toTime >= itemStart;
        });
      }
      return false;
    });
  }

  function checkDuplicateTitle(
    title: string,
    date: Date,
    excludeEventIndex?: number,
    excludeItemIndex?: number,
  ): boolean {
    return eventList.some((event, eventIndex) => {
      if (excludeEventIndex !== undefined && eventIndex === excludeEventIndex) {
        return false;
      }

      if (format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
        return event.items.some((item, itemIndex) => {
          if (
            excludeEventIndex !== undefined &&
            excludeItemIndex !== undefined &&
            eventIndex === excludeEventIndex &&
            itemIndex === excludeItemIndex
          ) {
            return false;
          }
          return item.title.toLowerCase() === title.toLowerCase();
        });
      }
      return false;
    });
  }

  function saveNewEvent() {
    if (!newEvent.title) {
      toast({
        title: 'Error',
        description: 'Title is required.',
        className: 'text-xs',
      });
      return;
    }

    // Validate all dates and times
    for (const dateTime of newEvent.dates) {
      if (!dateTime.date) {
        toast({
          title: 'Error',
          description: 'All dates must be selected.',
          className: 'text-xs',
        });
        return;
      }

      // Check for duplicate titles on the same day
      if (checkDuplicateTitle(newEvent.title, dateTime.date)) {
        toast({
          title: 'Error',
          description: `An event with the title "${
            newEvent.title
          }" already exists on ${format(dateTime.date, 'MMM d, yyyy')}.`,
          className: 'text-xs',
        });
        return;
      }

      // Check for time overlap if times are provided
      if (dateTime.fromTime && dateTime.toTime) {
        if (!validateTime(dateTime.fromTime, dateTime.toTime)) {
          toast({
            title: 'Error',
            description: 'Invalid time range.',
            className: 'text-xs',
          });
          return;
        }

        if (
          checkTimeOverlap(dateTime.date, dateTime.fromTime, dateTime.toTime)
        ) {
          toast({
            title: 'Error',
            description: `There is a time conflict with another event on ${format(
              dateTime.date,
              'MMM d, yyyy',
            )}.`,
            className: 'text-xs',
          });
          return;
        }
      }
    }

    const updatedEvents = [...eventList];
    const previousEvents = [...eventList];

    // Process each date
    newEvent.dates.forEach((dateTime) => {
      // Check if there's an existing event on the same date
      const existingEventIndex = updatedEvents.findIndex(
        (event) =>
          format(event.date, 'yyyy-MM-dd') ===
          format(dateTime.date!, 'yyyy-MM-dd'),
      );

      const newItem = {
        title: newEvent.title,
        subtitle: newEvent.subtitle,
        fromTime: dateTime.fromTime
          ? convertTo12Hour(dateTime.fromTime)
          : undefined,
        toTime: dateTime.toTime ? convertTo12Hour(dateTime.toTime) : undefined,
      };

      if (existingEventIndex !== -1) {
        // Add to existing event's items
        updatedEvents[existingEventIndex].items.push(newItem);
      } else {
        // Create new event
        updatedEvents.push({
          date: dateTime.date!,
          items: [newItem],
        });
      }
    });

    // Sort events by date
    updatedEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    setEventList(updatedEvents);
    setOpenAdd(false);
    setNewEvent({
      title: '',
      subtitle: '',
      dates: [
        {
          date: null,
          fromTime: '',
          toTime: '',
        },
      ],
    });

    const firstDate = newEvent.dates[0].date;

    toast({
      title: `Scheduled: ${newEvent.title}`,
      description:
        format(firstDate!, 'MMM d, yyyy') +
        (newEvent.dates[0].fromTime
          ? ` at ${convertTo12Hour(newEvent.dates[0].fromTime)}`
          : ''),
      action: (
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setEventList(previousEvents);
            toast({
              title: 'Event reverted',
              description: 'The event has been removed.',
              className: 'text-xs',
            });
          }}
          className='h-6 px-2 text-[10px] bg-white hover:bg-gray-100'
        >
          Undo
        </Button>
      ),
      className: 'text-xs',
    });
  }

  function handleDeleteClick(eventIndex: number, itemIndex: number) {
    setEventToDelete({ eventIndex, itemIndex });
    setOpenDelete(true);
  }

  function confirmDelete() {
    if (eventToDelete !== null) {
      const previousEvents = [...eventList];
      const deletedEvent =
        eventList[eventToDelete.eventIndex].items[eventToDelete.itemIndex];
      const eventDate = eventList[eventToDelete.eventIndex].date;

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
      setEventToDelete(null);

      toast({
        title: `Deleted: ${deletedEvent.title}`,
        description:
          format(eventDate, 'MMM d, yyyy') +
          (deletedEvent.fromTime ? ` at ${deletedEvent.fromTime}` : ''),
        action: (
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setEventList(previousEvents);
              toast({
                title: 'Event restored',
                description: 'The event has been restored.',
                className: 'text-xs',
              });
            }}
            className='h-6 px-2 text-[10px] bg-white hover:bg-gray-100'
          >
            Undo
          </Button>
        ),
        className: 'text-xs',
      });
    }
  }

  function handleEditClick(eventIndex: number, itemIndex: number) {
    const item = eventList[eventIndex].items[itemIndex];
    setEditData({
      eventIndex,
      itemIndex,
      title: item.title,
      subtitle: item.subtitle,
      date: eventList[eventIndex].date,
      fromTime: item.fromTime ? convertTo24Hour(item.fromTime) : '',
      toTime: item.toTime ? convertTo24Hour(item.toTime) : '',
    });
    setOpenEdit(true);
  }

  function saveEdit() {
    if (
      editData.eventIndex === null ||
      editData.itemIndex === null ||
      !editData.date
    ) {
      toast({
        title: 'Error',
        description: 'Invalid edit data.',
        className: 'text-xs',
      });
      return;
    }

    if (!editData.title) {
      toast({
        title: 'Error',
        description: 'Title is required.',
        className: 'text-xs',
      });
      return;
    }

    // Check for duplicate titles on the same day
    if (
      checkDuplicateTitle(
        editData.title,
        editData.date,
        editData.eventIndex,
        editData.itemIndex,
      )
    ) {
      toast({
        title: 'Error',
        description: `An event with the title "${
          editData.title
        }" already exists on ${format(editData.date, 'MMM d, yyyy')}.`,
        className: 'text-xs',
      });
      return;
    }

    // Check for time overlap if times are provided
    if (editData.fromTime && editData.toTime) {
      if (!validateTime(editData.fromTime, editData.toTime)) {
        toast({
          title: 'Error',
          description: 'Invalid time range.',
          className: 'text-xs',
        });
        return;
      }

      if (
        checkTimeOverlap(
          editData.date,
          editData.fromTime,
          editData.toTime,
          editData.eventIndex,
        )
      ) {
        toast({
          title: 'Error',
          description: `There is a time conflict with another event on ${format(
            editData.date,
            'MMM d, yyyy',
          )}.`,
          className: 'text-xs',
        });
        return;
      }
    }

    const previousEvents = [...eventList];
    const updatedEvents = [...eventList];
    updatedEvents[editData.eventIndex].items[editData.itemIndex] = {
      title: editData.title,
      subtitle: editData.subtitle,
      fromTime: editData.fromTime
        ? convertTo12Hour(editData.fromTime)
        : undefined,
      toTime: editData.toTime ? convertTo12Hour(editData.toTime) : undefined,
    };

    setEventList(updatedEvents);
    setOpenEdit(false);

    toast({
      title: `Updated: ${editData.title}`,
      description:
        format(editData.date, 'MMM d, yyyy') +
        (editData.fromTime ? ` at ${convertTo12Hour(editData.fromTime)}` : ''),
      action: (
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setEventList(previousEvents);
            toast({
              title: 'Edit reverted',
              description: 'The event has been restored.',
              className: 'text-xs',
            });
          }}
          className='h-6 px-2 text-[10px] bg-white hover:bg-gray-100'
        >
          Undo
        </Button>
      ),
      className: 'text-xs',
    });
  }

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

  function removeDate(index: number) {
    if (newEvent.dates.length === 1) return;
    setNewEvent((prev) => ({
      ...prev,
      dates: prev.dates.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className='mb-2'>
      <div className='flex justify-between items-center mb-1'>
        <h2 className='text-lg font-semibold text-[#FAEDCB]'>
          Upcoming Events
        </h2>
      </div>
      <div className='bg-white rounded-lg p-2 shadow-md h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#124A69] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#0a2f42]'>
        <div className='absolute right-7'>
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
          {eventList.length > 0 ? (
            eventList.map((event, eventIndex) => (
              <div key={eventIndex}>
                <div className='flex items-center gap-2 text-[#124A69] mb-1'>
                  <p className='text-xs'>
                    {format(event.date, 'MMMM d, yyyy')} (
                    {format(event.date, 'EEEE')})
                  </p>
                </div>
                {event.items.map((item, itemIndex) => (
                  <Card
                    key={itemIndex}
                    className='border-l-[8px] border-[#124A69] mb-1 hover:shadow-md transition-shadow'
                  >
                    <CardContent className='p-2 relative'>
                      <div className='absolute right-1 -top-5 flex gap-0.5'>
                        <Button
                          variant='ghost'
                          className='h-5 w-5 p-0 hover:bg-transparent'
                          onClick={() => handleEditClick(eventIndex, itemIndex)}
                        >
                          <Edit className='h-3 w-3' color='#124a69' />
                        </Button>
                        <Button
                          variant='ghost'
                          className='h-5 w-5 p-0 hover:bg-transparent'
                          onClick={() =>
                            handleDeleteClick(eventIndex, itemIndex)
                          }
                        >
                          <Trash className='h-3 w-3' color='#124a69' />
                        </Button>
                      </div>
                      <div className='-mt-4 -mb-4'>
                        <div className='text-[#124A69]  font-medium text-xs mb-0.5'>
                          {item.title}
                        </div>
                        <div className='text-gray-600 text-[11px]'>
                          {item.subtitle}
                        </div>
                        {item.fromTime && item.toTime && (
                          <div className='flex items-center text-gray-500 text-[11px]'>
                            <Clock className='w-3 h-3 mr-0.5' />
                            {item.fromTime} - {item.toTime}
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
                if (e.target.value.length <= 15) {
                  setEditData({ ...editData, title: e.target.value });
                }
              }}
            />
            <p className='text-xs flex justify-end mt-2 text-gray-500'>
              {editData.title.length}/15
            </p>

            <Label className='text-medium'>Description</Label>
            <Textarea
              placeholder='Add a description'
              className='resize-none'
              value={editData.subtitle}
              onChange={(e) => {
                if (e.target.value.length <= 30) {
                  setEditData({ ...editData, subtitle: e.target.value });
                }
              }}
            />
            <p className='text-xs flex justify-end mt-2 text-gray-500'>
              {editData.subtitle.length}/30
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
                      initialFocus
                      disabled={(date) => date < today}
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
                  if (e.target.value.length <= 15) {
                    setNewEvent({ ...newEvent, title: e.target.value });
                  }
                }}
              />
              <p className='text-[10px] flex justify-end mt-1 text-gray-500'>
                {newEvent.title.length}/15
              </p>
            </div>
            <div>
              <Label className='text-medium'>Description</Label>
              <Textarea
                placeholder='Add a description'
                className='resize-none h-16'
                value={newEvent.subtitle}
                onChange={(e) => {
                  if (e.target.value.length <= 30) {
                    setNewEvent({ ...newEvent, subtitle: e.target.value });
                  }
                }}
              />
              <p className='text-[10px] flex justify-end mt-1 text-gray-500'>
                {newEvent.subtitle.length}/30
              </p>
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <Label className='text-medium'>Dates and Times</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addNewDate}
                  className='text-[10px] h-6 px-2'
                >
                  Add Another Date
                </Button>
              </div>

              <div className='max-h-[200px] overflow-y-auto pr-2 space-y-2'>
                {newEvent.dates.map((dateTime, index) => (
                  <div key={index} className='space-y-1 pt-1 border-t'>
                    <div className='flex justify-between items-center'>
                      <Label className='text-[11px]'>Date {index + 1}</Label>
                      {newEvent.dates.length > 1 && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeDate(index)}
                          className='h-5 px-2 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50'
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                      <div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant='outline'
                              className='w-full h-7 text-[11px] flex justify-between'
                            >
                              {dateTime.date
                                ? format(dateTime.date, 'MMM d, yyyy')
                                : 'Pick a date'}
                              <CalendarIcon className='ml-1 h-3 w-3' />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align='start' className='w-auto p-0'>
                            <Calendar
                              mode='single'
                              selected={dateTime.date || undefined}
                              onSelect={(date) => {
                                const updatedDates = [...newEvent.dates];
                                updatedDates[index] = {
                                  ...updatedDates[index],
                                  date: date || null,
                                };
                                setNewEvent({
                                  ...newEvent,
                                  dates: updatedDates,
                                });
                              }}
                              initialFocus
                              disabled={(date) => date < today}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className='grid grid-cols-2 gap-1'>
                        <Input
                          type='time'
                          value={dateTime.fromTime}
                          onChange={(e) => handleTimeChange(index, e, true)}
                          className='h-7 text-[11px]'
                        />
                        <Input
                          type='time'
                          value={dateTime.toTime}
                          onChange={(e) => handleTimeChange(index, e, false)}
                          className='h-7 text-[11px]'
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {timeError && (
                <p className='text-[11px] text-red-500'>{timeError}</p>
              )}
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
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
