'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
import {
  Download,
  Upload,
  Search,
  ChevronLeft,
  CalendarIcon,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { StudentCard } from './student-card';
import { FilterSheet } from './filter-sheet';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AddStudentSheet } from './add-student-sheet';
import { AttendanceStatus } from '@prisma/client';
import { FilterState } from '@/types/attendance';

// Add interface for Excel data
interface ExcelRow {
  Students: string;
  Name: string;
  Status: string;
  Date: string;
}

interface StudentCardProps {
  student: {
    name: string;
    status: AttendanceStatusWithNotSet;
    image?: string;
    date?: string;
    semester?: string;
  };
  index: number;
  tempImage: { index: number; dataUrl: string } | null;
  onImageUpload: (index: number, name: string) => void;
  onSaveChanges: (index: number) => void;
  onRemoveImage: (index: number, name: string) => void;
  onStatusChange: (index: number, status: AttendanceStatus) => void;
}

interface AddStudentSheetProps {
  onAddStudent: (student: {
    lastName: string;
    firstName: string;
    middleInitial?: string;
    image?: string;
  }) => void;
  onSelectExistingStudent: (student: {
    id: string;
    lastName: string;
    firstName: string;
    middleInitial?: string;
    image?: string;
  }) => void;
  onStudentsRemoved: () => void;
}

interface ApiStudent {
  id: string;
  name: string;
  image?: string;
}

interface Student {
  id: string;
  name: string;
  image?: string;
  status: AttendanceStatusWithNotSet;
  attendanceRecords: AttendanceRecord[];
}

type AttendanceStatusWithNotSet = AttendanceStatus | 'NOT_SET';

interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: AttendanceStatus;
  reason: string | null;
}

export default function StudentList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [courseInfo, setCourseInfo] = useState<{
    code: string;
    section: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDate] = useState<'newest' | 'oldest' | ''>('');
  const [imageToRemove, setImageToRemove] = useState<{
    index: number;
    name: string;
  } | null>(null);
  const itemsPerPage = 10;
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
  });
  const [tempImage, setTempImage] = useState<{
    index: number;
    dataUrl: string;
  } | null>(null);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState<{
    [key: string]: AttendanceStatus;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<{
    [key: number]: boolean;
  }>({});
  const [isDateLoading, setIsDateLoading] = useState(false);

  const fetchStudents = async () => {
    if (!courseId) return;

    try {
      setIsLoading(true);
      setIsDateLoading(true);
      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();

      // If a date is selected, fetch attendance records for that date
      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        console.log('Fetching attendance for date:', dateStr);
        const attendanceResponse = await fetch(
          `/api/courses/${courseId}/attendance?date=${dateStr}`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          console.log('Received attendance data:', attendanceData);
          const attendanceMap = new Map(
            attendanceData.map((record: AttendanceRecord) => [
              record.studentId,
              record,
            ]),
          );

          const studentsWithAttendance: Student[] = data.students.map(
            (student: any) => {
              const attendanceRecord = attendanceMap.get(student.id);
              return {
                id: student.id,
                name: student.name,
                image: student.image || undefined,
                status: attendanceRecord?.status || 'NOT_SET',
                attendanceRecords: attendanceRecord ? [attendanceRecord] : [],
              };
            },
          );

          console.log(
            'Final students with attendance:',
            studentsWithAttendance,
          );
          setStudentList(studentsWithAttendance);
        } else {
          console.log('No attendance records found for date:', dateStr);
          // If no attendance records found, initialize with empty records
          const studentsWithEmptyRecords: Student[] = data.students.map(
            (student: ApiStudent) => ({
              id: student.id,
              name: student.name,
              image: student.image,
              status: 'NOT_SET' as const,
              attendanceRecords: [],
            }),
          );
          setStudentList(studentsWithEmptyRecords);
        }
      } else {
        console.log('No date selected, initializing with empty records');
        // If no date selected, initialize with empty records
        const studentsWithEmptyRecords: Student[] = data.students.map(
          (student: ApiStudent) => ({
            id: student.id,
            name: student.name,
            image: student.image,
            status: 'NOT_SET' as const,
            attendanceRecords: [],
          }),
        );
        setStudentList(studentsWithEmptyRecords);
      }

      setCourseInfo(data.course);
    } catch (error) {
      console.error('Error in fetchStudents:', error);
      setStudentList([]);
    } finally {
      setIsLoading(false);
      setIsDateLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [courseId, selectedDate]);

  // Get attendance records for the selected date
  const getAttendanceForDate = (student: Student, date: Date | undefined) => {
    if (!date) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    console.log('Looking for attendance on date:', dateStr);
    console.log('Student attendance records:', student.attendanceRecords);
    const record = student.attendanceRecords.find((record) => {
      const recordDate = record.date.split('T')[0];
      console.log(
        'Comparing record date:',
        recordDate,
        'with selected date:',
        dateStr,
      );
      return recordDate === dateStr;
    });
    console.log('Found record:', record);
    return record;
  };

  // Get attendance status for the selected date
  const getStatusForDate = (
    student: Student,
    selectedDate: string,
  ): AttendanceStatusWithNotSet => {
    const record = student.attendanceRecords.find(
      (record) => record.date === selectedDate,
    );
    return record ? record.status : 'NOT_SET';
  };

  // Filter students based on all filters
  const filteredStudents = useMemo(() => {
    return studentList
      .filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .filter((student) => {
        if (filters.status.length === 0) return true;
        return filters.status.includes(student.status);
      })
      .sort((a, b) => {
        if (!sortDate) return 0;
        const aAttendance = getAttendanceForDate(a, selectedDate);
        const bAttendance = getAttendanceForDate(b, selectedDate);
        if (sortDate === 'newest') {
          return (bAttendance?.date || '').localeCompare(
            aAttendance?.date || '',
          );
        }
        return (aAttendance?.date || '').localeCompare(bAttendance?.date || '');
      });
  }, [studentList, searchQuery, selectedDate, filters.status]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const updateStatus = (index: number, newStatus: AttendanceStatus) => {
    const student = studentList[index];
    setUnsavedChanges((prev) => ({
      ...prev,
      [student.id]: newStatus,
    }));

    // Update local state for immediate UI feedback
    setStudentList((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status: newStatus } : s)),
    );
  };

  const currentStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleImageUpload = (index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setTempImage({
              index,
              dataUrl: e.target.result as string,
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSaveChanges = async (index: number) => {
    if (!tempImage || tempImage.index !== index) return;

    try {
      setIsSaving(true);
      const formData = new FormData();
      // Convert base64 to blob
      const base64Response = await fetch(tempImage.dataUrl);
      const blob = await base64Response.blob();

      // Get file extension from data URL
      const ext = tempImage.dataUrl.split(';')[0].split('/')[1];
      const fileName = `image.${ext}`;

      // Create file from blob with proper name and type
      const file = new File([blob], fileName, { type: `image/${ext}` });
      formData.append('image', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const { imageUrl } = await uploadResponse.json();

      // Update the student's image in the database
      const student = studentList[index];
      const updateResponse = await fetch(`/api/students/${student.id}/image`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update student image in database');
      }

      // Update student list with new image URL
      setStudentList((prev) =>
        prev.map((student, i) =>
          i === index ? { ...student, image: imageUrl } : student,
        ),
      );

      // Clear temp image
      setTempImage(null);

      // Show success message
      setShowSuccessMessage((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setShowSuccessMessage((prev) => ({ ...prev, [index]: false }));
      }, 3000);
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save image',
        {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#EF4444',
            color: 'white',
            fontSize: '14px',
            padding: '12px',
            borderRadius: '8px',
          },
        },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmAndRemoveImage = async () => {
    if (imageToRemove) {
      try {
        const student = studentList[imageToRemove.index];

        // Delete the image file from public/uploads
        if (student.image) {
          const deleteResponse = await fetch('/api/upload', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: student.image }),
          });

          if (!deleteResponse.ok) {
            console.error('Failed to delete image file');
          }
        }

        // Update the database
        const updateResponse = await fetch(
          `/api/students/${student.id}/image`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: null }),
          },
        );

        if (!updateResponse.ok) {
          throw new Error('Failed to remove image from database');
        }

        // Update local state
        setStudentList((prev) =>
          prev.map((student, idx) =>
            idx === imageToRemove.index
              ? { ...student, image: undefined }
              : student,
          ),
        );
        // Clear temp image if it exists for this student
        if (tempImage?.index === imageToRemove.index) {
          setTempImage(null);
        }
        setImageToRemove(null);
        toast.success('Profile picture removed successfully');
      } catch (error) {
        console.error('Error removing image:', error);
        toast.error('Failed to remove profile picture');
      }
    }
  };

  const markAllAsPresent = () => {
    if (!selectedDate) {
      toast.error('Please select a date first');
      return;
    }

    const newChanges: Record<string, AttendanceStatus> = {};
    studentList.forEach((student) => {
      newChanges[student.id] = 'PRESENT' as AttendanceStatus;
    });
    setUnsavedChanges((prev) => ({
      ...prev,
      ...newChanges,
    }));

    // Update local state for immediate UI feedback
    setStudentList((prev) =>
      prev.map((student) => ({
        ...student,
        status: 'PRESENT' as AttendanceStatus,
      })),
    );
  };

  const handleApplyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      status: filters.status,
    }));
    setIsFilterSheetOpen(false);
  };

  const handleExport = () => {
    if (!selectedDate) {
      toast.error('Please select a date before exporting');
      return;
    }

    const formattedDate = format(selectedDate, 'MMMM d, yyyy');

    // Create header rows
    const header = [
      ['ATTENDANCE RECORD'],
      [''],
      ['Date:', formattedDate],
      ['Course:', courseInfo?.code || ''],
      ['Section:', courseInfo?.section || ''],
      [''],
      // Column headers
      ['Student Name', 'Attendance Status'],
    ];

    // Create student data rows
    const studentRows = studentList.map((student) => {
      const attendance = getAttendanceForDate(student, selectedDate);
      return [student.name, attendance?.status || 'NOT SET'];
    });

    // Combine header and data
    const ws = XLSX.utils.aoa_to_sheet([...header, ...studentRows]);

    // Style configurations
    const headerStyle = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center' },
    };
    const normalStyle = { font: { size: 12 } };

    // Configure column widths
    ws['!cols'] = [
      { wch: 30 }, // Student Name
      { wch: 15 }, // Attendance Status
    ];

    // Merge cells for title
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Merge first row across all columns
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    // Generate filename with course and date
    const filename = `attendance_${courseInfo?.code || 'course'}_${format(
      selectedDate,
      'yyyy-MM-dd',
    )}.xlsx`;
    XLSX.writeFile(wb, filename);

    toast.success('Attendance data exported successfully');
    setShowExportPreview(false);
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

        const newStudents = jsonData.map((row) => ({
          id: row.Students,
          name: row.Name,
          attendanceRecords: [
            {
              id: crypto.randomUUID(),
              studentId: row.Students,
              status: row.Status as AttendanceStatus,
              date: row.Date,
            },
          ],
        }));

        setStudentList(
          newStudents.map((student) => ({
            ...student,
            status: 'NOT_SET' as AttendanceStatusWithNotSet,
          })),
        );
        setShowImportDialog(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing Excel file:', error);
      toast.error('Failed to import Excel file');
    }
  };

  const handleAddStudent = async (student: {
    lastName: string;
    firstName: string;
    middleInitial?: string;
    image?: string;
  }) => {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...student,
          courseId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add student');
      }

      const newStudent = await response.json();

      const fullName = `${newStudent.lastName}, ${newStudent.firstName}${
        newStudent.middleInitial ? ` ${newStudent.middleInitial}.` : ''
      }`;

      setStudentList((prev) => [
        ...prev,
        {
          id: newStudent.id,
          name: fullName,
          image: newStudent.image,
          status: 'NOT_SET' as AttendanceStatusWithNotSet,
          attendanceRecords: [],
        },
      ]);

      toast.success('Student added successfully');
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    }
  };

  const handleSelectExistingStudent = async (student: {
    id: string;
    lastName: string;
    firstName: string;
    middleInitial?: string;
    image?: string;
  }) => {
    try {
      console.log('Adding student to course:', {
        studentId: student.id,
        courseId: courseId,
      });

      const response = await fetch(`/api/courses/${courseId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to add existing student');
      }

      const fullName = `${student.lastName}, ${student.firstName}${
        student.middleInitial ? ` ${student.middleInitial}.` : ''
      }`;

      const newStudent: Student = {
        id: student.id,
        name: fullName,
        image: student.image,
        status: 'NOT_SET' as AttendanceStatusWithNotSet,
        attendanceRecords: [],
      };

      setStudentList((prev) => [...prev, newStudent]);
      toast.success('Student added successfully');
    } catch (error) {
      console.error('Error adding existing student:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to add student',
      );
    }
  };

  const saveAttendanceChanges = async () => {
    if (!selectedDate || Object.keys(unsavedChanges).length === 0) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/courses/${courseId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          attendance: Object.entries(unsavedChanges).map(
            ([studentId, status]) => {
              const student = studentList.find((s) => s.id === studentId);
              const existingRecord = student?.attendanceRecords.find(
                (record) => record.date === format(selectedDate, 'yyyy-MM-dd'),
              );
              return {
                studentId,
                status,
                id: existingRecord?.id,
              };
            },
          ),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      const updatedRecords = await response.json();

      // Update the local state with the new/updated records
      setStudentList((prev) =>
        prev.map((student) => {
          const updatedRecord = updatedRecords.records.find(
            (record: any) => record.studentId === student.id,
          );
          if (updatedRecord) {
            return {
              ...student,
              status: updatedRecord.status,
              attendanceRecords: student.attendanceRecords.map((record) =>
                record.date === updatedRecord.date ? updatedRecord : record,
              ),
            };
          }
          return student;
        }),
      );

      // Clear unsaved changes after successful save
      setUnsavedChanges({});
      toast.success('Attendance saved successfully');
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (isLoading) {
    return (
      <div className='flex flex-col h-screen'>
        <div className='flex items-center gap-4 p-4 border-b bg-white'>
          <Link href='/attendance'>
            <Button variant='ghost' size='icon' className='hover:bg-gray-100'>
              <ChevronLeft className='h-5 w-5' />
            </Button>
          </Link>
          <div className='flex items-center gap-2'>
            <div>
              <h1 className='text-[#124A69] font-bold text-xl'>Loading...</h1>
              <p className='text-gray-500 text-sm'>Please wait</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (studentList.length === 0) {
    return (
      <div className='flex flex-col h-screen'>
        <div className='flex items-center gap-4 p-4 border-b bg-white'>
          <Link href='/attendance'>
            <Button variant='ghost' size='icon' className='hover:bg-gray-100'>
              <ChevronLeft className='h-5 w-5' />
            </Button>
          </Link>
          <div className='flex items-center gap-2'>
            <div>
              <h1 className='text-[#124A69] font-bold text-xl'>
                No Students Found
              </h1>
              <p className='text-gray-500 text-sm'>
                There are no students enrolled in this course.
              </p>
            </div>
          </div>
          <div className='ml-auto'>
            <AddStudentSheet
              onAddStudent={handleAddStudent}
              onSelectExistingStudent={handleSelectExistingStudent}
              onStudentsRemoved={() => {
                if (courseId) {
                  fetchStudents();
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-screen'>
      <div className='flex items-center gap-4 p-4 border-b bg-white'>
        <Link href='/attendance'>
          <Button variant='ghost' size='icon' className='hover:bg-gray-100'>
            <ChevronLeft className='h-5 w-5' />
          </Button>
        </Link>
        <div className='flex items-center gap-2'>
          <div>
            <h1 className='text-[#124A69] font-bold text-xl'>
              {courseInfo?.code || 'Course'}
            </h1>
            <p className='text-gray-500 text-sm'>
              Section {courseInfo?.section || 'N/A'}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-3 ml-6 flex-grow'>
          <div className='flex items-center gap-3'>
            <div className='relative flex-grow max-w-[300px]'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search a name'
                className='w-full pl-9 bg-white border-gray-200 rounded-full h-10'
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='rounded-full h-10 pl-3 pr-2 flex items-center gap-2 w-[180px] justify-between relative'
                  disabled={isDateLoading}
                >
                  <span className='truncate'>
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </span>
                  {isDateLoading ? (
                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent' />
                  ) : (
                    <CalendarIcon className='h-4 w-4 flex-shrink-0' />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={isDateLoading}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            className='bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full px-6 h-10'
            onClick={markAllAsPresent}
          >
            MARK ALL AS PRESENT
          </Button>
          {hasUnsavedChanges && (
            <Button
              className='bg-[#124A69] hover:bg-[#0D3A54] text-white rounded-full px-6 h-10'
              onClick={saveAttendanceChanges}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className='mr-2'>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          )}
          <div className='flex items-center gap-3 ml-auto'>
            <FilterSheet
              isOpen={isFilterSheetOpen}
              onOpenChange={setIsFilterSheetOpen}
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={handleApplyFilters}
            />
            <Button
              variant='outline'
              size='icon'
              className='rounded-full'
              onClick={() => setShowExportPreview(true)}
              title='Export to Excel'
            >
              <Download className='h-4 w-4' />
            </Button>
            <AddStudentSheet
              onSelectExistingStudent={handleSelectExistingStudent}
              onStudentsRemoved={() => {
                if (courseId) {
                  fetchStudents();
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-auto p-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          {isDateLoading
            ? // Loading skeleton for student cards
              Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className='w-full bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse'
                >
                  <div className='flex flex-col items-center gap-3'>
                    <div className='w-16 h-16 bg-gray-200 rounded-full'></div>
                    <div className='w-2/3 h-4 bg-gray-200 rounded'></div>
                    <div className='w-full h-8 bg-gray-200 rounded-full'></div>
                  </div>
                </div>
              ))
            : currentStudents.map((student, index) => (
                <StudentCard
                  key={student.id}
                  student={{
                    name: student.name,
                    status: student.status,
                    image: student.image,
                  }}
                  index={index}
                  tempImage={tempImage}
                  onImageUpload={(index) => handleImageUpload(index)}
                  onSaveChanges={handleSaveChanges}
                  onRemoveImage={() =>
                    setImageToRemove({ index, name: student.name })
                  }
                  onStatusChange={(index, status: AttendanceStatus) =>
                    updateStatus(index, status)
                  }
                  isSaving={isSaving}
                />
              ))}
        </div>

        {totalPages > 1 && (
          <div className='mt-6'>
            <Pagination>
              <PaginationContent>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!imageToRemove}
        onOpenChange={() => setImageToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Picture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this profile picture? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndRemoveImage}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showExportPreview} onOpenChange={setShowExportPreview}>
        <DialogContent className='max-w-[600px] p-6'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold text-[#124A69]'>
              Export to Excel
            </DialogTitle>
            <DialogDescription>
              Preview of data to be exported:
            </DialogDescription>
          </DialogHeader>
          <div className='mt-6 max-h-[400px] overflow-auto'>
            <table className='w-full border-collapse'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                    Name
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                    Status
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentList.slice(0, 5).map((student) => (
                  <tr key={student.id}>
                    <td className='px-4 py-2 text-sm text-gray-900'>
                      {student.name}
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-900'>
                      {getAttendanceForDate(student, selectedDate)?.status ||
                        'NOT SET'}
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-900'>
                      {getAttendanceForDate(student, selectedDate)?.date || '-'}
                    </td>
                  </tr>
                ))}
                {studentList.length > 5 && (
                  <tr className='border-t'>
                    <td
                      colSpan={3}
                      className='px-4 py-2 text-sm text-gray-500 text-center'
                    >
                      And {studentList.length - 5} more students...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className='mt-6 flex justify-end gap-4'>
            <Button
              variant='outline'
              onClick={() => setShowExportPreview(false)}
            >
              Cancel
            </Button>
            <Button
              className='bg-[#124A69] hover:bg-[#0D3A54] text-white'
              onClick={handleExport}
            >
              Export to Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className='max-w-[400px] p-6'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold text-[#124A69]'>
              Import from Excel
            </DialogTitle>
            <DialogDescription>
              Select an Excel file to import student data.
            </DialogDescription>
          </DialogHeader>
          <div className='mt-6'>
            <Input
              type='file'
              accept='.xlsx, .xls'
              onChange={handleImportExcel}
              className='mb-4'
            />
            <Button
              className='w-full bg-[#124A69] hover:bg-[#0D3A54] text-white'
              onClick={() => setShowImportDialog(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
