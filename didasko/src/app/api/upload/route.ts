import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    console.log('Starting image upload process...');
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('Unauthorized: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    console.log('Received file:', {
      name: file?.name,
      type: file?.type,
      size: file?.size,
    });

    if (!file) {
      console.log('No file provided in form data');
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 },
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 },
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${uuidv4()}.${ext}`;
    console.log('Generated filename:', filename);

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    console.log('Upload directory path:', uploadDir);

    try {
      console.log('Attempting to create directory if not exists...');
      const { mkdir } = require('fs/promises');
      await mkdir(uploadDir, { recursive: true });
      console.log('Directory created/verified');

      console.log('Converting file to buffer...');
      const buffer = Buffer.from(await file.arrayBuffer());
      console.log('Buffer created, size:', buffer.length);

      const fullPath = join(uploadDir, filename);
      console.log('Full file path:', fullPath);

      console.log('Writing file...');
      await writeFile(fullPath, buffer);
      console.log('File written successfully');

      // Return the URL for the uploaded image
      const imageUrl = `/uploads/${filename}`;
      console.log('Generated image URL:', imageUrl);
      return NextResponse.json({ imageUrl });
    } catch (err) {
      const error = err as Error & { code?: string };
      console.error('Detailed error information:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        uploadDir,
        filename,
        cwd: process.cwd(),
      });
      throw error; // Re-throw to be caught by outer catch
    }
  } catch (err) {
    const error = err as Error;
    console.error('Error in upload process:', error);
    return NextResponse.json(
      { error: `Failed to upload image: ${error.message}` },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL provided' },
        { status: 400 },
      );
    }

    // Extract filename from the URL
    const filename = imageUrl.split('/uploads/')[1];
    if (!filename) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    // Construct the full path to the file
    const filePath = join(process.cwd(), 'public/uploads', filename);

    // Delete the file
    try {
      await unlink(filePath);
      return NextResponse.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      return NextResponse.json(
        { error: 'File not found or could not be deleted' },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json(
      { error: 'Error processing delete request' },
      { status: 500 },
    );
  }
}
