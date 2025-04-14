'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { startOfDay } from 'date-fns';

export async function getNotes(userId: string) {
  try {
    // Use the Note model to find all notes for a user
    // @ts-ignore - access the model based on schema mapping
    const notes = await prisma.Note.findMany({
      where: { userId },
      orderBy: {
        date: 'asc',
      },
    });

    return { notes, error: null };
  } catch (error: any) {
    console.error('Failed to fetch notes:', error);
    return { notes: [], error: 'Failed to fetch notes' };
  }
}

export async function addNote({
  title,
  description,
  date,
  userId,
}: {
  title: string;
  description?: string | null;
  date: Date;
  userId: string;
}) {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Normalize date to remove time component
    const normalizedDate = startOfDay(new Date(date));

    // Create note
    // @ts-ignore - access the model based on schema mapping
    const note = await prisma.Note.create({
      data: {
        title,
        description,
        date: normalizedDate,
        userId,
      },
    });

    revalidatePath('/dashboard');

    return { success: true, note, error: null };
  } catch (error: any) {
    console.error('Failed to add note:', error);
    return { success: false, error: 'Failed to add note' };
  }
}

export async function updateNote({
  id,
  title,
  description,
  date,
  userId,
}: {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  userId: string;
}) {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // First verify the note belongs to the user
    // @ts-ignore - access the model based on schema mapping
    const existingNote = await prisma.Note.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingNote) {
      return { success: false, error: 'Note not found or access denied' };
    }

    // Normalize date to remove time component
    const normalizedDate = startOfDay(new Date(date));

    // Update note
    // @ts-ignore - access the model based on schema mapping
    const note = await prisma.Note.update({
      where: { id },
      data: {
        title,
        description,
        date: normalizedDate,
      },
    });

    revalidatePath('/dashboard');

    return { success: true, note, error: null };
  } catch (error: any) {
    console.error('Failed to update note:', error);
    return { success: false, error: 'Failed to update note' };
  }
}

export async function deleteNote({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // First verify the note belongs to the user
    // @ts-ignore - access the model based on schema mapping
    const existingNote = await prisma.Note.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingNote) {
      return { success: false, error: 'Note not found or access denied' };
    }

    // Delete note
    // @ts-ignore - access the model based on schema mapping
    await prisma.Note.delete({
      where: { id },
    });

    revalidatePath('/dashboard');

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Failed to delete note:', error);
    return { success: false, error: 'Failed to delete note' };
  }
}
