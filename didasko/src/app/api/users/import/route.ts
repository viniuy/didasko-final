import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role, WorkType, Permission } from '@prisma/client';
import * as XLSX from 'xlsx';

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
  };

  try {
    // Log the request headers
    console.log(
      'Request headers:',
      Object.fromEntries(request.headers.entries()),
    );

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Log file details
    console.log('Received file:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Read the file content
    console.log('Reading file content...');
    const buffer = await file.arrayBuffer();
    console.log('File buffer size:', buffer.byteLength);

    let data;
    if (file.name.toLowerCase().endsWith('.csv')) {
      // Handle CSV files
      const text = await file.text();
      console.log('CSV content preview:', text.substring(0, 200));
      const rows = text.split('\n').map((row) => row.split(','));
      data = rows.slice(1).map((row) => {
        const obj: any = {};
        rows[0].forEach((header, index) => {
          obj[header.trim()] = row[index]?.trim() || '';
        });
        return obj;
      });
    } else {
      // Handle Excel files
      const workbook = XLSX.read(buffer, { type: 'array' });
      console.log('Workbook sheets:', workbook.SheetNames);

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Get the range of the worksheet
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      console.log('Worksheet range:', range);

      // Skip the header rows (title, date, etc.) and start from the actual column headers
      let headerRowIndex = -1;
      for (let R = range.s.r; R <= range.e.r; R++) {
        const firstCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 0 })];
        if (firstCell?.v === 'Last Name') {
          headerRowIndex = R;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error('Could not find header row in Excel file');
      }

      console.log('Found header row at index:', headerRowIndex);

      // Read data starting from the row after headers
      data = XLSX.utils.sheet_to_json(worksheet, {
        range: headerRowIndex,
        header: 1,
        raw: false,
        defval: '',
      });

      // Remove the header row
      data = data.slice(1);

      // Map array data to object with proper keys
      data = data.map((row: any) => ({
        'Last Name': row[0] || '',
        'First Name': row[1] || '',
        'Middle Initial': row[2] || '',
        Email: row[3] || '',
        Department: row[4] || '',
        'Work Type': row[5] || '',
        Role: row[6] || '',
        Permission: row[7] || '',
      }));
    }

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
          } catch (error) {
            console.error(`Error creating user at row ${rowNumber}:`, error);
            result.errors.push({
              row: rowNumber,
              email,
              message:
                error instanceof Error
                  ? error.message
                  : 'Failed to create user',
            });
            result.skipped++;
          }
        }),
      );
    }

    result.success = result.imported > 0 || result.skipped > 0;
    console.log('Import process completed:', result);

    // Always return a 200 status with the result
    return NextResponse.json({
      success: true,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
      importedUsers: result.importedUsers,
      total: result.total,
    });
  } catch (error) {
    console.error('Error in import process:', error);
    return NextResponse.json(
      {
        success: true,
        imported: 0,
        skipped: 0,
        errors: [
          {
            row: 0,
            email: 'N/A',
            message:
              error instanceof Error
                ? error.message
                : 'Failed to process import',
          },
        ],
        importedUsers: [],
        total: 0,
      },
      { status: 200 },
    );
  }
}
