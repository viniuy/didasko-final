import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/axios';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Search,
  Loader2,
  X,
  Upload,
  Camera,
  Filter,
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExportGrades } from '@/components/grading/grades-export';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  image?: string;
  status?: string;
  reportingScore?: number;
  recitationScore?: number;
  quizScore?: number;
  totalScore?: number;
  remarks?: string;
  grades?: {
    totalScore: number;
    reportingScore: boolean;
    recitationScore: boolean;
  }[];
}

interface GradebookTableProps {
  courseSlug: string;
  courseCode: string;
  courseSection: string;
}

interface GradeConfiguration {
  name: string;
  reportingWeight: number;
  recitationWeight: number;
  quizWeight: number;
  passingThreshold: number;
}

interface ExistingConfig extends GradeConfiguration {
  id: string;
  createdAt: string;
  isCurrent?: boolean;
  startDate?: string;
  endDate?: string;
}

interface Course {
  id: string;
  title: string;
  code: string;
  description: string | null;
  semester: string;
  section: string;
  slug: string;
  academicYear: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

const SearchBar = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className='relative'>
    <input
      type='text'
      placeholder='Search students...'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className='pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
    />
    <svg
      className='absolute left-2 top-2.5 h-5 w-5 text-gray-400'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
      />
    </svg>
  </div>
);

const StudentTable = ({
  students,
  onAddImage,
  onRemoveImage,
}: {
  students: Student[];
  onAddImage?: (student: Student) => void;
  onRemoveImage?: (student: Student) => void;
}) => {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleImageClick = (student: Student) => {
    setSelectedStudent(student);
    setShowImageDialog(true);
  };

  return (
    <>
      <table className='w-full border-separate border-spacing-0 table-fixed'>
        <thead>
          <tr className='bg-gray-100'>
            <th className='sticky left-0 z-10 bg-gray-100 px-4 py-2 border-b text-left font-semibold text-[#124A69] w-[300px]'>
              Students
            </th>
            <th className='px-4 py-2 border-b text-center font-semibold text-[#124A69] w-[120px]'>
              Reporting
            </th>
            <th className='px-4 py-2 border-b text-center font-semibold text-[#124A69] w-[120px]'>
              Recitation
            </th>
            <th className='px-4 py-2 border-b text-center font-semibold text-[#124A69] w-[120px]'>
              Quiz
            </th>
            <th className='px-4 py-2 border-b text-center font-semibold text-[#124A69] w-[120px]'>
              Total Grade
            </th>
            <th className='px-4 py-2 border-b text-center font-semibold text-[#124A69] w-[120px]'>
              Remarks
            </th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className='text-center py-8 text-muted-foreground'
              >
                No students found
              </td>
            </tr>
          ) : (
            students.map((student, idx) => (
              <tr
                key={student.id}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F6FA]'}
              >
                <td className='sticky left-0 z-10 bg-inherit px-4 py-2 align-middle w-[300px] border-b'>
                  <div className='flex items-center gap-3'>
                    <div className='relative group'>
                      <div
                        className='cursor-pointer'
                        onClick={() => handleImageClick(student)}
                      >
                        {student.image ? (
                          <img
                            src={student.image}
                            alt=''
                            className='w-8 h-8 rounded-full object-cover'
                          />
                        ) : (
                          <span className='inline-flex w-8 h-8 rounded-full bg-gray-200 text-gray-400 items-center justify-center'>
                            <svg
                              width='20'
                              height='20'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                            >
                              <circle cx='12' cy='8' r='4' />
                              <path d='M6 20c0-2.2 3.6-4 6-4s6 1.8 6 4' />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                    <span>{`${student.lastName}, ${student.firstName}${
                      student.middleInitial ? ` ${student.middleInitial}.` : ''
                    }`}</span>
                  </div>
                </td>
                <td className='text-center px-4 py-2 align-middle w-[120px] border-b'>
                  {student.reportingScore?.toFixed(2) ?? '--'}
                </td>
                <td className='text-center px-4 py-2 align-middle w-[120px] border-b'>
                  {student.recitationScore?.toFixed(2) ?? '--'}
                </td>
                <td className='text-center px-4 py-2 align-middle w-[120px] border-b'>
                  {student.quizScore?.toFixed(2) ?? '--'}
                </td>
                <td className='text-center px-4 py-2 align-middle w-[120px] border-b font-medium'>
                  {typeof student.totalScore === 'number'
                    ? `${student.totalScore.toFixed(2)}%`
                    : '--'}
                </td>
                <td className='text-center px-4 py-2 align-middle w-[120px] border-b'>
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      student.remarks === 'PASSED' &&
                        'bg-green-100 text-green-700',
                      student.remarks === 'FAILED' && 'bg-red-100 text-red-700',
                      !student.remarks && 'bg-gray-100 text-gray-700',
                    )}
                  >
                    {student.remarks || 'No Grade'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Image Preview Dialog */}
      <StudentProfileDialog
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        student={selectedStudent}
        onAddImage={onAddImage}
        onRemoveImage={onRemoveImage}
      />
    </>
  );
};

const PaginationFooter = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) => (
  <div className='flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-white'>
    <div className='flex flex-col sm:flex-row items-center gap-4 w-full'>
      <div className='flex items-center gap-2'>
        <p className='text-sm text-gray-500 whitespace-nowrap'>
          {totalItems > 0 ? (
            <>
              {currentPage * itemsPerPage - (itemsPerPage - 1)}-
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{' '}
              students
            </>
          ) : (
            'No students found'
          )}
        </p>
      </div>
      <div className='flex-1 flex justify-end'>
        <Pagination className='w-full flex justify-end'>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                className={
                  currentPage === 1
                    ? 'pointer-events-none opacity-50'
                    : 'hover:bg-gray-100'
                }
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => onPageChange(page)}
                  isActive={currentPage === page}
                  className='hover:bg-gray-100'
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  onPageChange(Math.min(currentPage + 1, totalPages))
                }
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'hover:bg-gray-100'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  </div>
);

const GradeConfigDialog = ({
  open,
  onOpenChange,
  courseSlug,
  onConfigSaved,
  setGradebookConfigDate,
  setHasSelectedConfig,
  onDateRangeChange,
  setCurrentConfig,
  fetchData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseSlug: string;
  onConfigSaved: () => void;
  setGradebookConfigDate: (date: string | null) => void;
  setHasSelectedConfig: (value: boolean) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  setCurrentConfig: (config: ExistingConfig | null) => void;
  fetchData: () => Promise<void>;
}) => {
  const { data: session } = useSession();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [config, setConfig] = useState<GradeConfiguration>({
    name: '',
    reportingWeight: 50,
    recitationWeight: 30,
    quizWeight: 20,
    passingThreshold: 75,
  });
  const [existingConfigs, setExistingConfigs] = useState<ExistingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [dateWarning, setDateWarning] = useState('');
  const [nameWarning, setNameWarning] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [dateTouched, setDateTouched] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);

  const resetForm = () => {
    setConfig({
      name: '',
      reportingWeight: 50,
      recitationWeight: 30,
      quizWeight: 20,
      passingThreshold: 75,
    });
    setDateRange(undefined);
    setDateWarning('');
    setNameWarning('');
    setNameTouched(false);
    setDateTouched(false);
    setSelectedConfig(null);
    setCurrentConfig(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  useEffect(() => {
    const fetchExistingConfigs = async () => {
      if (!courseSlug) return;
      setIsLoadingConfigs(true);
      try {
        const response = await axiosInstance.get(
          `/courses/${courseSlug}/grade-components`,
        );
        setExistingConfigs(response.data.configurations || []);
      } catch (error) {
        console.error('Error fetching existing configurations:', error);
        toast.error('Failed to load existing grade configurations');
      } finally {
        setIsLoadingConfigs(false);
      }
    };

    if (open) {
      fetchExistingConfigs();
    }
  }, [courseSlug, open]);

  useEffect(() => {
    if (dateTouched) {
      if (!dateRange?.from || !dateRange?.to) {
        setDateWarning('Please select a start and end date.');
      } else {
        setDateWarning('');
      }
    } else {
      setDateWarning('');
    }
    if (nameTouched) {
      if (!config.name.trim()) {
        setNameWarning('Gradebook name is required.');
      } else {
        setNameWarning('');
      }
    } else {
      setNameWarning('');
    }
  }, [dateRange, config.name, nameTouched, dateTouched]);

  const handleConfigChange = (
    field: keyof GradeConfiguration,
    value: string,
  ) => {
    if (field === 'name') {
      const sanitizedValue = value.replace(/[^a-zA-Z0-9\s\-_.,]/g, '');
      const truncatedValue = sanitizedValue.slice(0, 50);

      // Check if name already exists, excluding the current config if we're editing
      const isDuplicate = existingConfigs.some(
        (existingConfig) =>
          existingConfig.name.toLowerCase() === truncatedValue.toLowerCase() &&
          (!selectedConfig || existingConfig.id !== selectedConfig),
      );

      if (isDuplicate) {
        setNameWarning('A configuration with this name already exists');
      } else if (!truncatedValue.trim()) {
        setNameWarning('Gradebook name is required');
      } else {
        setNameWarning('');
      }

      setConfig((prev) => ({ ...prev, [field]: truncatedValue }));
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setConfig((prev) => ({ ...prev, [field]: numValue }));
      }
    }
  };

  const handleSaveConfig = async () => {
    if (!session) {
      console.log('No session found, cannot save configuration');
      return;
    }

    if (!config.name.trim()) {
      console.log('Gradebook name is empty');
      setNameWarning('Gradebook name is required');
      return;
    }

    // Check for duplicate name before saving
    const isDuplicate = existingConfigs.some(
      (existingConfig) =>
        existingConfig.name.toLowerCase() === config.name.toLowerCase() &&
        (!selectedConfig || existingConfig.id !== selectedConfig),
    );

    if (isDuplicate) {
      setNameWarning('A configuration with this name already exists');
      toast.error('A configuration with this name already exists');
      return;
    }

    const totalWeight =
      config.reportingWeight + config.recitationWeight + config.quizWeight;
    if (Math.abs(totalWeight - 100) > 0.01) {
      console.log('Total weights do not equal 100%:', totalWeight);
      toast.error('Total weights must equal 100%');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        `/courses/${courseSlug}/grade-components`,
        {
          components: {
            name: config.name,
            reportingWeight: config.reportingWeight,
            recitationWeight: config.recitationWeight,
            quizWeight: config.quizWeight,
            passingThreshold: config.passingThreshold,
            startDate: dateRange?.from
              ? dateRange.from.toISOString()
              : undefined,
            endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
          },
        },
      );

      // Set the new configuration as current
      const newConfig = response.data;
      setCurrentConfig(newConfig);
      setGradebookConfigDate(newConfig.createdAt);
      setHasSelectedConfig(true);

      // Update date range if provided
      if (dateRange?.from && dateRange?.to) {
        onDateRangeChange(dateRange);
      }

      // Fetch updated data
      await fetchData();

      toast.success('Grade configuration saved successfully');
      onConfigSaved();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving grade configuration:', error);
      toast.error('Failed to save grade configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseExistingConfig = async (configId: string) => {
    setIsLoading(true);
    try {
      // Find the selected configuration
      const selectedConfig = existingConfigs.find((c) => c.id === configId);

      if (!selectedConfig) {
        throw new Error('Configuration not found');
      }
      // Update the gradebook config date
      setGradebookConfigDate(selectedConfig.createdAt);

      // Set the selected configuration
      setSelectedConfig(configId);
    } catch (error) {
      toast.error('Failed to select configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySelectedConfig = () => {
    // Find the selected configuration
    const config = existingConfigs.find((c) => c.id === selectedConfig);

    if (!config) {
      toast.error('Configuration not found');
      return;
    }

    console.log('Applying selected config locally:', config);

    // Save locally using the prop
    setCurrentConfig(config);
    setGradebookConfigDate(config.createdAt);
    setHasSelectedConfig(true);

    if (config.startDate && config.endDate) {
      onDateRangeChange({
        from: new Date(config.startDate),
        to: new Date(config.endDate),
      });
    }

    console.log('Successfully applied configuration locally:', config);
    toast.success('Using selected configuration');
    onConfigSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-[550px] min-x-[550px] bg-white rounded-lg shadow-md p-0'>
        <DialogTitle className='text-lg font-bold text-[#124A69] leading-tight px-3 pt-6'>
          Configure Gradebook
        </DialogTitle>
        <div className='px-3'>
          <Tabs defaultValue='existing' className='w-full'>
            <TabsList className='grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg'>
              <TabsTrigger
                value='existing'
                className='data-[state=active]:bg-white data-[state=active]:shadow-sm'
              >
                Existing Gradebook
              </TabsTrigger>
              <TabsTrigger
                value='new'
                className='data-[state=active]:bg-white data-[state=active]:shadow-sm'
                onClick={() => {
                  setSelectedConfig(null);
                  resetForm();
                  setConfig({
                    name: '',
                    reportingWeight: 50,
                    recitationWeight: 30,
                    quizWeight: 20,
                    passingThreshold: 75,
                  });
                }}
              >
                Create New Gradebook
              </TabsTrigger>
            </TabsList>
            <div className='-mt-2'>
              <TabsContent value='existing'>
                <Card className='border-none shadow-none'>
                  <CardHeader className='px-0'>
                    <CardTitle className='text-lg font-semibold text-[#124A69]'>
                      Select Existing Gradebook
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='px-0'>
                    {isLoadingConfigs ? (
                      <div className='text-center py-8 text-gray-500 -mt-2'>
                        Loading configurations...
                      </div>
                    ) : existingConfigs.length === 0 ? (
                      <div className='text-center py-8 text-gray-500 -mt-2'>
                        No existing configurations found
                      </div>
                    ) : (
                      <div className='space-y-4 -mt-2'>
                        <Select
                          onValueChange={handleUseExistingConfig}
                          disabled={isLoading}
                        >
                          <SelectTrigger className='w-full '>
                            <SelectValue placeholder='Select a gradebook configuration' />
                          </SelectTrigger>
                          <SelectContent>
                            {existingConfigs.map((config) => (
                              <SelectItem key={config.id} value={config.id}>
                                <div className='flex flex-col items-start'>
                                  <span className='font-medium text-[#124A69]'>
                                    {config.name}
                                  </span>
                                  <span className='text-xs text-gray-500'>
                                    Created:{' '}
                                    {format(
                                      new Date(config.createdAt),
                                      'MMM d, yyyy',
                                    )}
                                    {config.startDate && config.endDate && (
                                      <>
                                        {' '}
                                        | Date Range:{' '}
                                        {format(
                                          new Date(config.startDate),
                                          'MMM d, yyyy',
                                        )}{' '}
                                        -{' '}
                                        {format(
                                          new Date(config.endDate),
                                          'MMM d, yyyy',
                                        )}
                                      </>
                                    )}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className='flex justify-end gap-3 pt-4 border-t'>
                          <Button
                            variant='outline'
                            onClick={() => onOpenChange(false)}
                            className='border-gray-300 hover:bg-gray-50'
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleApplySelectedConfig}
                            disabled={isLoading || !selectedConfig}
                            className='bg-[#124A69] hover:bg-[#0D3A56] text-white'
                          >
                            {isLoading
                              ? 'Applying...'
                              : 'Apply Selected Configuration'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value='new'>
                <Card className='border-none shadow-none'>
                  <CardHeader className='px-0'>
                    <CardTitle className='text-lg font-semibold text-[#124A69]'>
                      Create New Gradebook
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='px-0 space-y-4'>
                    <div className=' -mt-3'>
                      <Label
                        htmlFor='name'
                        className='text-sm font-medium text-gray-700'
                      >
                        Gradebook Name <span className='text-red-500'>*</span>
                      </Label>
                      <div className='relative'>
                        <Input
                          id='name'
                          type='text'
                          value={config.name}
                          onChange={(e) => {
                            setNameTouched(true);
                            handleConfigChange('name', e.target.value);
                          }}
                          placeholder='Enter gradebook name'
                          className='border-gray-300 focus:border-[#124A69] focus:ring-[#124A69]'
                          maxLength={20}
                        />
                        <div className='flex justify-between items-center mt-1 text-xs'>
                          {nameWarning && nameTouched ? (
                            <span className='text-red-500'>{nameWarning}</span>
                          ) : (
                            <span></span>
                          )}
                          <span className='text-gray-500'>
                            {config.name.length}/20
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-4 -mt-2'>
                      <div className='space-y-2'>
                        <Label
                          htmlFor='reporting'
                          className='text-sm font-medium text-gray-700'
                        >
                          Reporting Weight (%)
                        </Label>
                        <div className='flex items-center gap-2'>
                          <Slider
                            value={[config.reportingWeight]}
                            onValueChange={(value: number[]) =>
                              handleConfigChange(
                                'reportingWeight',
                                value[0].toString(),
                              )
                            }
                            max={100}
                            step={1}
                            className='w-[100px]'
                          />
                          <Input
                            id='reporting'
                            type='number'
                            value={config.reportingWeight}
                            onChange={(e) =>
                              handleConfigChange(
                                'reportingWeight',
                                e.target.value,
                              )
                            }
                            min='0'
                            max='100'
                            className='w-[60px] bg-gray-50 border-gray-200 h-9'
                          />
                          <span className='text-sm text-gray-500'>%</span>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <Label
                          htmlFor='recitation'
                          className='text-sm font-medium text-gray-700'
                        >
                          Recitation Weight (%)
                        </Label>
                        <div className='flex items-center gap-2'>
                          <Slider
                            value={[config.recitationWeight]}
                            onValueChange={(value: number[]) =>
                              handleConfigChange(
                                'recitationWeight',
                                value[0].toString(),
                              )
                            }
                            max={100}
                            step={1}
                            className='w-[100px]'
                          />
                          <Input
                            id='recitation'
                            type='number'
                            value={config.recitationWeight}
                            onChange={(e) =>
                              handleConfigChange(
                                'recitationWeight',
                                e.target.value,
                              )
                            }
                            min='0'
                            max='100'
                            className='w-[60px] bg-gray-50 border-gray-200 h-9'
                          />
                          <span className='text-sm text-gray-500'>%</span>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <Label
                          htmlFor='quiz'
                          className='text-sm font-medium text-gray-700'
                        >
                          Quiz Weight (%)
                        </Label>
                        <div className='flex items-center gap-2'>
                          <Slider
                            value={[config.quizWeight]}
                            onValueChange={(value: number[]) =>
                              handleConfigChange(
                                'quizWeight',
                                value[0].toString(),
                              )
                            }
                            max={100}
                            step={1}
                            className='w-[100px]'
                          />
                          <Input
                            id='quiz'
                            type='number'
                            value={config.quizWeight}
                            onChange={(e) =>
                              handleConfigChange('quizWeight', e.target.value)
                            }
                            min='0'
                            max='100'
                            className='w-[60px] bg-gray-50 border-gray-200 h-9'
                          />
                          <span className='text-sm text-gray-500'>%</span>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <Label
                          htmlFor='threshold'
                          className='text-sm font-medium text-gray-700'
                        >
                          Passing Threshold (%)
                        </Label>
                        <Select
                          value={config.passingThreshold.toString()}
                          onValueChange={(value) =>
                            handleConfigChange('passingThreshold', value)
                          }
                        >
                          <SelectTrigger className='w-[100px] bg-gray-50 border-gray-200 h-9'>
                            <SelectValue placeholder='Select passing threshold' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='60'>60%</SelectItem>
                            <SelectItem value='65'>65%</SelectItem>
                            <SelectItem value='70'>70%</SelectItem>
                            <SelectItem value='75'>75%</SelectItem>
                            <SelectItem value='80'>80%</SelectItem>
                            <SelectItem value='85'>85%</SelectItem>
                            <SelectItem value='90'>90%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className='flex justify-between items-center px-2 py-2 bg-gray-50 rounded-lg mt-2'>
                      <span className='text-sm font-medium text-gray-700'>
                        Total Weight:
                      </span>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          Math.abs(
                            config.reportingWeight +
                              config.recitationWeight +
                              config.quizWeight -
                              100,
                          ) <= 0.01
                            ? 'text-green-600'
                            : 'text-red-600',
                        )}
                      >
                        {(
                          config.reportingWeight +
                          config.recitationWeight +
                          config.quizWeight
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium text-gray-700'>
                        Date Range <span className='text-red-500'>*</span>
                      </Label>
                      <div className='flex w-full max-w-[440px] justify-center mx-auto bg-white  rounded-lg border border-gray-200'>
                        <Calendar
                          mode='range'
                          selected={dateRange}
                          onSelect={(range) => {
                            setDateTouched(true);
                            setDateRange(range);
                          }}
                          numberOfMonths={2}
                          className='rounded-md border-0 scale-90'
                          disabled={{ after: new Date() }}
                          classNames={{
                            day_selected:
                              'bg-[#124A69] text-white hover:bg-[#124A69] hover:text-white focus:bg-[#124A69] focus:text-white',
                            day_range_start:
                              'bg-[#124A69] text-white rounded-l-md',
                            day_range_end:
                              'bg-[#124A69] text-white rounded-r-md',
                            day_range_middle: 'bg-[#e3eef5] text-[#124A69]',
                            day_today:
                              'border border-[#124A69] text-[#124A69] bg-white',
                          }}
                        />
                      </div>
                      {dateWarning && dateTouched && (
                        <div className='text-xs text-red-500 mt-1'>
                          {dateWarning}
                        </div>
                      )}
                    </div>
                    <div className='flex justify-end gap-3 pt-4 border-t'>
                      <Button
                        variant='outline'
                        onClick={() => setDateRange(undefined)}
                        className='border-gray-300 hover:bg-gray-50'
                      >
                        Clear Date Range
                      </Button>
                      <Button
                        onClick={handleSaveConfig}
                        disabled={
                          isLoading ||
                          !!dateWarning ||
                          !!nameWarning ||
                          !nameTouched ||
                          !dateTouched ||
                          Math.abs(
                            config.reportingWeight +
                              config.recitationWeight +
                              config.quizWeight -
                              100,
                          ) > 0.01 ||
                          config.reportingWeight === 0 ||
                          config.recitationWeight === 0 ||
                          config.quizWeight === 0 ||
                          !config.name.trim()
                        }
                        className='bg-[#124A69] hover:bg-[#0D3A56] text-white'
                      >
                        {isLoading ? 'Saving...' : 'Save Gradebook'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EditGradeConfigDialog = ({
  open,
  onOpenChange,
  courseSlug,
  onConfigSaved,
  setGradebookConfigDate,
  setHasSelectedConfig,
  onDateRangeChange,
  currentConfig,
  setCurrentConfig,
  fetchData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseSlug: string;
  onConfigSaved: () => void;
  setGradebookConfigDate: (date: string | null) => void;
  setHasSelectedConfig: (value: boolean) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  currentConfig: ExistingConfig | null;
  setCurrentConfig: (config: ExistingConfig | null) => void;
  fetchData: () => Promise<void>;
}) => {
  const { data: session } = useSession();
  const [config, setConfig] = useState<GradeConfiguration>(() => {
    console.log('Initializing config state with:', currentConfig);
    return {
      name: currentConfig?.name || '',
      reportingWeight: currentConfig?.reportingWeight || 50,
      recitationWeight: currentConfig?.recitationWeight || 30,
      quizWeight: currentConfig?.quizWeight || 20,
      passingThreshold: currentConfig?.passingThreshold || 75,
    };
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    console.log(
      'Initializing dateRange with:',
      currentConfig?.startDate,
      currentConfig?.endDate,
    );
    if (currentConfig?.startDate && currentConfig?.endDate) {
      return {
        from: new Date(currentConfig.startDate),
        to: new Date(currentConfig.endDate),
      };
    }
    return undefined;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dateWarning, setDateWarning] = useState('');
  const [nameWarning, setNameWarning] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [dateTouched, setDateTouched] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when dialog opens or currentConfig changes
  useEffect(() => {
    if (open && currentConfig) {
      console.log('Dialog opened, updating form with config:', currentConfig);
      setConfig({
        name: currentConfig.name,
        reportingWeight: currentConfig.reportingWeight,
        recitationWeight: currentConfig.recitationWeight,
        quizWeight: currentConfig.quizWeight,
        passingThreshold: currentConfig.passingThreshold,
      });
      if (currentConfig.startDate && currentConfig.endDate) {
        setDateRange({
          from: new Date(currentConfig.startDate),
          to: new Date(currentConfig.endDate),
        });
      } else {
        setDateRange(undefined);
      }
      // Reset hasChanges when dialog opens with a new config
      setHasChanges(false);
    }
  }, [open, currentConfig]);

  // Validation effects
  useEffect(() => {
    // Check for date range validity
    if (dateTouched) {
      if (!dateRange?.from || !dateRange?.to) {
        setDateWarning('Please select a start and end date.');
      } else {
        setDateWarning('');
      }
    }

    // Check for changes compared to initial config
    const initialConfig = currentConfig;

    const initialDateRange =
      initialConfig?.startDate && initialConfig?.endDate
        ? {
            from: new Date(initialConfig.startDate).toISOString().split('T')[0],
            to: new Date(initialConfig.endDate).toISOString().split('T')[0],
          }
        : undefined;

    const currentDateRangeFormatted =
      dateRange?.from && dateRange?.to
        ? {
            from: dateRange.from.toISOString().split('T')[0],
            to: dateRange.to.toISOString().split('T')[0],
          }
        : undefined;

    const configChanged =
      initialConfig?.name !== config.name ||
      initialConfig?.reportingWeight !== config.reportingWeight ||
      initialConfig?.recitationWeight !== config.recitationWeight ||
      initialConfig?.quizWeight !== config.quizWeight ||
      initialConfig?.passingThreshold !== config.passingThreshold;

    const dateRangeChanged =
      JSON.stringify(initialDateRange) !==
      JSON.stringify(currentDateRangeFormatted);

    const changesDetected = configChanged || dateRangeChanged;
    setHasChanges(changesDetected);
  }, [dateRange, config, dateTouched, currentConfig]); // Added currentConfig to dependencies

  // Name validation effect
  useEffect(() => {
    if (nameTouched) {
      if (!config.name.trim()) {
        setNameWarning('Gradebook name is required.');
      } else {
        setNameWarning('');
      }
    }
  }, [config.name, nameTouched]);

  const handleConfigChange = (
    field: keyof GradeConfiguration,
    value: string,
  ) => {
    if (field === 'name') {
      const sanitizedValue = value.replace(/[^a-zA-Z0-9\s\-_.,]/g, '');
      const truncatedValue = sanitizedValue.slice(0, 50);

      if (!truncatedValue.trim()) {
        setNameWarning('Gradebook name is required');
      } else {
        setNameWarning('');
      }

      setConfig((prev) => ({
        ...prev,
        [field]: truncatedValue,
      }));
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setConfig((prev) => ({
          ...prev,
          [field]: numValue,
        }));
      }
    }
    // setHasChanges(true); // Set hasChanges when config changes
  };

  const handleSaveConfig = async () => {
    if (!session || !currentConfig) {
      console.log(
        'No session or current config found, cannot save configuration',
      );
      return;
    }

    if (!config.name.trim()) {
      console.log('Gradebook name is empty');
      setNameWarning('Gradebook name is required');
      return;
    }

    const totalWeight =
      config.reportingWeight + config.recitationWeight + config.quizWeight;
    if (Math.abs(totalWeight - 100) > 0.01) {
      console.log('Total weights do not equal 100%:', totalWeight);
      toast.error('Total weights must equal 100%');
      return;
    }

    // Show confirmation dialog
    setShowSaveConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (!session || !currentConfig) return;

    const loadingToast = toast.loading('Updating gradebook configuration...');
    setIsLoading(true);
    try {
      const response = await axiosInstance.put(
        `/courses/${courseSlug}/grade-components/${currentConfig.id}`,
        {
          components: {
            name: config.name,
            reportingWeight: config.reportingWeight,
            recitationWeight: config.recitationWeight,
            quizWeight: config.quizWeight,
            passingThreshold: config.passingThreshold,
            startDate: dateRange?.from
              ? dateRange.from.toISOString()
              : undefined,
            endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
          },
        },
      );

      const updatedConfig = response.data;
      setGradebookConfigDate(updatedConfig.createdAt);
      setCurrentConfig(updatedConfig); // Update parent state
      setHasSelectedConfig(true); // Ensure this is true after saving
      if (updatedConfig.startDate && updatedConfig.endDate) {
        onDateRangeChange({
          from: new Date(updatedConfig.startDate),
          to: new Date(updatedConfig.endDate),
        });
      } else {
        onDateRangeChange(undefined);
      }

      // Fetch updated data
      await fetchData();

      onConfigSaved(); // This might trigger data refresh in parent
      onOpenChange(false);
      // Keep isLoading true until dialog is fully closed or data reloaded in parent
      setShowSaveConfirmation(false);
      toast.dismiss(loadingToast);
      toast.success('Gradebook configuration updated successfully');
    } catch (error) {
      console.error('Error updating gradebook configuration:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to update gradebook configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to initial values if cancelled while editing
    if (currentConfig) {
      setConfig({
        name: currentConfig?.name || '',
        reportingWeight: currentConfig?.reportingWeight || 50,
        recitationWeight: currentConfig?.recitationWeight || 30,
        quizWeight: currentConfig?.quizWeight || 20,
        passingThreshold: currentConfig?.passingThreshold || 75,
      });
      if (currentConfig?.startDate && currentConfig?.endDate) {
        setDateRange({
          from: new Date(currentConfig.startDate),
          to: new Date(currentConfig.endDate),
        });
      } else {
        setDateRange(undefined);
      }
      setNameTouched(false);
      setDateTouched(false);
      setNameWarning('');
      setDateWarning('');
      setHasChanges(false); // Reset changes on cancel
    }
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className='max-w-[550px] min-x-[550px] bg-white rounded-lg shadow-md p-0'>
          <DialogTitle className='text-lg font-bold text-[#124A69] leading-tight px-3 pt-6'>
            Edit Gradebook Configuration
          </DialogTitle>
          <div className='px-3'>
            <Card className='border-none shadow-none'>
              <CardContent className='px-0 space-y-4'>
                <div className=' -mt-3'>
                  <Label
                    htmlFor='name'
                    className='text-sm font-medium text-gray-700'
                  >
                    Gradebook Name *
                  </Label>
                  <div className='relative'>
                    <Input
                      id='name'
                      type='text'
                      value={config.name}
                      onChange={(e) => {
                        setNameTouched(true);
                        handleConfigChange('name', e.target.value);
                      }}
                      placeholder='Enter gradebook name'
                      className='border-gray-300 focus:border-[#124A69] focus:ring-[#124A69]'
                      maxLength={20}
                    />
                    <div className='flex justify-between items-center mt-1 text-xs'>
                      {nameWarning && nameTouched ? (
                        <span className='text-red-500'>{nameWarning}</span>
                      ) : (
                        <span></span>
                      )}
                      <span className='text-gray-500'>
                        {config.name.length}/20
                      </span>
                    </div>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4 -mt-2'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='reporting'
                      className='text-sm font-medium text-gray-700'
                    >
                      Reporting Weight (%)
                    </Label>
                    <div className='flex items-center gap-2'>
                      <Slider
                        value={[config.reportingWeight]}
                        onValueChange={(value: number[]) =>
                          handleConfigChange(
                            'reportingWeight',
                            value[0].toString(),
                          )
                        }
                        max={100}
                        step={1}
                        className='w-[100px]'
                      />
                      <Input
                        id='reporting'
                        type='number'
                        value={config.reportingWeight}
                        onChange={(e) =>
                          handleConfigChange('reportingWeight', e.target.value)
                        }
                        min='0'
                        max='100'
                        className='w-[60px] bg-gray-50 border-gray-200 h-9'
                      />
                      <span className='text-sm text-gray-500'>%</span>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label
                      htmlFor='recitation'
                      className='text-sm font-medium text-gray-700'
                    >
                      Recitation Weight (%)
                    </Label>
                    <div className='flex items-center gap-2'>
                      <Slider
                        value={[config.recitationWeight]}
                        onValueChange={(value: number[]) =>
                          handleConfigChange(
                            'recitationWeight',
                            value[0].toString(),
                          )
                        }
                        max={100}
                        step={1}
                        className='w-[100px]'
                      />
                      <Input
                        id='recitation'
                        type='number'
                        value={config.recitationWeight}
                        onChange={(e) =>
                          handleConfigChange('recitationWeight', e.target.value)
                        }
                        min='0'
                        max='100'
                        className='w-[60px] bg-gray-50 border-gray-200 h-9'
                      />
                      <span className='text-sm text-gray-500'>%</span>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label
                      htmlFor='quiz'
                      className='text-sm font-medium text-gray-700'
                    >
                      Quiz Weight (%)
                    </Label>
                    <div className='flex items-center gap-2'>
                      <Slider
                        value={[config.quizWeight]}
                        onValueChange={(value: number[]) =>
                          handleConfigChange('quizWeight', value[0].toString())
                        }
                        max={100}
                        step={1}
                        className='w-[100px]'
                      />
                      <Input
                        id='quiz'
                        type='number'
                        value={config.quizWeight}
                        onChange={(e) =>
                          handleConfigChange('quizWeight', e.target.value)
                        }
                        min='0'
                        max='100'
                        className='w-[60px] bg-gray-50 border-gray-200 h-9'
                      />
                      <span className='text-sm text-gray-500'>%</span>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label
                      htmlFor='threshold'
                      className='text-sm font-medium text-gray-700'
                    >
                      Passing Threshold (%)
                    </Label>
                    <Select
                      value={config.passingThreshold.toString()}
                      onValueChange={(value) =>
                        handleConfigChange('passingThreshold', value)
                      }
                    >
                      <SelectTrigger className='w-[100px] bg-gray-50 border-gray-200 h-9'>
                        <SelectValue placeholder='Select passing threshold' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='60'>60%</SelectItem>
                        <SelectItem value='65'>65%</SelectItem>
                        <SelectItem value='70'>70%</SelectItem>
                        <SelectItem value='75'>75%</SelectItem>
                        <SelectItem value='80'>80%</SelectItem>
                        <SelectItem value='85'>85%</SelectItem>
                        <SelectItem value='90'>90%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='flex justify-between items-center px-2 py-2 bg-gray-50 rounded-lg mt-2'>
                  <span className='text-sm font-medium text-gray-700'>
                    Total Weight:
                  </span>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      Math.abs(
                        config.reportingWeight +
                          config.recitationWeight +
                          config.quizWeight -
                          100,
                      ) <= 0.01
                        ? 'text-green-600'
                        : 'text-red-600',
                    )}
                  >
                    {(
                      config.reportingWeight +
                      config.recitationWeight +
                      config.quizWeight
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-gray-700'>
                    Date Range*
                  </Label>
                  <div className='flex w-full max-w-[440px] justify-center mx-auto bg-white  rounded-lg border border-gray-200'>
                    <Calendar
                      mode='range'
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateTouched(true);
                        setDateRange(range);
                      }}
                      numberOfMonths={2}
                      className='rounded-md border-0 scale-90'
                      disabled={{ after: new Date() }}
                      classNames={{
                        day_selected:
                          'bg-[#124A69] text-white hover:bg-[#124A69] hover:text-white focus:bg-[#124A69] focus:text-white',
                        day_range_start: 'bg-[#124A69] text-white rounded-l-md',
                        day_range_end: 'bg-[#124A69] text-white rounded-r-md',
                        day_range_middle: 'bg-[#e3eef5] text-[#124A69]',
                        day_today:
                          'border border-[#124A69] text-[#124A69] bg-white',
                      }}
                    />
                  </div>
                  {dateWarning && dateTouched && (
                    <div className='text-xs text-red-500 mt-1'>
                      {dateWarning}
                    </div>
                  )}
                </div>
                <div className='flex justify-end gap-3 pt-4 border-t'>
                  <Button
                    variant='outline'
                    onClick={() => setDateRange(undefined)}
                    className='border-gray-300 hover:bg-gray-50'
                  >
                    Clear Date Range
                  </Button>
                  <Button
                    onClick={handleSaveConfig}
                    disabled={isLoading || !hasChanges}
                    className='bg-[#124A69] hover:bg-[#0D3A56] text-white'
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <Dialog
        open={showSaveConfirmation}
        onOpenChange={setShowSaveConfirmation}
      >
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogDescription>
              Are you sure you want to save these changes to the gradebook
              configuration?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowSaveConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              className='bg-[#124A69] hover:bg-[#0D3A56]'
              disabled={isLoading} // Disable save button while saving
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Add the new StudentProfileDialog component
const StudentProfileDialog = ({
  open,
  onOpenChange,
  student,
  onAddImage,
  onRemoveImage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onAddImage?: (student: Student) => void;
  onRemoveImage?: (student: Student) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToRemove, setImageToRemove] = useState<Student | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if the file is an image
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file', {
          style: {
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #e5e7eb',
            boxShadow:
              '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fff',
          },
        });
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Create a temporary URL for the image preview
      const dataUrl = URL.createObjectURL(file);
      setTempImage(dataUrl);

      // Call onAddImage with the file
      if (student && onAddImage) {
        try {
          await onAddImage(student);
          setTempImage(null);
          onOpenChange(false);
        } catch (error) {
          console.error('Error uploading image:', error);
          setTempImage(null);
        }
      }
    }
  };

  const handleRemoveImage = async () => {
    if (student && onRemoveImage) {
      try {
        await onRemoveImage(student);
        setImageToRemove(null);
        onOpenChange(false);
      } catch (error) {
        console.error('Error removing image:', error);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle className='text-[#124A69] text-xl font-bold'>
              {student?.firstName} {student?.lastName}'s Profile Picture
            </DialogTitle>
          </DialogHeader>
          <div className='flex flex-col items-center gap-4 py-4'>
            <div className='relative'>
              {tempImage ? (
                <img
                  src={tempImage}
                  alt={`${student?.firstName} ${student?.lastName}`}
                  className='w-48 h-48 rounded-full object-cover'
                />
              ) : student?.image ? (
                <img
                  src={student.image}
                  alt={`${student.firstName} ${student.lastName}`}
                  className='w-48 h-48 rounded-full object-cover'
                />
              ) : (
                <span className='inline-flex w-48 h-48 rounded-full bg-gray-200 text-gray-400 items-center justify-center'>
                  <svg
                    width='80'
                    height='80'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                  >
                    <circle cx='12' cy='8' r='4' />
                    <path d='M6 20c0-2.2 3.6-4 6-4s6 1.8 6 4' />
                  </svg>
                </span>
              )}
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
                className='flex items-center gap-2 bg-[#124A69] text-white hover:bg-[#0D3A54] hover:text-white border-none'
              >
                <Camera className='h-4 w-4' />
                {student?.image ? 'Change Picture' : 'Add Picture'}
              </Button>
              {student?.image && (
                <Button
                  variant='outline'
                  onClick={() => {
                    setImageToRemove(student);
                    onOpenChange(false);
                  }}
                  className='flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50'
                >
                  <X className='h-4 w-4' />
                  Remove Picture
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Image Confirmation Dialog */}
      <AlertDialog
        open={!!imageToRemove}
        onOpenChange={(open) => {
          if (!open) {
            setImageToRemove(null);
            setTimeout(() => {
              document.body.style.removeProperty('pointer-events');
            }, 300);
          }
        }}
      >
        <AlertDialogContent className='sm:max-w-[425px]'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-[#124A69] text-xl font-bold'>
              Remove Profile Picture
            </AlertDialogTitle>
            <AlertDialogDescription className='text-gray-500'>
              Are you sure you want to remove this profile picture? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='gap-2 sm:gap-2 mt-4'>
            <AlertDialogCancel className='border-gray-200'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveImage}
              className='bg-[#124A69] hover:bg-[#0D3A54] text-white'
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export function GradebookTable({
  courseSlug,
  courseCode,
  courseSection,
}: GradebookTableProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [courseInfo, setCourseInfo] = useState<Course | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfigDialog, setShowConfigDialog] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportData, setExportData] = useState<{
    header: string[][];
    studentRows: string[][];
  } | null>(null);
  const [gradeFilter, setGradeFilter] = useState({
    passed: false,
    failed: false,
  });
  const [gradebookConfigDate, setGradebookConfigDate] = useState<string | null>(
    null,
  );
  const [hasSelectedConfig, setHasSelectedConfig] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ExistingConfig | null>(
    null,
  );
  const [showEditConfigDialog, setShowEditConfigDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const itemsPerPage = 10;
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleImageClick = (student: Student) => {
    setSelectedStudent(student);
    setShowImageDialog(true);
  };

  const fetchData = useCallback(async () => {
    if (!courseSlug) {
      console.error('No courseSlug provided to GradebookTable');
      return;
    }
    console.log('Starting to fetch data for courseSlug:', courseSlug);
    console.log('Current date range:', dateRange);
    console.log('Current config before fetch:', currentConfig);
    setLoadingStudents(true);

    try {
      // Fetch all students in the course with their scores
      console.log('Fetching students from:', `/courses/${courseSlug}/students`);
      const studentsRes = await axiosInstance.get(
        `/courses/${courseSlug}/students`,
      );
      console.log('Students API Response:', studentsRes.data);

      if (!studentsRes.data?.students) {
        console.error('Invalid students data format:', studentsRes.data);
        throw new Error('Invalid students data format');
      }

      // Set course info
      setCourseInfo({
        id: studentsRes.data.course.id,
        code: studentsRes.data.course.code,
        title: studentsRes.data.course.title,
        description: studentsRes.data.course.description,
        semester: studentsRes.data.course.semester,
        section: studentsRes.data.course.section,
        slug: studentsRes.data.course.slug,
        academicYear: studentsRes.data.course.academicYear,
        status: studentsRes.data.course.status,
      });

      const studentsData = studentsRes.data.students;
      console.log('Initial students data:', studentsData);

      if (studentsData.length === 0) {
        console.log('No students found in the course');
        setStudents([]);
        return;
      }

      // Fetch grades for each student with date range
      console.log(
        'Starting to fetch grades for',
        studentsData.length,
        'students',
      );
      const studentsWithGrades = await Promise.all(
        studentsData.map(async (student: Student) => {
          try {
            console.log('Fetching grades for student:', student.id);
            const params: any = {};

            if (dateRange?.from) {
              const fromDate = new Date(dateRange.from);
              fromDate.setDate(fromDate.getDate() + 1);
              params.from = fromDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
            if (dateRange?.to) {
              const toDate = new Date(dateRange.to);
              toDate.setDate(toDate.getDate() + 1);
              params.to = toDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            }

            console.log('Grade fetch params:', params);

            // Only fetch grades if we have a date range and a current config
            if (dateRange?.from && dateRange?.to && currentConfig) {
              console.log('Fetching grades with params:', params);
              const gradesRes = await axiosInstance.get(
                `/courses/${courseSlug}/students/${student.id}/grades`,
                { params },
              );
              console.log(
                'Grades response for student',
                student.id,
                ':',
                gradesRes.data,
              );

              if (gradesRes.data) {
                // Ensure we're using the raw quiz score, not the total grade
                return {
                  ...student,
                  reportingScore: gradesRes.data.reportingScore,
                  recitationScore: gradesRes.data.recitationScore,
                  quizScore: gradesRes.data.quizScore,
                  totalScore: gradesRes.data.totalScore,
                  remarks: gradesRes.data.remarks,
                };
              }
            }
            // If no date range, no current config, or no grades found, return student without grades
            return {
              ...student,
              reportingScore: undefined,
              recitationScore: undefined,
              quizScore: undefined,
              totalScore: undefined,
              remarks: undefined,
            };
          } catch (error) {
            console.error(
              `Error fetching grades for student ${student.id}:`,
              error,
            );
            return {
              ...student,
              reportingScore: undefined,
              recitationScore: undefined,
              quizScore: undefined,
              totalScore: undefined,
              remarks: undefined,
            };
          }
        }),
      );

      console.log('Final students with grades:', studentsWithGrades);
      setStudents(studentsWithGrades);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Error fetching data:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
        params: err.config?.params,
        stack: err.stack,
      });

      let errorMessage = 'Failed to load students';
      if (err.response?.status === 404) {
        errorMessage = 'Course or students not found';
      } else if (err.response?.status === 401) {
        errorMessage = 'Please log in to view grades';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      toast.error(errorMessage);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [courseSlug, dateRange, currentConfig]);

  const handleFilterChange = (filter: keyof typeof gradeFilter) => {
    const newFilter = {
      ...gradeFilter,
      [filter]: !gradeFilter[filter],
    };

    // If all options are checked, set all to true
    if (Object.values(newFilter).every(Boolean)) {
      setGradeFilter({
        passed: true,
        failed: true,
      });
    } else {
      setGradeFilter(newFilter);
    }
  };

  // useEffect to load data when dependencies change
  useEffect(() => {
    if (courseSlug && dateRange?.from && dateRange?.to && currentConfig) {
      console.log(
        'useEffect dependency check: courseSlug, dateRange, and currentConfig are all set. Fetching data.',
      );
      fetchData();
    } else if (hasSelectedConfig) {
      console.log(
        'useEffect dependency check: hasSelectedConfig is true, but dateRange or currentConfig is missing.',
      );
      console.log('Current config:', currentConfig);
    } else {
      console.log(
        'useEffect dependency check: No config selected. Clearing everything.',
      );
      setStudents([]); // Only clear students if no config is selected
      setCurrentConfig(null); // Ensure currentConfig is null if no config is selected
      setHasSelectedConfig(false); // Ensure hasSelectedConfig is false if no config is selected
    }
  }, [courseSlug, dateRange, hasSelectedConfig, fetchData, currentConfig]);

  // Modify handleConfigSaved to handle both new and existing configurations
  const handleConfigSaved = () => {
    setHasSelectedConfig(true);
  };

  // Update the date range button to show the configuration's date range
  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return 'Pick a date range';
    if (!range.to) return format(range.from, 'MMM d, yyyy');
    return `${format(range.from, 'MMM d, yyyy')} - ${format(
      range.to,
      'MMM d, yyyy',
    )}`;
  };

  // Filter students by search and passed/failed
  const filteredStudents = students.filter((student) => {
    const name = `${student.lastName}, ${student.firstName}${
      student.middleInitial ? ` ${student.middleInitial}.` : ''
    }`.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    const matchesPassed = gradeFilter.passed && student.remarks === 'PASSED';
    const matchesFailed = gradeFilter.failed && student.remarks === 'FAILED';
    const noFilter = !gradeFilter.passed && !gradeFilter.failed;
    return matchesSearch && (noFilter || matchesPassed || matchesFailed);
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExport = async () => {
    try {
      // Get the latest grade configuration
      const gradeConfig = currentConfig;

      if (!gradeConfig) {
        toast.error(
          'No grade configuration found. Please configure the gradebook first.',
        );
        return;
      }

      if (!dateRange?.from || !dateRange?.to) {
        toast.error('Please select a date range first.');
        return;
      }

      // Create header rows
      const header = [
        [
          `${courseInfo?.code || courseCode} - ${
            courseInfo?.section || courseSection
          } GRADEBOOK`,
        ],
        [''],
        ['Gradebook:', gradeConfig.name],
        [
          'Date Range:',
          `${format(dateRange.from, 'MMMM d, yyyy')} - ${format(
            dateRange.to,
            'MMMM d, yyyy',
          )}`,
        ],
        [''],
        [
          'Student Name',
          'Reporting Score',
          'Recitation Score',
          'Quiz Score',
          'Total Grade',
          'Remarks',
        ],
      ];

      // Create student data rows
      const studentRows = students.map((student) => [
        `${student.lastName}, ${student.firstName}${
          student.middleInitial ? ` ${student.middleInitial}.` : ''
        }`,
        student.reportingScore?.toFixed(2) || '--',
        student.recitationScore?.toFixed(2) || '--',
        student.quizScore?.toFixed(2) || '--',
        typeof student.totalScore === 'number'
          ? `${student.totalScore.toFixed(2)}%`
          : '--',
        student.remarks || 'No Grade',
      ]);

      setExportData({ header, studentRows });
      setShowExportPreview(true);
    } catch (error) {
      console.error('Error preparing export data:', error);
      toast.error('Failed to prepare export data');
    }
  };

  // Update handleEditConfigClick to include more logging
  const handleEditConfigClick = () => {
    console.log('Edit Config clicked');
    console.log('Current config state:', currentConfig);
    console.log('Has selected config:', hasSelectedConfig);
    if (!hasSelectedConfig) {
      toast.error('No configuration selected');
      return;
    }
    console.log('Opening edit dialog with config:', currentConfig);
    setShowEditConfigDialog(true);
  };

  const handleRemoveImage = async (student: Student) => {
    try {
      // Call the API to remove the image
      await axiosInstance.delete(
        `/courses/${courseSlug}/students/${student.id}/image`,
      );

      // Update the student's image in the local state
      setStudents((prevStudents) =>
        prevStudents.map((s) =>
          s.id === student.id ? { ...s, image: undefined } : s,
        ),
      );
      toast.success('Profile picture removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove profile picture');
      throw error;
    }
  };

  const handleAddImage = async (student: Student) => {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';

      fileInput.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        // Create FormData
        const formData = new FormData();
        formData.append('image', file);

        // Upload the image
        const response = await axiosInstance.post(
          `/courses/${courseSlug}/students/${student.id}/image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        if (response.data) {
          // Update the student's image in the local state
          setStudents((prevStudents) =>
            prevStudents.map((s) =>
              s.id === student.id ? { ...s, image: response.data.imageUrl } : s,
            ),
          );
          toast.success('Profile picture updated successfully');
        }
      };

      fileInput.click();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload profile picture');
      throw error;
    }
  };

  return (
    <div>
      <div className='bg-white rounded-lg shadow-md'>
        {/* Card Header */}
        <div className='flex items-center gap-2 px-6 py-3 border-b'>
          <Button
            variant='ghost'
            className='h-9 w-9 p-0 hover:bg-gray-100'
            onClick={() => window.history.back()}
          >
            <svg
              className='h-5 w-5 text-gray-500'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <path d='M15 18l-6-6 6-6' />
            </svg>
          </Button>
          <div className='flex flex-col mr-4'>
            <span className='text-lg font-bold text-[#124A69] leading-tight'>
              {courseCode}
            </span>
            <span className='text-sm text-gray-500'>{courseSection}</span>
          </div>
          <div className='flex-1 flex items-center gap-2'>
            {/* Header Controls */}
            <div className='flex items-center gap-4'>
              <div className='relative'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-gray-500' />
                <Input
                  placeholder='Search students...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-8 w-[200px]'
                  disabled={!hasSelectedConfig}
                />
                {searchQuery && (
                  <button
                    type='button'
                    onClick={() => setSearchQuery('')}
                    className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                    tabIndex={-1}
                  >
                    &#10005;
                  </button>
                )}
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                className='rounded-full relative flex items-center gap-2 px-3 bg-white text-[#124A69] hover:bg-gray-100 border border-gray-200'
                onClick={() => setIsFilterOpen(true)}
              >
                <Filter className='h-4 w-4' />
                <span>Filter</span>
                {(gradeFilter.passed || gradeFilter.failed) && (
                  <span className='absolute -top-1 -right-1 bg-[#124A69] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                    {Number(gradeFilter.passed) + Number(gradeFilter.failed)}
                  </span>
                )}
              </Button>
            </div>
          </div>
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              className={cn(
                'w-[280px] justify-start text-left font-normal',
                !dateRange && 'text-muted-foreground',
              )}
              disabled={!hasSelectedConfig}
            >
              <CalendarIcon className='mr-2 h-4 w-3' />
              {dateRange?.from && dateRange?.to
                ? `${format(
                    new Date(dateRange.from),
                    'MMM d, yyyy',
                  )} - ${format(new Date(dateRange.to), 'MMM d, yyyy')}`
                : 'Select Date Range'}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  onClick={() => setShowConfigDialog(true)}
                  className='ml-2 h-9 px-4 bg-[#124A69] text-white rounded shadow flex items-center'
                >
                  Configure Gradebook
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[200px] p-4'>
                <div className='space-y-2'>
                  <h4 className='font-medium text-sm text-[#124A69]'>
                    Gradebook Configuration
                  </h4>
                  <p className='text-sm text-gray-500'>
                    {gradebookConfigDate
                      ? `Last configured: ${format(
                          new Date(gradebookConfigDate),
                          'MMM d, yyyy',
                        )}`
                      : 'No configuration found'}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Table Content */}
        {!hasSelectedConfig ? (
          <div className='p-8 text-center text-gray-500'>
            <p>
              Please configure the gradebook first to view students and grades.
            </p>
          </div>
        ) : loadingStudents ? (
          <div className='p-4 text-center text-gray-500'>
            <div className='flex flex-col items-center gap-2'>
              <Loader2 className='h-8 w-8 animate-spin text-[#124A69]' />
              <p className='text-gray-500'>Loading students...</p>
            </div>
          </div>
        ) : (
          <StudentTable
            students={paginatedStudents}
            onAddImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
          />
        )}

        {/* Pagination Footer */}
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-white'>
          <div className='flex flex-col sm:flex-row items-center gap-4 w-full'>
            <div className='flex items-center gap-2'>
              <p className='text-sm text-gray-500 whitespace-nowrap'>
                {filteredStudents.length > 0 ? (
                  <>
                    {currentPage * itemsPerPage - (itemsPerPage - 1)}-
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredStudents.length,
                    )}{' '}
                    of {filteredStudents.length} students
                  </>
                ) : (
                  'No students found'
                )}
              </p>
            </div>
            <div className='flex-1 flex justify-end'>
              <Pagination className='w-full flex justify-end'>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className={
                        currentPage === 1
                          ? 'pointer-events-none opacity-50'
                          : 'hover:bg-gray-100'
                      }
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`${
                          currentPage === i + 1
                            ? 'bg-[#124A69] text-white hover:bg-[#0d3a56]'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'hover:bg-gray-100'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>

        {/* Grade Configuration Dialog */}
        <GradeConfigDialog
          open={showConfigDialog}
          onOpenChange={setShowConfigDialog}
          courseSlug={courseSlug}
          onConfigSaved={handleConfigSaved}
          setGradebookConfigDate={setGradebookConfigDate}
          setHasSelectedConfig={setHasSelectedConfig}
          onDateRangeChange={setDateRange}
          setCurrentConfig={setCurrentConfig}
          fetchData={fetchData}
        />

        {/* Export Preview Dialog */}
        <ExportGrades
          showExportPreview={showExportPreview}
          setShowExportPreview={setShowExportPreview}
          exportData={exportData}
          courseCode={courseInfo?.code || courseCode}
          courseSection={courseInfo?.section || courseSection}
          gradebookName={currentConfig?.name || ''}
        />
      </div>
      <div className='flex justify-between mt-3'>
        <div className='flex items-center text-sm text-gray-500'>
          Gradebook:{' '}
          <span className='font-medium text-[#124A69] ml-1'>
            {currentConfig?.name}
          </span>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleExport}
            disabled={students.length === 0 || loadingStudents}
            className={cn(
              'h-9 px-4 border-gray-200 text-gray-600 hover:bg-gray-50',
              (students.length === 0 || loadingStudents) &&
                'opacity-50 cursor-not-allowed',
            )}
          >
            Export to Excel
          </Button>
          <Button
            variant='outline'
            onClick={handleEditConfigClick}
            disabled={!hasSelectedConfig}
            className={cn(
              'h-9 px-4 border-gray-200 text-gray-600 hover:bg-gray-50',
              !hasSelectedConfig && 'opacity-50 cursor-not-allowed',
            )}
          >
            Edit Configuration
          </Button>
        </div>
      </div>

      {/* Edit Grade Configuration Dialog */}
      <EditGradeConfigDialog
        open={showEditConfigDialog}
        onOpenChange={setShowEditConfigDialog}
        courseSlug={courseSlug}
        onConfigSaved={handleConfigSaved}
        setGradebookConfigDate={setGradebookConfigDate}
        setHasSelectedConfig={setHasSelectedConfig}
        onDateRangeChange={setDateRange}
        currentConfig={currentConfig}
        setCurrentConfig={setCurrentConfig}
        fetchData={fetchData}
      />

      {/* Replace the old dialog with the new component */}
      <StudentProfileDialog
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        student={selectedStudent}
        onAddImage={handleAddImage}
        onRemoveImage={handleRemoveImage}
      />

      {/* Filter and Search Bar */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-4'>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetContent side='right' className='w-[340px] sm:w-[400px] p-0'>
              <div className='p-6 border-b'>
                <SheetHeader>
                  <SheetTitle className='text-xl font-semibold'>
                    Filter Options
                  </SheetTitle>
                </SheetHeader>
              </div>
              <div className='p-6 space-y-6'>
                <div className='space-y-4'>
                  <label className='text-sm font-medium text-gray-700'>
                    Remarks
                  </label>
                  <div className='space-y-3 border rounded-lg p-4 bg-white'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={gradeFilter.passed}
                        onChange={() =>
                          setGradeFilter((prev) => ({
                            ...prev,
                            passed: !prev.passed,
                          }))
                        }
                        className='rounded border-gray-300 text-[#124A69] focus:ring-[#124A69]'
                      />
                      <span className='text-sm text-gray-700'>Passed</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={gradeFilter.failed}
                        onChange={() =>
                          setGradeFilter((prev) => ({
                            ...prev,
                            failed: !prev.failed,
                          }))
                        }
                        className='rounded border-gray-300 text-[#124A69] focus:ring-[#124A69]'
                      />
                      <span className='text-sm text-gray-700'>Failed</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-4 p-6 border-t mt-auto'>
                <Button
                  variant='outline'
                  className='flex-1 rounded-lg'
                  onClick={() => {
                    setGradeFilter({ passed: false, failed: false });
                    setIsFilterOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  className='flex-1 rounded-lg bg-[#124A69] hover:bg-[#0D3A54] text-white'
                  onClick={() => setIsFilterOpen(false)}
                >
                  Apply
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
