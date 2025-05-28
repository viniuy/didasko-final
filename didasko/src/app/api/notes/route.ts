import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import {
  Note,
  NoteCreateInput,
  NoteUpdateInput,
  NoteResponse,
} from '@/types/note';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.note.count({
      where: { userId: session.user.id },
    });

    // Get notes with pagination
    const notes = await prisma.note.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Transform dates to ISO strings
    const transformedNotes: Note[] = notes.map((note) => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }));

    const response: NoteResponse = {
      notes: transformedNotes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, userId } = body as NoteCreateInput;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Verify that the userId matches the session user
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to create note for another user' },
        { status: 403 },
      );
    }

    const note = await prisma.note.create({
      data: {
        title,
        description: description || null,
        userId,
      },
    });

    // Transform dates to ISO strings
    const transformedNote: Note = {
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };

    return NextResponse.json({ note: transformedNote });
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description } = body as NoteUpdateInput;

    // Validate required fields
    if (!id || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const note = await prisma.note.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        title,
        description,
      },
    });

    // Transform dates to ISO strings
    const transformedNote: Note = {
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };

    return NextResponse.json({ note: transformedNote });
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 },
      );
    }

    // Find the note first to check if it exists and belongs to the user
    const noteToDelete = await prisma.note.findUnique({
      where: { id },
    });

    if (!noteToDelete) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (noteToDelete.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this note' },
        { status: 403 },
      );
    }

    await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 },
    );
  }
}
