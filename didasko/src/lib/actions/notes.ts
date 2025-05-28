'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getNotes(userId: string) {
  try {
    // Use the Note model to find all notes for a user
    // @ts-ignore - access the model based on schema mapping
    const notes = await prisma.Note.findMany({
      where: { userId },
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
  userId,
}: {
  title: string;
  description?: string | null;
  userId: string;
}) {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Create note
    // @ts-ignore - access the model based on schema mapping
    const note = await prisma.Note.create({
      data: {
        title,
        description,
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
  userId,
}: {
  id: string;
  title: string;
  description?: string | null;
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

    // Update note
    // @ts-ignore - access the model based on schema mapping
    const note = await prisma.Note.update({
      where: { id },
      data: {
        title,
        description,
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
