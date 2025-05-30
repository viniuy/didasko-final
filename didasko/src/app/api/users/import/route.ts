import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role, WorkType, Permission } from '@prisma/client';

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  skipped: number;
  errors: {
    row: number;
    email: string;
    message: string;
  }[];
  importedUsers: {
    name: string;
    email: string;
    row: number;
  }[];
  detailedFeedback: {
    row: number;
    email: string;
    status: 'imported' | 'skipped' | 'error';
    message?: string;
  }[];
}

export async function POST(request: Request) {
  console.log('Starting import process...');
  const result: ImportResult = {
    success: false,
    total: 0,
    imported: 0,
    skipped: 0,
    errors: [],
    importedUsers: [],
    detailedFeedback: [],
  };

  try {
    // Log the request headers
    console.log(
      'Request headers:',
      Object.fromEntries(request.headers.entries()),
    );

    // Expecting an array of user data in the request body
    const body = await request.json();
    if (!Array.isArray(body)) {
      console.log('Invalid request body: not an array');
      return NextResponse.json(
        { error: 'Invalid request body: Expected an array of user data' },
        { status: 400 },
      );
    }

    let data: any[];

    data = body;

    console.log('Parsed data sample:', data.slice(0, 1));
    result.total = data.length;
    console.log(`Found ${result.total} rows to process`);

    // Get existing emails for duplicate checking
    console.log('Fetching existing users...');
    const existingUsers = await prisma.user.findMany({
      select: { email: true },
    });
    const existingEmails = new Set(
      existingUsers.map((user) => user.email.toLowerCase()),
    );
    console.log(`Found ${existingEmails.size} existing users`);

    // Process rows in batches of 10
    const BATCH_SIZE = 10;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
          data.length / BATCH_SIZE,
        )}`,
      );

      await Promise.all(
        batch.map(async (row: any, index: number) => {
          const rowNumber = i + index + 1;

          // Log progress
          console.log(`Processing row ${rowNumber} of ${data.length}`);

          const email = row['Email']?.toLowerCase().trim();
          const lastName = row['Last Name']?.trim();
          const firstName = row['First Name']?.trim();
          const department = row['Department']?.trim();
          const workType = row['Work Type']?.trim();
          const role = row['Role']?.trim();
          const permission = row['Permission']?.trim();

          // Validate required fields
          if (
            !email ||
            !lastName ||
            !firstName ||
            !department ||
            !workType ||
            !role ||
            !permission
          ) {
            console.log(`Row ${rowNumber}: Missing required fields`, {
              email,
              lastName,
              firstName,
              department,
              workType,
              role,
              permission,
            });
            result.errors.push({
              row: rowNumber,
              email: email || 'N/A',
              message: 'Missing required fields',
            });
            result.skipped++;
            result.detailedFeedback.push({
              row: rowNumber,
              email: email || 'N/A',
              status: 'skipped',
              message: 'Missing required fields',
            });
            return;
          }

          // Check for duplicate email
          if (existingEmails.has(email)) {
            console.log(`Row ${rowNumber}: Email already exists: ${email}`);
            result.errors.push({
              row: rowNumber,
              email,
              message: 'Email already exists in the system',
            });
            result.skipped++;
            result.detailedFeedback.push({
              row: rowNumber,
              email: email || '',
              status: 'skipped',
              message: 'Email already exists',
            });
            return;
          }

          try {
            // Format the name
            const formattedName = `${lastName} ${firstName}${
              row['Middle Initial'] ? ` ${row['Middle Initial']}` : ''
            }`;

            // Convert work type to enum
            const workTypeEnum = workType
              .toUpperCase()
              .replace(/\s+/g, '_') as WorkType;
            if (!Object.values(WorkType).includes(workTypeEnum)) {
              throw new Error(`Invalid work type: ${workType}`);
            }

            // Convert role to enum
            const roleEnum = role.toUpperCase().replace(/\s+/g, '_') as Role;
            if (!Object.values(Role).includes(roleEnum)) {
              throw new Error(`Invalid role: ${role}`);
            }

            // Convert permission to enum
            const permissionEnum = permission.toUpperCase() as Permission;
            if (!Object.values(Permission).includes(permissionEnum)) {
              throw new Error(`Invalid permission: ${permission}`);
            }

            console.log(`Creating user with data:`, {
              name: formattedName,
              email,
              department,
              workType: workTypeEnum,
              role: roleEnum,
              permission: permissionEnum,
            });

            // Create user in database
            const user = await prisma.user.create({
              data: {
                name: formattedName,
                email,
                department,
                workType: workTypeEnum,
                role: roleEnum,
                permission: permissionEnum,
              },
            });

            console.log(`User created successfully: ${user.id}`);
            existingEmails.add(email);
            result.imported++;
            result.importedUsers.push({
              name: formattedName,
              email,
              row: rowNumber,
            });
            result.detailedFeedback.push({
              row: rowNumber,
              email,
              status: 'imported',
            });
          } catch (error) {
            console.error(`Error creating user at row ${rowNumber}:`, error);
            const errorMessage =
              error instanceof Error ? error.message : 'Failed to create user';
            result.errors.push({
              row: rowNumber,
              email,
              message: errorMessage,
            });
            result.skipped++;
            result.detailedFeedback.push({
              row: rowNumber,
              email,
              status: 'error',
              message: errorMessage,
            });
          }
        }),
      );
    }

    result.success =
      result.imported > 0 || result.skipped > 0 || result.errors.length > 0;
    console.log('Import process completed:', result);

    // Always return a 200 status with the result
    return NextResponse.json({
      success: true,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
      importedUsers: result.importedUsers,
      total: result.total,
      detailedFeedback: result.detailedFeedback,
    });
  } catch (error) {
    console.error('Error in import process:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to process import';
    return NextResponse.json(
      {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [
          {
            row: 0,
            email: 'N/A',
            message: errorMessage,
          },
        ],
        importedUsers: [],
        total: 0,
        detailedFeedback: [],
      },
      { status: 500 },
    );
  }
}
