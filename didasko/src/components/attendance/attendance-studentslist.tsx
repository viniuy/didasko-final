import { useState, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Download, Search, ChevronLeft, Camera, X, CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import * as XLSX from 'xlsx';

interface Student {
  name: string;
  status: string;
  image?: string;
  date?: string;
  semester?: string;
}

const students: Student[] = [
  { name: 'Dimero, Lance', status: '', date: '2024-02-20', semester: '1st Semester' },
  { name: 'Dizon, Vincent', status: 'ABSENT', date: '2024-02-20', semester: '1st Semester' },
  { name: 'Esplana, Suzanne Alyanna', status: '', date: '2024-02-20', semester: '1st Semester' },
  { name: 'Gonzales, Ivan', status: '', date: '2024-02-20', semester: '1st Semester' },
  { name: 'Inso, John Lester', status: '', date: '2024-02-20', semester: '1st Semester' },
  { name: 'Lazatin, Julius', status: '', date: '2024-02-19', semester: '1st Semester' },
  { name: 'Lopez, Janrei Marcus', status: '', date: '2024-02-19', semester: '1st Semester' },
  { name: 'Loresca, Mica Ella', status: '', date: '2024-02-19', semester: '1st Semester' },
  { name: 'Magante, Keith Izam', status: '', date: '2024-02-19', semester: '1st Semester' },
  { name: 'Magdadaro, Jovial', status: '', date: '2024-02-19', semester: '1st Semester' }
];

const statusStyles: Record<string, string> = {
  LATE: 'bg-[#FFF7E6] text-[#D4A017] border-[#D4A017]',
  ABSENT: 'bg-[#FFEFEF] text-[#BA6262] border-[#BA6262]',
  PRESENT: 'bg-[#EEFFF3] text-[#62BA7D] border-[#62BA7D]',
  EXCUSED: 'bg-[#EEF2FF] text-[#8F9FDA] border-[#8F9FDA]',
  DEFAULT: 'bg-white text-gray-500 border-gray-200'
};

interface FilterState {
  date: Date | undefined;
  status: string[];
}

export default function StudentList() {
  const [studentList, setStudentList] = useState<Student[]>(students);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<'newest' | 'oldest' | ''>('');
  const [selectedSemester, setSelectedSemester] = useState<'1st Semester' | '2nd Semester' | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [imageToRemove, setImageToRemove] = useState<{ index: number; name: string } | null>(null);
  const [imageToSave, setImageToSave] = useState<{ index: number; file: File; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;
  const [selectedFilterDate, setSelectedFilterDate] = useState<Date>();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    date: undefined,
    status: []
  });
  const [tempImage, setTempImage] = useState<{ index: number; dataUrl: string } | null>(null);
  const [showExportPreview, setShowExportPreview] = useState(false);

  // Filter students based on all filters
  const filteredStudents = useMemo(() => {
    return studentList
      .filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter(student => {
        if (filters.status.length === 0) return true;
        return filters.status.includes(student.status);
      })
      .filter(student => {
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
  }, [studentList, searchQuery, selectedDate, selectedSemester, filters.status]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleDateFilter = (value: 'newest' | 'oldest') => {
    setSelectedDate(value);
    setCurrentPage(1);
  };

  const handleSemesterFilter = (value: '1st Semester' | '2nd Semester') => {
    setSelectedSemester(prev => prev === value ? '' : value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED') => {
    setSelectedStatus(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    setCurrentPage(1);
  };

  const updateStatus = (index: number, status: string) => {
    setStudentList(prevStudents =>
      prevStudents.map((student, i) =>
        i === index ? { ...student, status } : student
      )
    );
  };

  const currentStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper function to get status display name
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'Present';
      case 'LATE': return 'Late';
      case 'ABSENT': return 'Absent';
      case 'EXCUSED': return 'Excused';
      default: return 'Status';
    }
  };

  const handleImageUpload = (studentIndex: number, studentName: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast.error('Image size should be less than 5MB');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          setTempImage({ 
            index: studentIndex, 
            dataUrl: event.target?.result as string 
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSaveChanges = (index: number) => {
    if (tempImage && tempImage.index === index) {
      setStudentList(prev => prev.map((student, idx) => 
        idx === index 
          ? { ...student, image: tempImage.dataUrl }
          : student
      ));
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
    
    setStudentList(prev => prev.map((student, idx) => 
      idx === imageToRemove.index 
        ? { ...student, image: undefined }
        : student
    ));
    toast.success('Profile picture removed successfully');
    setImageToRemove(null);
  };

  const markAllAsPresent = () => {
    const previousState = [...studentList];
    setStudentList(prevStudents =>
      prevStudents.map(student => ({
        ...student,
        status: 'PRESENT'
      }))
    );
    toast.success('All students marked as present', {
      action: {
        label: "Undo",
        onClick: () => {
          setStudentList(previousState);
          toast.success('Changes undone successfully');
        }
      }
    });
  };

  const handleApplyFilters = () => {
    if (filters.status.length > 0) {
      setSelectedStatus(filters.status);
    }
    setIsFilterSheetOpen(false);
  };

  const handleExport = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      studentList.map(student => ({
        'Students': student.name,
        'Status': student.status || 'NOT SET'
      }))
    );

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Students column
      { wch: 15 }, // Status column
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'Management Information Systems - Gradebook BSIT 111.xlsx');
    setShowExportPreview(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-4 p-4 border-b bg-white">
        <Button variant="ghost" size="icon" className="hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-[#124A69] font-bold text-xl">MIS</h1>
            <p className="text-gray-500 text-sm">BSIT 111</p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-6 flex-grow">
          <div className="relative flex-grow max-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search a name" 
              className="w-full pl-9 bg-white border-gray-200 rounded-full h-10" 
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <Button 
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full px-6 h-10"
            onClick={markAllAsPresent}
          >
            MARK ALL AS PRESENT
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <div className="flex items-center gap-2">
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border border-gray-300 rounded-full px-3 h-8 flex items-center gap-1.5 hover:bg-gray-50 shadow-sm text-sm"
                  >
                    Add filter
                    <span className="text-base font-normal">+</span>
                  </Button>
                </SheetTrigger>

                {/* Active Filters */}
                {(filters.date || filters.status.length > 0) && (
                  <div className="flex items-center gap-1.5">
                    {filters.date && (
                      <div className="inline-flex items-center gap-1 px-3 h-8 bg-[#124A69] text-white rounded-full text-xs font-medium">
                        {format(filters.date, "MMM dd, yyyy")}
                        <button
                          onClick={() => {
                            setFilters(prev => ({ ...prev, date: undefined }));
                            setSelectedDate('');
                          }}
                          className="hover:bg-[#0D3A54] rounded-full"
                        >
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    )}
                    {filters.status.map((status) => (
                      <div 
                        key={status} 
                        className="inline-flex items-center gap-1 px-3 h-8 bg-[#124A69] text-white rounded-full text-xs font-medium"
                      >
                        {getStatusDisplay(status)}
                        <button
                          onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              status: prev.status.filter(s => s !== status)
                            }));
                            setSelectedStatus(prev => prev.filter(s => s !== status));
                          }}
                          className="hover:bg-[#0D3A54] rounded-full"
                        >
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
                <div className="p-6 border-b">
                  <SheetHeader>
                    <SheetTitle className="text-xl font-semibold">Add filter</SheetTitle>
                  </SheetHeader>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Date Filter */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${!filters.date && "text-muted-foreground"}`}
                        >
                          {filters.date ? (
                            format(filters.date, "MMMM dd, yyyy (EEEE)")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.date}
                          onSelect={(date) => setFilters(prev => ({ ...prev, date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Attendance Status Filter */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">Attendance Status</label>
                    <div className="space-y-3 border rounded-lg p-4">
                      {['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].map((status) => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status)}
                            onChange={(e) => {
                              setFilters(prev => ({
                                ...prev,
                                status: e.target.checked
                                  ? [...prev.status, status]
                                  : prev.status.filter(s => s !== status)
                              }));
                            }}
                            className="rounded border-gray-300 text-[#124A69] focus:ring-[#124A69]"
                          />
                          <span className="text-sm">{getStatusDisplay(status)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-6 border-t mt-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-lg"
                    onClick={() => {
                      setFilters({ date: undefined, status: [] });
                      setIsFilterSheetOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 rounded-lg bg-[#124A69] hover:bg-[#0D3A54]"
                    onClick={handleApplyFilters}
                  >
                    Apply
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Button 
              className="bg-[#124A69] hover:bg-[#0D3A54] text-white rounded-full px-4 h-10 flex items-center gap-2"
              onClick={() => setShowExportPreview(true)}
            >
              <Download className="h-4 w-4" /> Export to Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-[1600px] mx-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {currentStudents.map((student, index) => (
                <div key={index} className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex flex-col items-center gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="relative group cursor-pointer">
                          {student.image || (tempImage?.index === index && tempImage.dataUrl) ? (
                            <div className="relative">
                              <img 
                                src={tempImage?.index === index ? tempImage.dataUrl : student.image} 
                                alt={student.name} 
                                className="w-16 h-16 rounded-full object-cover group-hover:opacity-80 transition-opacity" 
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white w-8 h-8" />
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors"
                            >
                              <Camera className="text-gray-400 w-6 h-6" />
                            </div>
                          )}
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-[400px] p-6">
                        <DialogHeader>
                          <DialogTitle className="text-xl text-center font-semibold text-[#124A69]">Edit profile</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-6 py-6">
                          <div className="relative">
                            <div 
                              className="relative group cursor-pointer"
                              onClick={() => handleImageUpload(index, student.name)}
                            >
                              {student.image || (tempImage?.index === index && tempImage.dataUrl) ? (
                                <div className="relative">
                                  <img 
                                    src={tempImage?.index === index ? tempImage.dataUrl : student.image} 
                                    alt={student.name} 
                                    className="w-32 h-32 rounded-full object-cover" 
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white w-8 h-8" />
                                  </div>
                                  {(student.image || tempImage?.index === index) && (
                                    <button
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setImageToRemove({ index, name: student.name });
                                      }}
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                                  <Camera className="text-gray-400 w-8 h-8" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-2">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-lg"
                            onClick={() => {
                              setTempImage(null);
                              const dialogTrigger = document.querySelector('[data-state="open"]');
                              if (dialogTrigger instanceof HTMLElement) {
                                dialogTrigger.click();
                              }
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="flex-1 rounded-lg bg-[#124A69] hover:bg-[#0D3A54] text-white"
                            onClick={() => handleSaveChanges(index)}
                          >
                            Save changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <h3 className="text-sm font-medium text-gray-900 w-full truncate text-center" title={student.name}>
                      {student.name}
                    </h3>
                    <div className="w-full">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`w-full rounded-full px-4 py-1.5 text-sm font-medium border ${statusStyles[student.status] || statusStyles.DEFAULT}`}
                          >
                            {student.status || 'Select status'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                          <DropdownMenuItem onClick={() => updateStatus(index, 'PRESENT')}>Present</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(index, 'LATE')}>Late</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(index, 'ABSENT')}>Absent</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(index, 'EXCUSED')}>Excused</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
              {/* Add empty placeholder cards to maintain grid structure */}
              {currentStudents.length > 0 && currentStudents.length < 5 && (
                [...Array(5 - currentStudents.length)].map((_, index) => (
                  <div key={`placeholder-${index}`} className="w-full min-w-[200px] bg-transparent"></div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center mt-6 px-2">
              <p className="text-sm text-gray-500">
                {filteredStudents.length > 0 
                  ? `${currentPage * itemsPerPage - (itemsPerPage - 1)}-${Math.min(currentPage * itemsPerPage, filteredStudents.length)} out of ${filteredStudents.length} students`
                  : 'No students found'
                }
              </p>
              {filteredStudents.length > 0 && (
                <Pagination>
                  <PaginationContent>
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          isActive={currentPage === i + 1} 
                          onClick={() => setCurrentPage(i + 1)}
                          className="rounded-full"
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
      <AlertDialog open={!!imageToRemove} onOpenChange={() => setImageToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Picture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the profile picture for {imageToRemove?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAndRemoveImage}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Preview Dialog */}
      <Dialog open={showExportPreview} onOpenChange={setShowExportPreview}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold">
              Management Information Systems - Gradebook
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              BSIT 111
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 max-h-[60vh] overflow-auto">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky top-0 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900">Students</th>
                    <th className="sticky top-0 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {studentList.map((student, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{student.name}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                          ${student.status === 'PRESENT' ? 'bg-[#EEFFF3] text-[#62BA7D]' :
                            student.status === 'LATE' ? 'bg-[#FFF7E6] text-[#D4A017]' :
                            student.status === 'ABSENT' ? 'bg-[#FFEFEF] text-[#BA6262]' :
                            student.status === 'EXCUSED' ? 'bg-[#EEF2FF] text-[#8F9FDA]' :
                            'bg-gray-100 text-gray-600'}`}>
                          {student.status || 'NOT SET'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-sm text-gray-500 mt-4">
              {studentList.length} out of {studentList.length} students
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowExportPreview(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              className="bg-[#124A69] hover:bg-[#0D3A54] text-white rounded-lg"
            >
              Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}