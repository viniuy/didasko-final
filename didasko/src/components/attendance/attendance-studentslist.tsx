import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
import { Download, Search, ChevronLeft } from 'lucide-react';
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

interface Student {
  name: string;
  status: string;
  image?: string;
  date?: string;
  semester?: string;
}

const students: Student[] = [
  {
    name: 'Dimero, Lance',
    status: '',
    date: '2024-02-20',
    semester: '1st Semester',
  },
  {
    name: 'Dizon, Vincent',
    status: 'ABSENT',
    date: '2024-02-20',
    semester: '1st Semester',
  },
  {
    name: 'Esplana, Suzanne Alyanna',
    status: '',
    date: '2024-02-20',
    semester: '1st Semester',
  },
  {
    name: 'Gonzales, Ivan',
    status: '',
    date: '2024-02-20',
    semester: '1st Semester',
  },
  {
    name: 'Inso, John Lester',
    status: '',
    date: '2024-02-20',
    semester: '1st Semester',
  },
  {
    name: 'Lazatin, Julius',
    status: '',
    date: '2024-02-19',
    semester: '1st Semester',
  },
  {
    name: 'Lopez, Janrei Marcus',
    status: '',
    date: '2024-02-19',
    semester: '1st Semester',
  },
  {
    name: 'Loresca, Mica Ella',
    status: '',
    date: '2024-02-19',
    semester: '1st Semester',
  },
  {
    name: 'Magante, Keith Izam',
    status: '',
    date: '2024-02-19',
    semester: '1st Semester',
  },
  {
    name: 'Magdadaro, Jovial',
    status: '',
    date: '2024-02-19',
    semester: '1st Semester',
  },
];

interface FilterState {
  date: Date | undefined;
  status: string[];
}

export default function StudentList() {
  const [studentList, setStudentList] = useState<Student[]>(students);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate] = useState<'newest' | 'oldest' | ''>('');
  const [selectedSemester] = useState<'1st Semester' | '2nd Semester' | ''>('');
  const [imageToRemove, setImageToRemove] = useState<{
    index: number;
    name: string;
  } | null>(null);
  const itemsPerPage = 10;
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    date: undefined,
    status: [],
  });
  const [tempImage, setTempImage] = useState<{
    index: number;
    dataUrl: string;
  } | null>(null);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

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
      .filter((student) => {
        if (!selectedSemester) return true;
        return student.semester === selectedSemester;
      })
      .sort((a, b) => {
        if (!selectedDate) return 0;
        if (selectedDate === 'newest') {
          return (b.date || '').localeCompare(a.date || '');
        }
        return (a.date || '').localeCompare(b.date || '');
      });
  }, [
    studentList,
    searchQuery,
    selectedDate,
    selectedSemester,
    filters.status,
  ]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const updateStatus = (index: number, status: string) => {
    setStudentList((prevStudents) =>
      prevStudents.map((student, i) =>
        i === index ? { ...student, status } : student,
      ),
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
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image size should be less than 5MB');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          setTempImage({
            index: index,
            dataUrl: event.target?.result as string,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSaveChanges = (index: number) => {
    if (tempImage && tempImage.index === index) {
      setStudentList((prev) =>
        prev.map((student, idx) =>
          idx === index ? { ...student, image: tempImage.dataUrl } : student,
        ),
      );
      setTempImage(null);
      toast.success('Profile picture updated successfully');
    }
    const dialogTrigger = document.querySelector('[data-state="open"]');
    if (dialogTrigger instanceof HTMLElement) {
      dialogTrigger.click();
    }
  };

  const confirmAndRemoveImage = () => {
    if (!imageToRemove) return;

    setStudentList((prev) =>
      prev.map((student, idx) =>
        idx === imageToRemove.index
          ? { ...student, image: undefined }
          : student,
      ),
    );
    toast.success('Profile picture removed successfully');
    setImageToRemove(null);
  };

  const markAllAsPresent = () => {
    const previousState = [...studentList];
    setStudentList((prevStudents) =>
      prevStudents.map((student) => ({
        ...student,
        status: 'PRESENT',
      })),
    );
    toast.success('All students marked as present', {
      action: {
        label: 'Undo',
        onClick: () => {
          setStudentList(previousState);
          toast.success('Changes undone successfully');
        },
      },
    });
  };

  const handleApplyFilters = () => {
    if (filters.status.length > 0) {
      setFilters((prev) => ({
        ...prev,
        status: filters.status,
      }));
    }
    setIsFilterSheetOpen(false);
  };

  const handleExport = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      studentList.map((student) => ({
        Students: student.name,
        Status: student.status || 'NOT SET',
      })),
    );

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Students column
      { wch: 15 }, // Status column
    ];
    worksheet['!cols'] = columnWidths;
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(
      workbook,
      'Management Information Systems - Gradebook BSIT 111.xlsx',
    );
    setShowExportPreview(false);
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<{
          Students: string;
          Name: string;
          Status: string;
          Date: string;
          Semester: string;
        }>(worksheet);

        // Process the imported data
        const importedStudents = jsonData.map((row: any) => ({
          name: row['Students'] || row['Name'] || '',
          status: row['Status'] || '',
          date: row['Date'] || new Date().toISOString().split('T')[0],
          semester: row['Semester'] || '1st Semester',
        }));

        setStudentList(importedStudents);
        toast.success('Students imported successfully');
        setShowImportDialog(false);
      } catch {
        toast.error('Error importing file. Please check the file format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className='flex flex-col h-screen'>
      <div className='flex items-center gap-4 p-4 border-b bg-white'>
        <Button variant='ghost' size='icon' className='hover:bg-gray-100'>
          <ChevronLeft className='h-5 w-5' />
        </Button>
        <div className='flex items-center gap-2'>
          <div>
            <h1 className='text-[#124A69] font-bold text-xl'>MIS</h1>
            <p className='text-gray-500 text-sm'>BSIT 111</p>
          </div>
        </div>
        <div className='flex items-center gap-3 ml-6 flex-grow'>
          <div className='relative flex-grow max-w-[300px]'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              placeholder='Search a name'
              className='w-full pl-9 bg-white border-gray-200 rounded-full h-10'
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <Button
            className='bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full px-6 h-10'
            onClick={markAllAsPresent}
          >
            MARK ALL AS PRESENT
          </Button>
          <div className='flex items-center gap-2 ml-auto'>
            <FilterSheet
              isOpen={isFilterSheetOpen}
              onOpenChange={setIsFilterSheetOpen}
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={handleApplyFilters}
            />
            <Button
              className='bg-[#124A69] hover:bg-[#0D3A54] text-white rounded-full px-4 h-10 flex items-center gap-2'
              onClick={() => setShowExportPreview(true)}
            >
              <Download className='h-4 w-4' /> Export to Excel
            </Button>
            <Button
              className='bg-[#124A69] hover:bg-[#0D3A54] text-white rounded-full px-4 h-10 flex items-center gap-2'
              onClick={() => setShowImportDialog(true)}
            >
              <Download className='h-4 w-4' /> Import from Excel
            </Button>
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-auto bg-gray-50'>
        <div className='max-w-[1600px] mx-auto'>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6'>
              {currentStudents.map((student, index) => (
                <StudentCard
                  key={index}
                  student={student}
                  index={index}
                  tempImage={tempImage}
                  onImageUpload={handleImageUpload}
                  onSaveChanges={handleSaveChanges}
                  onRemoveImage={(index, name) =>
                    setImageToRemove({ index, name })
                  }
                  onStatusChange={updateStatus}
                />
              ))}
              {/* Add empty placeholder cards to maintain grid structure */}
              {currentStudents.length > 0 &&
                currentStudents.length < 5 &&
                [...Array(5 - currentStudents.length)].map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className='w-full min-w-[200px] bg-transparent'
                  ></div>
                ))}
            </div>

            <div className='flex justify-between items-center mt-6 px-2'>
              <p className='text-sm text-gray-500'>
                {filteredStudents.length > 0
                  ? `${
                      currentPage * itemsPerPage - (itemsPerPage - 1)
                    }-${Math.min(
                      currentPage * itemsPerPage,
                      filteredStudents.length,
                    )} out of ${filteredStudents.length} students`
                  : 'No students found'}
              </p>
              {filteredStudents.length > 0 && (
                <Pagination>
                  <PaginationContent>
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={currentPage === i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className='rounded-full'
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Dialog for Image Removal */}
      <AlertDialog
        open={!!imageToRemove}
        onOpenChange={() => setImageToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Picture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the profile picture for{' '}
              {imageToRemove?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAndRemoveImage}
              className='bg-red-500 hover:bg-red-600'
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Preview Dialog */}
      <Dialog open={showExportPreview} onOpenChange={setShowExportPreview}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader className='border-b pb-4'>
            <DialogTitle className='text-xl font-semibold'>
              Management Information Systems - Gradebook
            </DialogTitle>
            <DialogDescription className='text-sm text-gray-500'>
              BSIT 111
            </DialogDescription>
          </DialogHeader>

          <div className='py-4 max-h-[60vh] overflow-auto'>
            <div className='border rounded-lg overflow-hidden'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='sticky top-0 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900'>
                      Students
                    </th>
                    <th className='sticky top-0 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {studentList.map((student, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className='px-4 py-2 text-sm text-gray-900 whitespace-nowrap'>
                        {student.name}
                      </td>
                      <td className='px-4 py-2 text-sm'>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                          ${
                            student.status === 'PRESENT'
                              ? 'bg-[#EEFFF3] text-[#62BA7D]'
                              : student.status === 'LATE'
                              ? 'bg-[#FFF7E6] text-[#D4A017]'
                              : student.status === 'ABSENT'
                              ? 'bg-[#FFEFEF] text-[#BA6262]'
                              : student.status === 'EXCUSED'
                              ? 'bg-[#EEF2FF] text-[#8F9FDA]'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {student.status || 'NOT SET'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className='text-sm text-gray-500 mt-4'>
              {studentList.length} out of {studentList.length} students
            </div>
          </div>

          <div className='flex justify-between pt-4 border-t'>
            <Button
              variant='outline'
              onClick={() => setShowExportPreview(false)}
              className='rounded-lg'
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              className='bg-[#124A69] hover:bg-[#0D3A54] text-white rounded-lg'
            >
              Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className='max-w-[400px] p-6'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold text-[#124A69]'>
              Import Students from Excel
            </DialogTitle>
            <DialogDescription className='text-sm text-gray-500'>
              Upload an Excel file with student information
            </DialogDescription>
          </DialogHeader>

          <div className='py-4'>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
              <input
                type='file'
                accept='.xlsx, .xls'
                onChange={handleImportExcel}
                className='hidden'
                id='excel-import'
              />
              <label
                htmlFor='excel-import'
                className='cursor-pointer flex flex-col items-center gap-2'
              >
                <Download className='h-8 w-8 text-gray-400' />
                <span className='text-sm text-gray-600'>
                  Click to upload Excel file
                </span>
                <span className='text-xs text-gray-500'>
                  (.xlsx or .xls files only)
                </span>
              </label>
            </div>
          </div>

          <div className='flex justify-between pt-4 border-t'>
            <Button
              variant='outline'
              onClick={() => setShowImportDialog(false)}
              className='rounded-lg'
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
