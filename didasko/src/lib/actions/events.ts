'use server';

import { prisma } from '@/lib/db';
import { Role } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { startOfDay } from 'date-fns';

// A safer way to access the Event model that works with different naming conventions
const getEventModel = () => {
  // @ts-ignore - we need to check different possible names at runtime
  return prisma['Event'] || prisma['event'] || prisma['events'];
};

// Function to ensure we're only using the date part without time
function normalizeDate(date: Date): Date {
  return startOfDay(new Date(date));
}

export async function getEvents() {
  try {
    const eventModel = getEventModel();
    if (!eventModel) {
      console.error('Event model not found in Prisma client');
      return { events: [], error: 'Event model not found' };
    }

    const events = await eventModel.findMany({
      orderBy: {
        date: 'asc',
      },
    });

    return { events, error: null };
  } catch (error: any) {
    console.error('Failed to fetch events:', error);
    return { events: [], error: 'Failed to fetch events' };
  }
}

export async function addEvent({
  title,
  description,
  date,
  fromTime,
  toTime,
  userRole,
}: {
  title: string;
  description?: string | null;
  date: Date;
  fromTime?: string | null;
  toTime?: string | null;
  userRole: Role;
}) {
  try {
    if (userRole !== Role.ACADEMIC_HEAD) {
      return { success: false, error: 'Unauthorized' };
    }

    const eventModel = getEventModel();
    if (!eventModel) {
      console.error('Event model not found in Prisma client');
      return { success: false, error: 'Event model not found' };
    }

    // Normalize date to remove time portion
    const normalizedDate = normalizeDate(date);

    console.log('Creating event with:', {
      title,
      description,
      date: normalizedDate,
      fromTime,
      toTime,
      role: userRole,
    });

    const event = await eventModel.create({
      data: {
        title,
        description,
        date: normalizedDate,
        fromTime,
        toTime,
        role: userRole,
      },
    });

    console.log('Event created:', event);

    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/academic-head');

    return { success: true, event, error: null };
  } catch (error: any) {
    console.error('Failed to add event:', error);
    return {
      success: false,
      error: `Failed to add event: ${error?.message || 'Unknown error'}`,
    };
  }
}

export async function updateEvent({
  id,
  title,
  description,
  date,
  fromTime,
  toTime,
  userRole,
}: {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  fromTime?: string | null;
  toTime?: string | null;
  userRole: Role;
}) {
  try {
    if (userRole !== Role.ACADEMIC_HEAD) {
      return { success: false, error: 'Unauthorized' };
    }

    const eventModel = getEventModel();
    if (!eventModel) {
      console.error('Event model not found in Prisma client');
      return { success: false, error: 'Event model not found' };
    }

    // Normalize date to remove time portion
    const normalizedDate = normalizeDate(date);

    const event = await eventModel.update({
      where: { id },
      data: {
        title,
        description,
        date: normalizedDate,
        fromTime,
        toTime,
      },
    });

    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/academic-head');

    return { success: true, event, error: null };
  } catch (error: any) {
    console.error('Failed to update event:', error);
    return {
      success: false,
      error: `Failed to update event: ${error?.message || 'Unknown error'}`,
    };
  }
}

export async function deleteEvent({
  id,
  userRole,
}: {
  id: string;
  userRole: Role;
}) {
  try {
    if (userRole !== Role.ACADEMIC_HEAD) {
      return { success: false, error: 'Unauthorized' };
    }

    const eventModel = getEventModel();
    if (!eventModel) {
      console.error('Event model not found in Prisma client');
      return { success: false, error: 'Event model not found' };
    }

    await eventModel.delete({
      where: { id },
    });

    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/academic-head');

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Failed to delete event:', error);
    return {
      success: false,
      error: `Failed to delete event: ${error?.message || 'Unknown error'}`,
    };
  }
}
