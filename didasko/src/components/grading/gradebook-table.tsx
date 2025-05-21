import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/axios';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Loader2 } from 'lucide-react';
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
  courseId: string;
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

const StudentTable = ({ students }: { students: Student[] }) => (
  <div className='overflow-x-auto'>
    <table className='min-w-full border text-center'>
      <thead>
        <tr className='bg-gray-100'>
          <th className='sticky left-0 z-10 bg-white px-4 py-2 border'>
            Student
          </th>
          <th className='px-2 py-1 border'>Reporting</th>
          <th className='px-2 py-1 border'>Recitation</th>
          <th className='px-2 py-1 border'>Quiz</th>
          <th className='px-2 py-1 border'>Total Grade</th>
          <th className='px-2 py-1 border'>Remarks</th>
        </tr>
      </thead>
      <tbody>
        {students.map((s, idx) => (
          <tr
            key={s.id}
            className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F6FA]'}
          >
            <td className='sticky left-0 z-10 bg-white px-4 py-2 align-middle w-[300px]'>
              <div className='flex items-center gap-3'>
                {s.image && (
                  <img
                    src={s.image}
                    alt=''
                    className='w-8 h-8 rounded-full object-cover'
                  />
                )}
                <span>{`${s.lastName}, ${s.firstName}${
                  s.middleInitial ? ` ${s.middleInitial}.` : ''
                }`}</span>
              </div>
            </td>
            <td className='px-2 py-1 border'>
              {s.reportingScore?.toFixed(2) ?? '--'}
            </td>
            <td className='px-2 py-1 border'>
              {s.recitationScore?.toFixed(2) ?? '--'}
            </td>
            <td className='px-2 py-1 border'>
              {s.quizScore?.toFixed(2) ?? '--'}
            </td>
            <td className='px-2 py-1 border'>
              {typeof s.totalScore === 'number' ? `${s.totalScore.toFixed(2)}%` : '--'}
            </td>
            <td
              className={cn(
                'px-2 py-1 border',
                s.remarks === 'FAILED' && 'bg-red-50 text-red-600 font-bold',
                s.remarks === 'PASSED' &&
                  'bg-green-50 text-green-700 font-bold',
                !s.remarks && 'bg-gray-100 text-gray-500',
              )}
            >
              {s.remarks}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

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
  courseId,
  onConfigSaved,
  setGradebookConfigDate,
  setHasSelectedConfig,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  onConfigSaved: () => void;
  setGradebookConfigDate: (date: string | null) => void;
  setHasSelectedConfig: (value: boolean) => void;
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

  useEffect(() => {
    const fetchExistingConfigs = async () => {
      if (!courseId) return;
      setIsLoadingConfigs(true);
      try {
        const response = await axiosInstance.get(
          `/courses/${courseId}/grade-components`,
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
  }, [courseId, open]);

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
      toast.error('Please enter a name for the gradebook');
      return;
    }

    const totalWeight =
      config.reportingWeight + config.recitationWeight + config.quizWeight;
    if (Math.abs(totalWeight - 100) > 0.01) {
      console.log('Total weights do not equal 100%:', totalWeight);
      toast.error('Total weights must equal 100%');
      return;
    }

    console.log('Saving grade configuration:', {
      name: config.name,
      reportingWeight: config.reportingWeight,
      recitationWeight: config.recitationWeight,
      quizWeight: config.quizWeight,
      passingThreshold: config.passingThreshold,
      dateRange,
    });

    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        `/courses/${courseId}/grade-components`,
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
            courseId,
          },
        },
      );
      console.log('Grade configuration saved successfully:', response.data);
      toast.success('Grade configuration saved successfully');
      onConfigSaved();
      onOpenChange(false);
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
      const selectedConfig = existingConfigs.find(c => c.id === configId);
      
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

  const handleApplySelectedConfig = async () => {
    setIsLoading(true);
    try {
      // Find the selected configuration
      const config = existingConfigs.find(c => c.id === selectedConfig);
      
      if (!config) {
        throw new Error('Configuration not found');
      }

      // Set this configuration as current
      const response = await axiosInstance.put(
        `/courses/${courseId}/grade-components/${config.id}/current`
      );

      console.log('Successfully applied configuration:', config);
      toast.success('Using existing grade configuration');
      setHasSelectedConfig(true);
      onConfigSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error applying configuration:', error);
      toast.error('Failed to apply configuration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                                    {format(new Date(config.createdAt), 'PPP')}{' '}
                                    | Reporting: {config.reportingWeight}% |
                                    Recitation: {config.recitationWeight}% |
                                    Quiz: {config.quizWeight}% | Passing:{' '}
                                    {config.passingThreshold}%
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
                            {isLoading ? 'Applying...' : 'Apply Selected Configuration'}
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
                        Gradebook Name
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
                          className=' border-gray-300 focus:border-[#124A69] focus:ring-[#124A69]'
                          maxLength={20}
                        />
                        <div className='flex justify-end mt-1  text-xs text-gray-500'>
                          {config.name.length}/20
                        </div>
                      </div>
                      {nameWarning && nameTouched && (
                        <div className='text-xs text-red-500 mt-1'>
                          {nameWarning}
                        </div>
                      )}
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
                        <div className='flex items-center gap-2'>
                          <Slider
                            value={[config.passingThreshold]}
                            onValueChange={(value: number[]) =>
                              handleConfigChange(
                                'passingThreshold',
                                value[0].toString(),
                              )
                            }
                            max={100}
                            step={1}
                            className='w-[100px]'
                          />
                          <Input
                            id='threshold'
                            type='number'
                            value={config.passingThreshold}
                            onChange={(e) =>
                              handleConfigChange(
                                'passingThreshold',
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
                          (!nameTouched && !dateTouched)
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

export function GradebookTable({
  courseId,
  courseCode,
  courseSection,
}: GradebookTableProps) {
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfigDialog, setShowConfigDialog] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportData, setExportData] = useState<{
    header: string[][];
    studentRows: string[][];
  } | null>(null);
  const [gradeFilter, setGradeFilter] = useState({
    passed: true,
    failed: true,
    noGrades: true,
  });
  const [gradebookConfigDate, setGradebookConfigDate] = useState<string | null>(null);
  const [hasSelectedConfig, setHasSelectedConfig] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    if (!courseId) {
      console.error('No courseId provided to GradebookTable');
      return;
    }
    console.log('Starting to fetch data for courseId:', courseId);
    setLoadingStudents(true);

    try {
      // Fetch all students in the course with their scores
      console.log('Fetching students from:', `/courses/${courseId}/students`);
      const studentsRes = await axiosInstance.get(
        `/courses/${courseId}/students`
      );
      console.log('Students API Response:', studentsRes.data);

      if (!studentsRes.data?.students) {
        console.error('Invalid students data format:', studentsRes.data);
        throw new Error('Invalid students data format');
      }
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
              params.startDate = dateRange.from.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
            if (dateRange?.to) {
              params.endDate = dateRange.to.toISOString().split('T')[0]; // YYYY-MM-DD format
            }

            console.log('Fetching grades with params:', params);
            const gradesRes = await axiosInstance.get(
              `/courses/${courseId}/students/${student.id}/grades`,
              { params }
            );
            console.log(
              'Grades response for student',
              student.id,
              ':',
              gradesRes.data,
            );

            if (gradesRes.data) {
              return {
                ...student,
                reportingScore: gradesRes.data.reportingScore,
                recitationScore: gradesRes.data.recitationScore,
                quizScore: gradesRes.data.quizScore,
                totalScore: gradesRes.data.totalScore,
                remarks: gradesRes.data.remarks,
              };
            }
            return student;
          } catch (error) {
            console.error(
              `Error fetching grades for student ${student.id}:`,
              error,
            );
            return student;
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
  }, [courseId, dateRange]);

  const handleFilterChange = (filter: keyof typeof gradeFilter) => {
    setGradeFilter((prev) => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  };

  // Add useEffect to check for existing current configuration on mount
  useEffect(() => {
    const fetchGradebookConfig = async () => {
      try {
        const response = await axiosInstance.get(
          `/courses/${courseId}/grade-components`
        );
        
        // Find the current configuration
        const currentConfig = response.data.configurations?.find(
          (config: ExistingConfig) => config.isCurrent
        );

        if (currentConfig) {
          setGradebookConfigDate(currentConfig.createdAt);
          setHasSelectedConfig(true);
          fetchData();
        } else {
          setHasSelectedConfig(false);
          setShowConfigDialog(true);
        }
      } catch (error) {
        console.error('Error checking current configuration:', error);
        setHasSelectedConfig(false);
        setShowConfigDialog(true);
      }
    };

    if (courseId) {
      fetchGradebookConfig();
    }
  }, [courseId, fetchData]);

  // Modify the date picker button to show selected date range
  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return 'Pick a date range';
    if (!range.to) return format(range.from, 'MMM d, yyyy');
    return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
  };

  // Modify handleConfigSaved to handle both new and existing configurations
  const handleConfigSaved = () => {
    setHasSelectedConfig(true);
    fetchData();
  };

  // Initial data fetch
  useEffect(() => {
    if (!showConfigDialog && hasSelectedConfig) {
      fetchData();
    }
  }, [fetchData, showConfigDialog, hasSelectedConfig]);

  const filteredStudents = students.filter((student) => {
    const name = `${student.lastName || ''} ${student.firstName || ''} ${
      student.middleInitial || ''
    }`.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    const matchesFilter =
      (gradeFilter.passed && student.remarks === 'PASSED') ||
      (gradeFilter.failed && student.remarks === 'FAILED') ||
      (gradeFilter.noGrades && !student.remarks);
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExport = async () => {
    try {
      // Get the latest grade configuration
      const configResponse = await axiosInstance.get(
        `/courses/${courseId}/grade-components/current`,
      );
      const gradeConfig = configResponse.data;

      if (!gradeConfig) {
        toast.error(
          'No grade configuration found. Please configure the gradebook first.',
        );
        return;
      }

      // Create header rows
      const header = [
        [`${courseCode} - ${courseSection} GRADEBOOK`],
        [''],
        ['Date:', format(new Date(gradeConfig.createdAt), 'MMMM d, yyyy')],
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
        typeof student.totalScore === 'number' ? `${student.totalScore.toFixed(2)}%` : '--',
        student.remarks || 'No Grade',
      ]);

      setExportData({ header, studentRows });
      setShowExportPreview(true);
    } catch (error) {
      console.error('Error preparing export data:', error);
      toast.error('Failed to prepare export data');
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
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-[140px] h-9 rounded-full border-gray-200 bg-[#F5F6FA] justify-between'
                    disabled={!hasSelectedConfig}
                  >
                    <span>Filter</span>
                    <svg
                      className='h-4 w-4 text-gray-500'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                    >
                      <path d='M19 9l-7 7-7-7' />
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[200px] p-4'>
                  <div className='space-y-3'>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='passed'
                        checked={gradeFilter.passed}
                        onCheckedChange={() => handleFilterChange('passed')}
                        disabled={!hasSelectedConfig}
                      />
                      <label
                        htmlFor='passed'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        Passed
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='failed'
                        checked={gradeFilter.failed}
                        onCheckedChange={() => handleFilterChange('failed')}
                        disabled={!hasSelectedConfig}
                      />    
                      <label
                        htmlFor='failed'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        Failed
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='noGrades'
                        checked={gradeFilter.noGrades}
                        onCheckedChange={() => handleFilterChange('noGrades')}
                        disabled={!hasSelectedConfig}
                      />
                      <label
                        htmlFor='noGrades'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        No Grades
                      </label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
              <CalendarIcon className='mr-2 h-4 w-4' />
              {formatDateRange(dateRange)}
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
                  <h4 className='font-medium text-sm text-[#124A69]'>Gradebook Configuration</h4>
                  <p className='text-sm text-gray-500'>
                    {gradebookConfigDate 
                      ? `Last configured: ${format(new Date(gradebookConfigDate), 'MMM d, yyyy')}`
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
            <p>Please configure the gradebook first to view students and grades.</p>
          </div>
        ) : loadingStudents ? (
          <div className='p-4 text-center text-gray-500'>
            <div className='flex flex-col items-center gap-2'>
              <Loader2 className='h-8 w-8 animate-spin text-[#124A69]' />
              <p className='text-gray-500'>Loading students...</p>
            </div>
          </div>
        ) : (
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
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='text-center py-8 text-muted-foreground'
                    >
                      No students found
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student, idx) => (
                    <tr
                      key={student.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F6FA]'}
                    >
                      <td className='sticky left-0 z-10 bg-inherit px-4 py-2 align-middle w-[300px] border-b'>
                        <div className='flex items-center gap-3'>
                          {student.image ? (
                            <img
                              src={student.image}
                              alt=''
                              className='w-8 h-8 rounded-full object-cover'
                            />
                          ) : (
                            <div className='w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500'>
                              {student.firstName?.[0]}
                              {student.lastName?.[0]}
                            </div>
                          )}
                          <span className='font-medium text-gray-900'>
                            {`${student.lastName}, ${student.firstName}${
                              student.middleInitial
                                ? ` ${student.middleInitial}.`
                                : ''
                            }`}
                          </span>
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
                        {typeof student.totalScore === 'number' ? `${student.totalScore.toFixed(2)}%` : '--'}
                      </td>
                      <td className='text-center px-4 py-2 align-middle w-[120px] border-b'>
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            student.remarks === 'PASSED' &&
                              'bg-green-100 text-green-700',
                            student.remarks === 'FAILED' &&
                              'bg-red-100 text-red-700',
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
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
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
          </>
        )}

        {/* Grade Configuration Dialog */}
        <GradeConfigDialog
          open={showConfigDialog}
          onOpenChange={setShowConfigDialog}
          courseId={courseId}
          onConfigSaved={handleConfigSaved}
          setGradebookConfigDate={setGradebookConfigDate}
          setHasSelectedConfig={setHasSelectedConfig}
        />

        {/* Export Preview Dialog */}
        <ExportGrades
          showExportPreview={showExportPreview}
          setShowExportPreview={setShowExportPreview}
          exportData={exportData}
          courseCode={courseCode}
          courseSection={courseSection}
        />
      </div>
      <div className='flex justify-end mt-3 gap-2'>
        <Button
          variant='outline'
          onClick={handleExport}
          disabled={students.length === 0 || loadingStudents}
          className={cn(
            'h-9 px-4 border-gray-200 text-gray-600 hover:bg-gray-50',
            (students.length === 0 || loadingStudents) && 'opacity-50 cursor-not-allowed'
          )}
        >
          Export to Excel
        </Button>
        <Button
          onClick={async () => {
            try {
              // Get the latest grade configuration
              const configResponse = await axiosInstance.get(
                `/courses/${courseId}/grade-components/current`,
              );
              const gradeConfig = configResponse.data;

              if (!gradeConfig) {
                toast.error(
                  'No grade configuration found. Please configure the gradebook first.',
                );
                return;
              }

              // Calculate total scores for each student
              const gradesToSave = students.map((student) => ({
                studentId: student.id,
                reportingScore: student.reportingScore || 0,
                recitationScore: student.recitationScore || 0,
                quizScore: student.quizScore || 0,
              }));

              // Save grades for all students
              await Promise.all(
                gradesToSave.map((grade) =>
                  axiosInstance.post(
                    `/courses/${courseId}/students/${grade.studentId}/grades`,
                    {
                      reportingScore: grade.reportingScore,
                      recitationScore: grade.recitationScore,
                      quizScore: grade.quizScore,
                    },
                  ),
                ),
              );

              setHasUnsavedChanges(false);
              toast.success('Grades saved successfully');
            } catch (error) {
              console.error('Error saving grades:', error);
              toast.error('Failed to save grades');
            }
          }}
          disabled={students.length === 0 || loadingStudents || !hasUnsavedChanges}
          className={cn(
            'ml-2 h-9 px-4 bg-[#124A69] text-white rounded shadow flex items-center',
            (students.length === 0 || loadingStudents || !hasUnsavedChanges) && 'opacity-50 cursor-not-allowed'
          )}
        >
          Save Grades
        </Button>
      </div>
    </div>
  );
}
