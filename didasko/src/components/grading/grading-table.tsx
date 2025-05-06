import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import axiosInstance from '@/lib/axios';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  image?: string;
  status?: string;
  attendanceRecords?: any[];
}

interface GradingTableProps {
  courseId: string;
  searchQuery: string;
  selectedDate: Date | undefined;
  onDateSelect?: (date: Date | undefined) => void;
}

interface GradingCriteria {
  id: string;
  name: string;
  courseId: string;
  userId: string;
  rubrics: number;
  scoringRange: number;
  passingScore: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name: string;
  };
}

interface RubricDetail {
  name: string;
  percentage: number;
}

interface GradingScore {
  studentId: string;
  scores: number[];
  total: number;
}

export function GradingTable({
  courseId,
  searchQuery,
  selectedDate,
  onDateSelect,
}: GradingTableProps) {
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [showCriteriaDialog, setShowCriteriaDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedCriteria, setSavedCriteria] = useState<GradingCriteria[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<string>('');
  const [activeCriteria, setActiveCriteria] = useState<GradingCriteria | null>(
    null,
  );
  const [scores, setScores] = useState<Record<string, GradingScore>>({});
  const [rubricDetails, setRubricDetails] = useState<RubricDetail[]>([]);
  const [newCriteria, setNewCriteria] = useState({
    name: '',
    rubrics: '2',
    scoringRange: '5',
    passingScore: '75',
    rubricDetails: [
      { name: '', weight: 50 },
      { name: '', weight: 50 },
    ],
  });

  // Set today's date as default when component mounts
  useEffect(() => {
    if (!selectedDate) {
      onDateSelect?.(new Date());
    }
  }, []);

  // Function to handle dialog close
  const handleDialogClose = () => {
    setShowCriteriaDialog(false);
    // Clear the selected date if no criteria was selected
    if (!activeCriteria) {
      // Using the onDateSelect prop to clear the date in the parent component
      onDateSelect?.(undefined);
    }
  };

  // Fetch grades when both date and criteria are available
  useEffect(() => {
    const fetchGrades = async () => {
      if (!selectedDate || !activeCriteria) {
        console.log('Missing required data:', {
          selectedDate: selectedDate?.toISOString(),
          activeCriteria: activeCriteria?.id,
        });
        return;
      }

      try {
        setIsLoading(true);
        const formattedDate = selectedDate.toISOString().split('T')[0];
        console.log('Fetching grades for:', {
          courseId,
          date: formattedDate,
          criteriaId: activeCriteria.id,
        });

        const response = await axiosInstance.get(
          `/courses/${courseId}/grades`,
          {
            params: {
              date: formattedDate,
              criteriaId: activeCriteria.id,
            },
          },
        );

        const existingGrades = response.data;
        console.log('Received grades:', existingGrades);

        if (existingGrades && existingGrades.length > 0) {
          const gradesMap: Record<string, GradingScore> = {};
          existingGrades.forEach((grade: any) => {
            console.log('Processing grade:', grade);
            gradesMap[grade.studentId] = {
              studentId: grade.studentId,
              scores: grade.scores,
              total: grade.total,
            };
          });
          setScores(gradesMap);
          console.log('Updated scores state:', gradesMap);
        } else {
          console.log('No grades found for this date and criteria');
          setScores({});
        }
      } catch (error) {
        console.error('Error fetching grades:', error);
        toast.error('Failed to fetch existing grades');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, [selectedDate, activeCriteria, courseId]);

  // Check for existing criteria when date is selected
  useEffect(() => {
    const checkExistingCriteria = async () => {
      if (!selectedDate || activeCriteria) {
        return;
      }

      try {
        setIsLoading(true);
        const formattedDate = selectedDate.toISOString().split('T')[0];
        console.log('Checking for existing criteria on:', formattedDate);

        // First, get all grades for this date
        const response = await axiosInstance.get(
          `/courses/${courseId}/grades`,
          {
            params: {
              date: formattedDate,
            },
          },
        );

        const existingGrades = response.data;
        console.log('Found existing grades:', existingGrades);

        if (existingGrades && existingGrades.length > 0) {
          // Get the criteria ID from the first grade
          const criteriaId = existingGrades[0].criteriaId;
          console.log('Found existing criteria ID:', criteriaId);

          // Find the matching criteria from savedCriteria
          const matchingCriteria = savedCriteria.find(
            (criteria) => criteria.id === criteriaId,
          );

          if (matchingCriteria) {
            console.log('Setting active criteria:', matchingCriteria);
            setActiveCriteria(matchingCriteria);
            setSelectedCriteria(criteriaId);
            // Create placeholders for rubrics with default names and evenly distributed percentages
            const defaultRubrics = Array(matchingCriteria.rubrics)
              .fill(null)
              .map((_, i) => {
                let defaultName = '';
                switch (i) {
                  case 0:
                    defaultName = 'Content';
                    break;
                  case 1:
                    defaultName = 'Organization';
                    break;
                  case 2:
                    defaultName = 'Delivery';
                    break;
                  case 3:
                    defaultName = 'Creativity';
                    break;
                  default:
                    defaultName = `Rubric ${i + 1}`;
                }
                return {
                  name: defaultName,
                  percentage: Math.floor(100 / matchingCriteria.rubrics),
                };
              });
            setRubricDetails(defaultRubrics);
          }
        }
      } catch (error) {
        console.error('Error checking for existing criteria:', error);
        toast.error('Failed to check for existing criteria');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingCriteria();
  }, [selectedDate, activeCriteria, courseId, savedCriteria]);

  // Show criteria dialog when date is selected but no criteria is active
  useEffect(() => {
    if (selectedDate && !activeCriteria && !showCriteriaDialog) {
      console.log('Date selected but no criteria - showing dialog');
      setShowCriteriaDialog(true);
    }
  }, [selectedDate, activeCriteria, showCriteriaDialog]);

  // Fetch saved criteria on mount
  useEffect(() => {
    const fetchCriteria = async () => {
      if (!session?.user?.id) {
        console.error('No user ID found in session');
        return;
      }

      try {
        const response = await axiosInstance.get(
          `/courses/${courseId}/criteria`,
        );
        setSavedCriteria(response.data);
      } catch (error: any) {
        console.error('Error fetching criteria:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        toast.error(
          error.response?.data?.error || 'Failed to load saved criteria',
        );
      }
    };

    if (session?.user?.id) {
      fetchCriteria();
    }
  }, [courseId, session?.user?.id]);

  // Fetch students when component mounts
  useEffect(() => {
    const fetchStudents = async () => {
      if (!courseId) {
        console.log('No course ID provided');
        setStudents([]);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axiosInstance.get(
          `/courses/${courseId}/students`,
        );

        if (!response.data) {
          console.log('No data received from API');
          setStudents([]);
          return;
        }

        if (response.data.error) {
          console.error('API returned an error:', response.data.error);
          toast.error(response.data.error);
          setStudents([]);
          return;
        }

        if (response.data.students) {
          // Transform the student data to match our interface
          const transformedStudents = response.data.students.map(
            (student: any) => ({
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
              middleInitial: student.middleInitial,
              image: student.image,
              status: student.status,
              attendanceRecords: student.attendanceRecords,
            }),
          );
          setStudents(transformedStudents);
        } else {
          console.log('No students found in course');
          setStudents([]);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to fetch students');
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [courseId]);

  const handleSaveGrades = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const response = await axiosInstance.post(`/courses/${courseId}/grades`, {
        date: selectedDate,
        criteriaId: activeCriteria?.id,
        grades: Object.values(scores).map((score) => ({
          studentId: score.studentId,
          scores: score.scores,
          total: score.total,
        })),
      });

      const created = response.data;
      setScores({});
      toast.success('Grades saved successfully');
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Failed to save grades');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCriteria = () => {
    if (selectedCriteria) {
      const selected = savedCriteria.find((c) => c.id === selectedCriteria);
      if (selected) {
        setActiveCriteria(selected);
        // Create placeholders for rubrics with default names and evenly distributed percentages
        const defaultRubrics = Array(selected.rubrics)
          .fill(null)
          .map((_, i) => {
            let defaultName = '';
            switch (i) {
              case 0:
                defaultName = 'Content';
                break;
              case 1:
                defaultName = 'Organization';
                break;
              case 2:
                defaultName = 'Delivery';
                break;
              case 3:
                defaultName = 'Creativity';
                break;
              default:
                defaultName = `Rubric ${i + 1}`;
            }
            return {
              name: defaultName,
              percentage: Math.floor(100 / selected.rubrics),
            };
          });
        setRubricDetails(defaultRubrics);
      }
    }
    setShowCriteriaDialog(false);
  };

  const handleScoreChange = (
    studentId: string,
    rubricIndex: number,
    value: number,
  ) => {
    setScores((prev) => {
      const rubricCount = activeCriteria?.rubrics || 0;
      const studentScores =
        prev[studentId]?.scores || new Array(rubricCount).fill(0);
      const newScores = [...studentScores];
      newScores[rubricIndex] = value;

      return {
        ...prev,
        [studentId]: {
          studentId,
          scores: newScores,
          total: calculateTotal(newScores),
        },
      };
    });
  };

  const calculateTotal = (scores: number[]): number => {
    if (!rubricDetails.length) return 0;
    return scores.reduce((sum, score, index) => {
      const percentage = rubricDetails[index]?.percentage || 0;
      return sum + (score * percentage) / 100;
    }, 0);
  };

  const handleCreateCriteria = async () => {
    console.log('Button clicked!');
    console.log('Current state:', {
      name: newCriteria.name,
      isLoading,
      rubricNames: newCriteria.rubricDetails.map((r) => r.name),
      totalWeight: newCriteria.rubricDetails.reduce(
        (sum, r) => sum + r.weight,
        0,
      ),
      session: session?.user?.id,
    });

    if (!session?.user?.id) {
      console.log('No session user ID');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.post(
        `/courses/${courseId}/criteria`,
        {
          name: newCriteria.name,
          rubrics: JSON.stringify(newCriteria.rubricDetails),
          scoringRange: newCriteria.scoringRange,
          passingScore: newCriteria.passingScore,
          userId: session.user.id,
        },
      );

      const created = response.data;
      setSavedCriteria((prev) => [created, ...prev]);
      setSelectedCriteria(created.id);
      setActiveCriteria(created);
      setShowCriteriaDialog(false);
      toast.success('Criteria created successfully');
    } catch (error) {
      console.error('Error creating criteria:', error);
      toast.error('Failed to create criteria');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRubricCountChange = (value: string) => {
    const count = parseInt(value);
    const defaultWeight = Math.floor(100 / count);
    const newRubricDetails = Array(count)
      .fill(null)
      .map(() => ({
        name: '',
        weight: defaultWeight,
      }));
    setNewCriteria((prev) => ({
      ...prev,
      rubrics: value,
      rubricDetails: newRubricDetails,
    }));
  };

  const updateRubricDetail = (
    index: number,
    field: 'name' | 'weight',
    value: string | number,
  ) => {
    setNewCriteria((prev) => {
      const newDetails = [...prev.rubricDetails];
      newDetails[index] = {
        ...newDetails[index],
        [field]: value,
      };
      return {
        ...prev,
        rubricDetails: newDetails,
      };
    });
  };

  const filteredStudents = Array.isArray(students)
    ? students.filter((student) => {
        const firstName = student.firstName?.toLowerCase() || '';
        const lastName = student.lastName?.toLowerCase() || '';
        const searchTerm = searchQuery.toLowerCase();
        return firstName.includes(searchTerm) || lastName.includes(searchTerm);
      })
    : [];

  return (
    <>
      <Dialog open={showCriteriaDialog} onOpenChange={handleDialogClose}>
        <DialogContent className='sm:max-w-[450px]'>
          <DialogHeader>
            <DialogTitle>Grading Criteria</DialogTitle>
            <DialogDescription>
              Select existing criteria or create new ones
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue='existing' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='existing'>Use Existing</TabsTrigger>
              <TabsTrigger value='new'>Create New</TabsTrigger>
            </TabsList>

            <TabsContent value='existing'>
              <div className='space-y-4 py-4'>
                {savedCriteria.length > 0 ? (
                  <>
                    <Select
                      value={selectedCriteria}
                      onValueChange={setSelectedCriteria}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select saved criteria' />
                      </SelectTrigger>
                      <SelectContent>
                        {savedCriteria.map((criteria) => (
                          <SelectItem key={criteria.id} value={criteria.id}>
                            {criteria.name}
                            <span className='text-sm text-muted-foreground ml-2'>
                              (by {criteria.user?.name || 'Unknown'})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCriteria && (
                      <div className='text-sm text-muted-foreground'>
                        Created by:{' '}
                        {savedCriteria.find((c) => c.id === selectedCriteria)
                          ?.user?.name || 'Unknown'}
                      </div>
                    )}
                  </>
                ) : (
                  <p className='text-sm text-muted-foreground text-center py-4'>
                    No saved criteria found. Create new ones in the other tab.
                  </p>
                )}
                <DialogFooter>
                  <Button variant='outline' onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApplyCriteria}
                    disabled={!selectedCriteria}
                  >
                    Apply Selected Criteria
                  </Button>
                </DialogFooter>
              </div>
            </TabsContent>

            <TabsContent value='new'>
              <div className='space-y-4 py-4'>
                <div className='grid gap-4'>
                  <div className='grid gap-2'>
                    <label htmlFor='name'>Criteria Name</label>
                    <Input
                      id='name'
                      value={newCriteria.name}
                      onChange={(e) =>
                        setNewCriteria((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder='e.g., Midterm Exam'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <label htmlFor='rubrics'>Number of Rubrics</label>
                    <Select
                      value={newCriteria.rubrics}
                      onValueChange={handleRubricCountChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='2'>2 Rubrics</SelectItem>
                        <SelectItem value='3'>3 Rubrics</SelectItem>
                        <SelectItem value='4'>4 Rubrics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='grid gap-4 mt-2'>
                    <label className='text-sm font-medium'>
                      Rubric Details
                    </label>
                    <div className='space-y-4 max-h-[200px] overflow-y-auto pr-2'>
                      {newCriteria.rubricDetails.map((rubric, index) => (
                        <div key={index} className='flex items-center gap-2'>
                          <div className='relative w-[400px]'>
                            <Input
                              value={rubric.name}
                              onChange={(e) =>
                                updateRubricDetail(
                                  index,
                                  'name',
                                  e.target.value.slice(0, 15),
                                )
                              }
                              placeholder={`Rubric ${index + 1} name`}
                              className='pr-20'
                              maxLength={15}
                            />
                            <div className='absolute right-1 top-1 bottom-1 flex items-center'>
                              <span className='text-xs text-gray-400 mr-2'>
                                {rubric.name.length}/15
                              </span>
                              <Input
                                type='number'
                                value={rubric.weight}
                                onChange={(e) =>
                                  updateRubricDetail(
                                    index,
                                    'weight',
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                min={0}
                                max={100}
                                className='w-14 h-7 px-1 text-right'
                              />
                              <span className='text-sm text-gray-500 ml-0.5 mr-2'>
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className='text-sm text-gray-500 flex justify-end items-center gap-1.5 w-[400px]'>
                      <span>Total:</span>
                      <span
                        className={cn(
                          'font-medium',
                          newCriteria.rubricDetails.reduce(
                            (sum, r) => sum + r.weight,
                            0,
                          ) === 100
                            ? 'text-green-600'
                            : 'text-red-600',
                        )}
                      >
                        {newCriteria.rubricDetails.reduce(
                          (sum, r) => sum + r.weight,
                          0,
                        )}
                        %
                      </span>
                    </div>
                  </div>

                  <div className='grid gap-2'>
                    <label htmlFor='scoringRange'>Scoring Range</label>
                    <Select
                      value={newCriteria.scoringRange}
                      onValueChange={(value) =>
                        setNewCriteria((prev) => ({
                          ...prev,
                          scoringRange: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='5'>1-5</SelectItem>
                        <SelectItem value='10'>1-10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid gap-2'>
                    <label htmlFor='passingScore'>Passing Score (%)</label>
                    <Select
                      value={newCriteria.passingScore}
                      onValueChange={(value) =>
                        setNewCriteria((prev) => ({
                          ...prev,
                          passingScore: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='75'>75%</SelectItem>
                        <SelectItem value='80'>80%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid gap-4'>
                    <div className='grid gap-2'>
                      <label htmlFor='date'>Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !selectedDate && 'text-muted-foreground',
                            )}
                          >
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {selectedDate ? (
                              format(selectedDate, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={selectedDate}
                            onSelect={onDateSelect}
                            initialFocus
                            disabled={(date) => date > new Date()}
                            defaultMonth={new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant='outline' onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCriteria}
                    disabled={
                      !newCriteria.name ||
                      isLoading ||
                      newCriteria.rubricDetails.some((r) => !r.name) ||
                      newCriteria.rubricDetails.reduce(
                        (sum, r) => sum + r.weight,
                        0,
                      ) !== 100
                    }
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Creating...
                      </>
                    ) : (
                      'Create & Apply'
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {!showCriteriaDialog && activeCriteria && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span>Created by: {activeCriteria.user?.name || 'You'}</span>
              <span>•</span>
              <span>Rubrics: {activeCriteria.rubrics}</span>
              <span>•</span>
              <span>Scoring: 1-{activeCriteria.scoringRange}</span>
              <span>•</span>
              <span>Passing: {activeCriteria.passingScore}%</span>
            </div>
            <Button onClick={handleSaveGrades} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Grades'
              )}
            </Button>
          </div>

          {isLoading ? (
            <div className='flex items-center justify-center h-32'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className='flex items-center justify-center h-32 text-muted-foreground'>
              No students in this course
            </div>
          ) : (
            <div className='relative overflow-x-auto'>
              <div className='min-w-full inline-block align-middle'>
                <div className='overflow-x-auto border rounded-lg'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='sticky left-0 bg-white z-10 min-w-[200px]'>
                          Name
                        </TableHead>
                        {rubricDetails.map((rubric, i) => (
                          <TableHead key={i} className='min-w-[150px]'>
                            <div className='flex flex-col gap-1'>
                              <Input
                                value={rubric.name}
                                onChange={(e) => {
                                  const newRubrics = [...rubricDetails];
                                  newRubrics[i] = {
                                    ...rubric,
                                    name: e.target.value,
                                  };
                                  setRubricDetails(newRubrics);
                                }}
                                className='w-full'
                                placeholder={`Rubric ${i + 1}`}
                              />
                              <div className='flex items-center gap-2'>
                                <Input
                                  type='number'
                                  value={rubric.percentage}
                                  onChange={(e) => {
                                    const newRubrics = [...rubricDetails];
                                    newRubrics[i] = {
                                      ...rubric,
                                      percentage: parseInt(e.target.value) || 0,
                                    };
                                    setRubricDetails(newRubrics);
                                  }}
                                  className='w-20'
                                  min={0}
                                  max={100}
                                />
                                <span className='text-sm text-muted-foreground'>
                                  %
                                </span>
                              </div>
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className='min-w-[100px]'>Total</TableHead>
                        <TableHead className='min-w-[100px]'>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => {
                        const studentScore = scores[student.id] || {
                          studentId: student.id,
                          scores: new Array(activeCriteria.rubrics).fill(0),
                          total: 0,
                        };

                        return (
                          <TableRow key={student.id}>
                            <TableCell className='sticky left-0 bg-white z-10'>
                              {`${student.lastName}, ${student.firstName}${
                                student.middleInitial
                                  ? ` ${student.middleInitial}.`
                                  : ''
                              }`}
                            </TableCell>
                            {studentScore.scores.map((score, index) => (
                              <TableCell key={index}>
                                <Input
                                  type='number'
                                  min={1}
                                  max={activeCriteria.scoringRange}
                                  value={score}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      student.id,
                                      index,
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                />
                              </TableCell>
                            ))}
                            <TableCell>
                              {studentScore.total.toFixed(2)}%
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  'px-2 py-1 rounded-full text-xs font-medium',
                                  studentScore.total >=
                                    Number(activeCriteria.passingScore)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800',
                                )}
                              >
                                {studentScore.total >=
                                Number(activeCriteria.passingScore)
                                  ? 'Pass'
                                  : 'Fail'}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
