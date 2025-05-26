'use client';

import {
  Clock,
  Trash,
  Edit,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { Textarea } from './ui/textarea';
import { format, isSameDay, isBefore, isAfter } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { Role } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { data: session, status } = useSession();
  const userRole = session?.user?.role as Role | undefined;

  const [eventList, setEventList] = useState<GroupedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
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

  // Check if user is authorized to manage events
  const canManageEvents = canUserManageEvents(userRole);

  const [openDelete, setOpenDelete] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [openEditDatePicker, setOpenEditDatePicker] = useState(false);
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
  const [openAddDatePicker, setOpenAddDatePicker] = useState(false);
  const [openAdditionalDatePickers, setOpenAdditionalDatePickers] = useState<
    boolean[]
  >([]);
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: '',
    description: '',
    date: null,
    fromTime: '',
    toTime: '',
    dates: [],
  });

  const [dateError, setDateError] = useState<string>('');
  const [timeError, setTimeError] = useState<string>('');

  // Function to show alert notifications
  const showAlert = (
    title: string,
    description: string,
    variant: 'success' | 'error' = 'success',
  ) => {
    if (variant === 'success') {
      toast.success(description, {
        style: {
          background: '#fff',
          color: '#124A69',
          border: '1px solid #e5e7eb',
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        iconTheme: {
          primary: '#124A69',
          secondary: '#fff',
        },
      });
    } else {
      toast.error(description, {
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        iconTheme: {
          primary: '#dc2626',
          secondary: '#fff',
        },
      });
    }
  };

  // Function to refresh events
  const refreshEvents = async () => {
    const { events, error } = await getEvents();

    if (error) {
      toast.error(error, {
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        iconTheme: {
          primary: '#dc2626',
          secondary: '#fff',
        },
      });
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

  function validateDateTime(
    date: Date | null,
    fromTime: string,
    toTime: string,
  ): boolean {
    if (!date) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if date is in the past
    if (isBefore(date, today)) {
      setDateError('Cannot select a past date');
      return false;
    }

    // Only check time requirements if we have both date and time
    if (isSameDay(date, today) && fromTime) {
      const [hours, minutes] = fromTime.split(':').map(Number);
      const selectedTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
      );

      // Add a 5-minute buffer to allow for event creation
      const bufferTime = new Date(now.getTime() + 5 * 60000);

      if (selectedTime.getTime() <= bufferTime.getTime()) {
        setTimeError('Event time must be at least 5 minutes in the future');
        return false;
      }
    }

    setDateError('');
    setTimeError('');
    return true;
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
    } else if (
      !validateDateTime(newEvent.date, currentFromTime, currentToTime)
    ) {
      // Error message already set by validateDateTime
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
    } else if (
      !validateDateTime(editData.date, currentFromTime, currentToTime)
    ) {
      // Error message already set by validateDateTime
    } else {
      setTimeError('');
    }

    setEditData((prev) => ({
      ...prev,
      [isFromTime ? 'fromTime' : 'toTime']: newTime,
    }));
  }

  // Add this function to check for event conflicts
  function checkEventConflict(
    date: Date,
    fromTime: string,
    toTime: string,
    excludeEventId?: string,
  ): boolean {
    const sameDayEvents =
      eventList.find((event) => isSameDay(event.date, date))?.items || [];

    return sameDayEvents.some((event) => {
      // Skip the event being edited
      if (excludeEventId && event.id === excludeEventId) return false;

      // If either event is all-day, there's a conflict
      if ((!fromTime && !toTime) || (!event.fromTime && !event.toTime))
        return true;

      // If one event has time and the other doesn't, there's a conflict
      if ((!fromTime || !toTime) !== (!event.fromTime || !event.toTime))
        return true;

      // If both events have times, check for overlap
      if (fromTime && toTime && event.fromTime && event.toTime) {
        const newStart = fromTime;
        const newEnd = toTime;
        const existingStart = event.fromTime;
        const existingEnd = event.toTime;

        return !(newEnd <= existingStart || newStart >= existingEnd);
      }

      return false;
    });
  }

  async function saveNewEvent() {
    if (isSaving) return;

    if (!validateDateTime(newEvent.date, newEvent.fromTime, newEvent.toTime)) {
      return;
    }

    // Check for conflicts
    if (
      newEvent.date &&
      checkEventConflict(newEvent.date, newEvent.fromTime, newEvent.toTime)
    ) {
      setAlert({
        show: true,
        title: 'Error',
        description:
          'There is already an event scheduled for this date and time.',
        variant: 'error',
      });
      return;
    }

    setIsSaving(true);
    setHasAttemptedSave(true);
    setAlert({ show: false, title: '', description: '', variant: 'success' });

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        const result = await handleSaveNewEvent({
          newEvent,
          userRole,
          onSuccess: (message) => {
            refreshEvents();
            setIsSaving(false);
            setOpenAdd(false);
          },
          onError: (error) => {
            setAlert({
              show: true,
              title: 'Error',
              description: error,
              variant: 'error',
            });
            setIsSaving(false);
          },
        });
      } catch (error) {
        setAlert({
          show: true,
          title: 'Error',
          description: 'Failed to save event. Please try again.',
          variant: 'error',
        });
        setIsSaving(false);
      }
    }, 500);

    setSaveTimeout(timeout);
  }

  function handleDeleteClick(eventId: string) {
    if (!canManageEvents) {
      toast.error('Only Admin and Academic Head can delete events', {
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        iconTheme: {
          primary: '#dc2626',
          secondary: '#fff',
        },
      });
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
      onSuccess: (message) =>
        toast.success(message, {
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
            boxShadow:
              '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
          iconTheme: {
            primary: '#124A69',
            secondary: '#fff',
          },
        }),
      onError: (error) =>
        toast.error(error, {
          style: {
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #e5e7eb',
            boxShadow:
              '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fff',
          },
        }),
    });

    if (result?.success) {
      await refreshEvents();
      setOpenDelete(false);
      setEventToDelete(null);
    }
  }

  function handleEditClick(event: EventItem) {
    if (!canManageEvents) {
      toast.error('Only Admin and Academic Head can edit events', {
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        iconTheme: {
          primary: '#dc2626',
          secondary: '#fff',
        },
      });
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
    if (isSaving) return;

    if (!validateDateTime(editData.date, editData.fromTime, editData.toTime)) {
      return;
    }

    // Check for conflicts, excluding the current event being edited
    if (
      editData.date &&
      editData.id &&
      checkEventConflict(
        editData.date,
        editData.fromTime,
        editData.toTime,
        editData.id,
      )
    ) {
      setAlert({
        show: true,
        title: 'Error',
        description:
          'There is already an event scheduled for this date and time.',
        variant: 'error',
      });
      return;
    }

    setIsSaving(true);
    setHasAttemptedSave(true);
    setAlert({ show: false, title: '', description: '', variant: 'success' });

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        const result = await handleUpdateEvent({
          editData,
          userRole,
          onSuccess: (message) => {
            refreshEvents();
            setIsSaving(false);
            setOpenEdit(false);
          },
          onError: (error) => {
            setAlert({
              show: true,
              title: 'Error',
              description: error,
              variant: 'error',
            });
            setIsSaving(false);
          },
        });
      } catch (error) {
        setAlert({
          show: true,
          title: 'Error',
          description: 'Failed to update event. Please try again.',
          variant: 'error',
        });
        setIsSaving(false);
      }
    }, 500);

    setSaveTimeout(timeout);
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
    setOpenAdditionalDatePickers((prev) => [...prev, false]);
  }

  // Remove a date from the event
  function removeDate(index: number) {
    setNewEvent((prev) => ({
      ...prev,
      dates: prev.dates.filter((_, i) => i !== index),
    }));
    setOpenAdditionalDatePickers((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAdditionalDateChange(index: number, date: Date | null) {
    setNewEvent((prev) => {
      const newDates = [...prev.dates];
      newDates[index] = { ...newDates[index], date };
      return { ...prev, dates: newDates };
    });
  }

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Add this function to handle opening the add modal
  function handleOpenAdd() {
    setOpenAdd(true);
    setAlert({ show: false, title: '', description: '', variant: 'success' });
    setHasAttemptedSave(false); // Reset only when explicitly opening
  }

  // Add this function to handle opening the edit modal
  function handleOpenEdit(event: EventItem) {
    if (!canManageEvents) {
      toast.error('Only Admin and Academic Head can edit events', {
        style: {
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #e5e7eb',
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        iconTheme: {
          primary: '#dc2626',
          secondary: '#fff',
        },
      });
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
    setAlert({ show: false, title: '', description: '', variant: 'success' });
    setHasAttemptedSave(false); // Reset only when explicitly opening
  }

  return (
    <div className='mb-2'>
      <Toaster
        toastOptions={{
          className: '',
          style: {
            background: '#fff',
            color: '#124A69',
            border: '1px solid #e5e7eb',
            boxShadow:
              '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
          success: {
            style: {
              background: '#fff',
              color: '#124A69',
              border: '1px solid #e5e7eb',
            },
            iconTheme: {
              primary: '#124A69',
              secondary: '#fff',
            },
          },
          error: {
            style: {
              background: '#fff',
              color: '#dc2626',
              border: '1px solid #e5e7eb',
            },
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fff',
            },
          },
          loading: {
            style: {
              background: '#fff',
              color: '#124A69',
              border: '1px solid #e5e7eb',
            },
          },
        }}
      />

      <div className='flex justify-between items-center mb-1'>
        <h2 className='text-lg font-semibold text-[#FAEDCB]'>
          Upcoming Events
        </h2>
        {canManageEvents && (
          <Button
            variant='ghost'
            size='icon'
            className='w-6 h-6 rounded-full bg-[#124A69] text-white flex items-center justify-center hover:bg-[#0a2f42]'
            onClick={() => {
              handleOpenAdd();
              setTimeError('');
              setNewEvent({
                title: '',
                description: '',
                date: null,
                fromTime: '',
                toTime: '',
                dates: [],
              });
            }}
          >
            <Plus className='w-3 h-3' />
          </Button>
        )}
      </div>
      <div className='bg-white rounded-lg p-2 shadow-md h-135 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#124A69] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#0a2f42] transition-all duration-300'>
        <div className='space-y-2 mt-2'>
          {isLoading ? (
            <>
              {/* Date header skeleton */}
              <div className='flex items-center gap-2 text-[#124A69] mb-1'>
                <Skeleton className='h-4 w-32' />
              </div>

              {/* Event card skeletons */}
              {[...Array(3)].map((_, index) => (
                <Card
                  key={index}
                  className='border-l-[8px] border-[#124A69] mb-1'
                >
                  <CardContent className='p-2 relative'>
                    <div className='-mt-4 -mb-4'>
                      <Skeleton className='h-4 w-3/4 mb-2' />
                      <Skeleton className='h-3 w-1/2 mb-2' />
                      <div className='flex items-center gap-1'>
                        <Skeleton className='h-3 w-3' />
                        <Skeleton className='h-3 w-24' />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Another date header skeleton */}
              <div className='flex items-center gap-2 text-[#124A69] mb-1 mt-4'>
                <Skeleton className='h-4 w-32' />
              </div>

              {/* More event card skeletons */}
              {[...Array(2)].map((_, index) => (
                <Card
                  key={`second-${index}`}
                  className='border-l-[8px] border-[#124A69] mb-1'
                >
                  <CardContent className='p-2 relative'>
                    <div className='-mt-4 -mb-4'>
                      <Skeleton className='h-4 w-3/4 mb-2' />
                      <Skeleton className='h-3 w-1/2 mb-2' />
                      <div className='flex items-center gap-1'>
                        <Skeleton className='h-3 w-3' />
                        <Skeleton className='h-3 w-24' />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : eventList.length > 0 ? (
            eventList.map((event, eventIndex) => (
              <div key={eventIndex}>
                <div className='flex items-center gap-2 text-[#124A69] mb-1'>
                  <p className='text-xs'>
                    {format(event.date, 'MMMM d, yyyy')} (
                    {format(event.date, 'EEEE')})
                  </p>
                </div>
                {event.items.map((item) => {
                  const isPastEvent = isBefore(
                    event.date,
                    new Date(new Date().setHours(0, 0, 0, 0)),
                  );
                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        'border-l-[8px] mb-1 hover:shadow-md transition-shadow',
                        isPastEvent
                          ? 'border-gray-400 bg-gray-50'
                          : 'border-[#124A69]',
                      )}
                    >
                      <CardContent className='p-2 relative'>
                        {canManageEvents && (
                          <div className='absolute right-1 -top-5 flex gap-0.5'>
                            <Button
                              variant='ghost'
                              className='h-5 w-5 p-0 hover:bg-transparent'
                              onClick={() => handleOpenEdit(item)}
                            >
                              <Edit
                                className='h-3 w-3'
                                color={isPastEvent ? '#6b7280' : '#124a69'}
                              />
                            </Button>
                            <Button
                              variant='ghost'
                              className='h-5 w-5 p-0 hover:bg-transparent'
                              onClick={() => handleDeleteClick(item.id)}
                            >
                              <Trash
                                className='h-3 w-3'
                                color={isPastEvent ? '#6b7280' : '#124a69'}
                              />
                            </Button>
                          </div>
                        )}
                        <div className='-mt-4 -mb-4'>
                          <div
                            className={cn(
                              'font-medium text-xs mb-0.5',
                              isPastEvent ? 'text-gray-500' : 'text-[#124A69]',
                            )}
                          >
                            {item.title}
                          </div>
                          <div
                            className={cn(
                              'text-[11px]',
                              isPastEvent ? 'text-gray-400' : 'text-gray-600',
                            )}
                          >
                            {item.description}
                          </div>
                          <div
                            className={cn(
                              'flex items-center text-[11px]',
                              isPastEvent ? 'text-gray-400' : 'text-gray-500',
                            )}
                          >
                            <Clock className='w-3 h-3 mr-0.5' />
                            {item.fromTime && item.toTime
                              ? `${formatTimeTo12Hour(
                                  item.fromTime,
                                )} - ${formatTimeTo12Hour(item.toTime)}`
                              : 'All day'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))
          ) : (
            <div className='flex items-center justify-center h-full min-h-120'>
              <p className='text-gray-500 text-xs text-center'>
                No upcoming events.
              </p>
            </div>
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
            <AlertDialogCancel
              onClick={() => setOpenDelete(false)}
              className='bg-gray-100 text-gray-700 hover:bg-gray-200 h-8 text-xs'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-[#124A69] text-white hover:bg-[#0a2f42] h-8 text-xs'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={openEdit}
        onOpenChange={(open) => {
          if (!open && (isSaving || alert.show || !hasAttemptedSave)) {
            return;
          }
          setOpenEdit(open);
          if (open) {
            setAlert({
              show: false,
              title: '',
              description: '',
              variant: 'success',
            });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Event</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='space-y-2'>
            {alert.show && alert.variant === 'error' && (
              <Alert variant='destructive' className='py-2'>
                <AlertDescription className='text-xs'>
                  {alert.description}
                </AlertDescription>
              </Alert>
            )}
            <Label className='text-medium'>
              Title<span className='text-red-500'>*</span>
            </Label>
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

            <Label className='text-medium'>
              Description <span className='text-gray-400'>(optional)</span>
            </Label>
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
                <Label className='text-medium mb-2'>
                  Date<span className='text-red-500'> *</span>
                </Label>
                <Popover
                  modal
                  open={openEditDatePicker}
                  onOpenChange={setOpenEditDatePicker}
                >
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
                  <PopoverContent
                    align='start'
                    className='w-auto p-0'
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <Calendar
                      mode='single'
                      selected={editData.date || undefined}
                      onSelect={(date) => {
                        if (date) {
                          setEditData({ ...editData, date: date || null });
                        }
                      }}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className='text-medium mb-2'>Time</Label>
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
                {dateError && (
                  <p className='text-sm text-red-500 mt-1'>{dateError}</p>
                )}
                {timeError && (
                  <p className='text-sm text-red-500 mt-1'>{timeError}</p>
                )}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setOpenEdit(false)}
              className='bg-gray-100 text-gray-700 hover:bg-gray-200 h-8 text-xs'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={saveEdit}
              className='bg-[#124A69] text-white hover:bg-[#0a2f42] h-8 text-xs'
              disabled={
                !editData.title || !editData.date || !!timeError || isSaving
              }
            >
              {isSaving ? 'Saving...' : 'Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={openAdd}
        onOpenChange={(open) => {
          if (!open && (isSaving || alert.show || !hasAttemptedSave)) {
            return;
          }
          setOpenAdd(open);
          if (open) {
            setAlert({
              show: false,
              title: '',
              description: '',
              variant: 'success',
            });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Event</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='space-y-3'>
            {alert.show && alert.variant === 'error' && (
              <Alert variant='destructive' className='py-2'>
                <AlertDescription className='text-xs'>
                  {alert.description}
                </AlertDescription>
              </Alert>
            )}
            <div>
              <Label className='text-medium'>
                Title<span className='text-red-500'>*</span>
              </Label>
              <Input
                placeholder='Title'
                value={newEvent.title}
                onChange={(e) => {
                  if (e.target.value.length <= 20) {
                    setNewEvent({ ...newEvent, title: e.target.value });
                  }
                }}
              />
              <p className='text-[10px] flex justify-end mt-1 text-gray-500'>
                {newEvent.title.length}/20
              </p>
            </div>
            <div>
              <Label className='text-medium'>
                Description<span className='text-gray-400'>(optional)</span>
              </Label>
              <Textarea
                placeholder='Add a description'
                className='resize-none h-16'
                value={newEvent.description}
                onChange={(e) => {
                  if (e.target.value.length <= 30) {
                    setNewEvent({ ...newEvent, description: e.target.value });
                  }
                }}
              />
              <p className='text-[10px] flex justify-end mt-1 text-gray-500'>
                {newEvent.description.length}/30
              </p>
            </div>

            <div className='space-y-2'>
              <Label className='text-medium'>
                Date and Time <span className='text-red-500'>*</span>
              </Label>
              <div className='space-y-1'>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <Popover
                      modal
                      open={openAddDatePicker}
                      onOpenChange={setOpenAddDatePicker}
                    >
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
                      <PopoverContent
                        align='start'
                        className='w-auto p-0'
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <Calendar
                          mode='single'
                          selected={newEvent.date || undefined}
                          onSelect={(date) => {
                            if (date) {
                              setNewEvent({
                                ...newEvent,
                                date: date || null,
                              });
                            }
                          }}
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
              {dateError && (
                <p className='text-[11px] text-red-500'>{dateError}</p>
              )}
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
                      newEvent.dates.length > 4
                        ? 'max-h-60 overflow-y-auto pr-1'
                        : ''
                    }`}
                  >
                    {newEvent.dates.map((dateItem, index) => (
                      <div key={index} className='border p-2 rounded-md'>
                        <div className='grid grid-cols-2 gap-2'>
                          <div>
                            <Popover
                              modal
                              open={openAdditionalDatePickers[index]}
                              onOpenChange={(open) => {
                                setOpenAdditionalDatePickers((prev) => {
                                  const next = [...prev];
                                  next[index] = open;
                                  return next;
                                });
                              }}
                            >
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
                                onOpenAutoFocus={(e) => e.preventDefault()}
                              >
                                <Calendar
                                  mode='single'
                                  selected={dateItem.date || undefined}
                                  onSelect={(date) => {
                                    handleAdditionalDateChange(
                                      index,
                                      date || null,
                                    );
                                  }}
                                  disabled={(date) =>
                                    date <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className='flex items-center gap-1'>
                            <div className='grid grid-cols-2 gap-1'>
                              <div className='relative'>
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
                                  className='h-7 text-[11px] cursor-pointer'
                                  onClick={(e) => {
                                    const input = e.target as HTMLInputElement;
                                    input.showPicker();
                                  }}
                                />
                                {!dateItem.fromTime && (
                                  <div className='absolute inset-0 flex items-center px-3 pointer-events-none text-[11px] text-muted-foreground'></div>
                                )}
                              </div>
                              <div className='relative'>
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
                                  className='h-7 text-[11px] cursor-pointer'
                                  onClick={(e) => {
                                    const input = e.target as HTMLInputElement;
                                    input.showPicker();
                                  }}
                                />
                                {!dateItem.toTime && (
                                  <div className='absolute inset-0 flex items-center px-3 pointer-events-none text-[11px] text-muted-foreground'></div>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={() => removeDate(index)}
                              variant='ghost'
                              className='h-7 w-7 p-0 hover:bg-red-50'
                              type='button'
                            >
                              <Trash className='h-3 w-3 text-red-500' />
                            </Button>
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
                <Plus className='mr-1 h-3 w-3' />
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
              disabled={
                !newEvent.title || !newEvent.date || !!timeError || isSaving
              }
            >
              {isSaving ? 'Saving...' : 'Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
