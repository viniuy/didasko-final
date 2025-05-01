import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all notes for this user
    const notes = await prisma.note.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log(`Found ${notes.length} notes for user ${userId}`);

    const formattedNotes = notes.map((note) => ({
      ...note,
      date: note.date.toISOString(),
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }));

    return NextResponse.json({ notes: formattedNotes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Get session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { title, description, date } = body;

    const note = await prisma.note.create({
      data: {
        title,
        description,
        date: new Date(date),
        userId,
      },
    });

    console.log('Created note with ID:', note.id);
    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, title, description, date } = await request.json();

    // Get session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const note = await prisma.note.update({
      where: {
        id,
        userId,
      },
      data: {
        title,
        description,
        date: new Date(date),
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('Processing DELETE request for note');

    // Parse the request body
    const body = await request.json();
    console.log('Delete request body:', body);

    const { id } = body;

    if (!id) {
      console.log('Error: Note ID is missing from request');
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 },
      );
    }

    // Get session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    console.log('Session user ID:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the note first to check if it exists
    const noteToDelete = await prisma.note.findUnique({
      where: {
        id,
      },
    });

    if (!noteToDelete) {
      console.log(`Note with ID ${id} not found`);
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    console.log(
      `Found note to delete: ${noteToDelete.id}, owner: ${noteToDelete.userId}`,
    );

    // Check if the note belongs to the user
    if (noteToDelete.userId !== userId) {
      console.log(`Note belongs to user ${noteToDelete.userId}, not ${userId}`);
      return NextResponse.json(
        { error: 'Not authorized to delete this note' },
        { status: 403 },
      );
    }

    // Delete the note
    await prisma.note.delete({
      where: {
        id,
      },
    });

    console.log(`Successfully deleted note with ID ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 },
    );
  }
}
