'use client';

import React from 'react';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Users, Loader2, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { Group } from '@/components/groups/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { GradingTable } from '@/components/grading/grading-table';
import { GroupGradingTable } from '@/components/groups/GroupGradingTable';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { Checkbox } from '@/components/ui/checkbox';

interface Course {
  id: string;
  code: string;
  section: string;
  name: string;
}

interface Rubric {
  id: string;
  name: string;
  date: string;
  criteria: {
    name: string;
    weight: number;
    isGroupCriteria: boolean;
  }[];
  scoringRange: string;
  passingScore: string;
}

interface GradingScore {
  studentId: string;
  scores: number[];
  total: number;
}

export default function GroupGradingPage({
  params,
}: {
  params: Promise<{ course_code: string; course_section: string; group_id: string }>;
}) {
  const resolvedParams = React.use(params);
  const [open, setOpen] = React.useState(false);
  const [course, setCourse] = React.useState<Course | null>(null);
  const [group, setGroup] = React.useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [rubrics, setRubrics] = React.useState<Rubric[]>([]);
  const [selectedRubric, setSelectedRubric] = React.useState<Rubric | null>(null);
  const [showNewRubricForm, setShowNewRubricForm] = React.useState(false);
  const [scores, setScores] = React.useState<Record<string, GradingScore>>({});
  const [newReport, setNewReport] = React.useState({
    name: '',
    rubrics: '2',
    scoringRange: '5',
    passingScore: '75',
    rubricDetails: [
      { name: '', weight: 50, isGroupCriteria: true },
      { name: '', weight: 50, isGroupCriteria: true },
    ],
  });
  const [validationErrors, setValidationErrors] = React.useState<{
    name?: string;
    rubrics?: string[];
  }>({});
  const router = useRouter();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, groupRes] = await Promise.all([
          axiosInstance.get(`/courses/${resolvedParams.course_code}?section=${resolvedParams.course_section}`),
          axiosInstance.get(
            `/courses/${resolvedParams.course_code}/groups/${resolvedParams.group_id}`
          )
        ]);
        setCourse(courseRes.data);
        if (groupRes.data) {
          const transformedGroup: Group = {
            id: groupRes.data.id,
            number: groupRes.data.number,
            name: groupRes.data.name,
            students: groupRes.data.students.map((student: any) => ({
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
              middleInitial: student.middleInitial,
              image: student.image,
            })),
            leader: groupRes.data.leader ? {
              id: groupRes.data.leader.id,
              firstName: groupRes.data.leader.firstName,
              lastName: groupRes.data.leader.lastName,
              middleInitial: groupRes.data.leader.middleInitial,
              image: groupRes.data.leader.image,
            } : null,
          };
          setGroup(transformedGroup);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.course_code, resolvedParams.course_section, resolvedParams.group_id]);

  // Filter students based on search query
  const filteredStudents = group?.students.filter((student) => {
    const search = searchQuery.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(search) ||
      student.lastName.toLowerCase().includes(search)
    );
  }) || [];

  const handleSaveGrades = async () => {
    if (!selectedDate || !selectedRubric) {
      toast.error('Please select a date and rubric first');
      return;
    }

    try {
      setIsLoading(true);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      const gradesToSave = Object.values(scores).map((score) => ({
        studentId: score.studentId,
        scores: score.scores,
        total: score.total,
      }));

      const response = await fetch(`/api/courses/${resolvedParams.course_code}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formattedDate,
          rubricId: selectedRubric.id,
          courseCode: resolvedParams.course_code,
          courseSection: resolvedParams.course_section,
          grades: gradesToSave,
        }),
      });

      if (!response.ok) throw new Error('Failed to save grades');
      
      toast.success('Grades saved successfully');
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Failed to save grades');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRubric = async () => {
    try {
      setIsLoading(true);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      const response = await fetch(`/api/courses/${resolvedParams.course_code}/rubrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newReport.name,
          date: formattedDate,
          scoringRange: newReport.scoringRange,
          passingScore: newReport.passingScore,
          criteria: newReport.rubricDetails,
        }),
      });

      if (!response.ok) throw new Error('Failed to create rubric');
      
      const data = await response.json();
      setSelectedRubric(data);
      setShowNewRubricForm(false);
      toast.success('Rubric created successfully');
    } catch (error) {
      console.error('Error creating rubric:', error);
      toast.error('Failed to create rubric');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (studentId: string, rubricIndex: number, value: number) => {
    setScores((prev) => {
      const studentScores = prev[studentId]?.scores || new Array(selectedRubric?.criteria.length || 0).fill(0);
      const newScores = [...studentScores];
      newScores[rubricIndex] = value;

      const total = calculateTotal(newScores);

      return {
        ...prev,
        [studentId]: {
          studentId,
          scores: newScores,
          total,
        },
      };
    });
  };

  const calculateTotal = (scores: number[]): number => {
    if (!selectedRubric?.criteria.length) return 0;
    
    const maxScore = Number(selectedRubric.scoringRange);
    const validScores = scores.slice(0, selectedRubric.criteria.length);
    
    const weightedScores = validScores.map((score, index) => {
      const weight = selectedRubric.criteria[index]?.weight || 0;
      return (score / maxScore) * weight;
    });
    
    return Number(weightedScores.reduce((sum, score) => sum + score, 0).toFixed(2));
  };

  const validateReportName = (name: string) => {
    if (!name.trim()) return 'Report name is required';
    if (name.length > 25) return 'Report name must not exceed 25 characters';
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) return 'Report name can only contain letters, numbers, and spaces';
    return '';
  };

  const validateRubricName = (name: string) => {
    if (!name.trim()) return 'Rubric name is required';
    if (name.length > 15) return 'Rubric name must not exceed 15 characters';
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) return 'Rubric name can only contain letters, numbers, and spaces';
    return '';
  };

  const handleReportNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const error = validateReportName(value);
    setValidationErrors((prev) => ({ ...prev, name: error }));

    if (value.length <= 25 && /^[a-zA-Z0-9\s]*$/.test(value)) {
      setNewReport((prev) => ({
        ...prev,
        name: value,
      }));
    }
  };

  const handleRubricCountChange = (value: string) => {
    const count = parseInt(value);
    const baseWeight = Math.floor(100 / count);
    const remainder = 100 % count;

    const weights = Array(count).fill(baseWeight);
    for (let i = 0; i < remainder; i++) {
      weights[i]++;
    }

    const newRubricDetails = Array(count)
      .fill(null)
      .map((_, index) => ({
        name: '',
        weight: weights[index],
        isGroupCriteria: true,
      }));

    setNewReport((prev) => ({
      ...prev,
      rubrics: value,
      rubricDetails: newRubricDetails,
    }));
  };

  const updateRubricDetail = (
    index: number,
    field: 'name' | 'weight' | 'isGroupCriteria',
    value: string | number | boolean,
  ) => {
    setNewReport((prev) => {
      const newDetails = [...prev.rubricDetails];

      if (field === 'weight') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 100) {
          return prev;
        }
        newDetails[index] = {
          ...newDetails[index],
          weight: numValue,
        };
      } else if (field === 'isGroupCriteria') {
        newDetails[index] = {
          ...newDetails[index],
          isGroupCriteria: value as boolean,
        };
      } else {
        const nameValue = value as string;
        const error = validateRubricName(nameValue);
        setValidationErrors((prev) => ({
          ...prev,
          rubrics: prev.rubrics
            ? prev.rubrics.map((err, i) => (i === index ? error : err))
            : new Array(newDetails.length).fill(''),
        }));

        if (nameValue.length <= 15 && /^[a-zA-Z0-9\s]*$/.test(nameValue)) {
          newDetails[index] = {
            ...newDetails[index],
            name: nameValue,
          };
        }
      }

      return {
        ...prev,
        rubricDetails: newDetails,
      };
    });
  };

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='relative h-screen w-screen overflow-hidden'>
        <AppSidebar />

        <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />
            <div className='flex justify-between gap-4 mb-1 mt-1'>
              <div className='flex items-center gap-4'>
                <Link
                  href={`/grading/reporting/${resolvedParams.course_code}/${resolvedParams.course_section}/group`}
                >
                  <Button variant='ghost' size='icon'>
                    <ArrowLeft className='h-4 w-4' />
                  </Button>
                </Link>
                <h1 className='text-3xl font-bold tracking-tight text-[#A0A0A0]'>
                  Group {group?.number} Grading
                </h1>
              </div>
              <h1 className='text-2xl font-bold tracking-tight text-[#A0A0A0]'>
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </h1>
            </div>

            <div className='flex-1 overflow-y-auto pb-6'>
              <div className='bg-white rounded-lg shadow-md p-6'>
                {group ? (
                  <GroupGradingTable
                    group={group}
                    onClose={() => router.back()}
                  />
                ) : (
                  <div className="flex items-center justify-center min-h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Rightsidebar />
        </main>
      </div>

      <Dialog open={showNewRubricForm} onOpenChange={setShowNewRubricForm}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Select or Create Rubric</DialogTitle>
            <DialogDescription>
              Choose an existing rubric or create a new one for grading.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue='existing' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='existing'>Existing Criteria</TabsTrigger>
              <TabsTrigger value='create'>Create New</TabsTrigger>
            </TabsList>
            <TabsContent value='existing' className='space-y-4'>
              <div className='space-y-4 max-h-[300px] overflow-y-auto pr-2'>
                {rubrics.length === 0 ? (
                  <div className='text-center text-gray-500 py-4'>
                    No existing rubrics found. Create a new one in the "Create New" tab.
                  </div>
                ) : (
                  rubrics.map((rubric) => (
                    <div
                      key={rubric.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRubric?.id === rubric.id
                          ? 'border-[#124A69] bg-[#124A69]/5'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedRubric(rubric);
                        setShowNewRubricForm(false);
                      }}
                    >
                      <div className='flex justify-between items-start'>
                        <div>
                          <h3 className='font-medium'>{rubric.name}</h3>
                          <p className='text-sm text-gray-500'>
                            Created on {format(new Date(rubric.date), 'PPP')}
                          </p>
                        </div>
                        <div className='text-sm text-gray-500'>
                          {rubric.criteria.length} criteria
                        </div>
                      </div>
                      <div className='mt-2 space-y-1'>
                        {rubric.criteria.map((criterion, index) => (
                          <div key={index} className='text-sm text-gray-600'>
                            • {criterion.name} ({criterion.weight}%)
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value='create' className='space-y-4'>
              <div className='grid gap-2'>
                <label htmlFor='name' className='text-sm font-medium text-gray-700'>
                  Report Name
                </label>
                <Input
                  id='name'
                  value={newReport.name}
                  onChange={handleReportNameChange}
                  placeholder='Enter report name'
                  className={validationErrors.name ? 'border-red-500' : ''}
                />
                {validationErrors.name && (
                  <p className='text-sm text-red-500'>{validationErrors.name}</p>
                )}
              </div>

              <div className='grid gap-2'>
                <label htmlFor='rubrics' className='text-sm font-medium text-gray-700'>
                  Number of Rubrics
                </label>
                <Select
                  value={newReport.rubrics}
                  onValueChange={handleRubricCountChange}
                >
                  <SelectTrigger className='bg-gray-50 border-gray-200'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='2'>2 Rubrics</SelectItem>
                    <SelectItem value='3'>3 Rubrics</SelectItem>
                    <SelectItem value='4'>4 Rubrics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <label htmlFor='scoringRange' className='text-sm font-medium text-gray-700'>
                    Scoring Range
                  </label>
                  <Select
                    value={newReport.scoringRange}
                    onValueChange={(value) =>
                      setNewReport((prev) => ({
                        ...prev,
                        scoringRange: value,
                      }))
                    }
                  >
                    <SelectTrigger className='bg-gray-50 border-gray-200'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='5'>1-5</SelectItem>
                      <SelectItem value='10'>1-10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid gap-2'>
                  <label htmlFor='passingScore' className='text-sm font-medium text-gray-700'>
                    Passing Score
                  </label>
                  <Input
                    id='passingScore'
                    type='number'
                    min='0'
                    max='100'
                    value={newReport.passingScore}
                    onChange={(e) =>
                      setNewReport((prev) => ({
                        ...prev,
                        passingScore: e.target.value,
                      }))
                    }
                    className='bg-gray-50 border-gray-200'
                  />
                </div>
              </div>

              <div className='space-y-4 max-h-[200px] overflow-y-auto pr-2'>
                {newReport.rubricDetails.map((rubric, index) => (
                  <div key={index} className='flex items-center gap-2'>
                    <div className='relative w-[400px]'>
                      <Input
                        value={rubric.name}
                        onChange={(e) =>
                          updateRubricDetail(index, 'name', e.target.value)
                        }
                        placeholder={`Rubric ${index + 1} name`}
                        className={`bg-gray-50 border-gray-200 ${
                          validationErrors.rubrics?.[index] ? 'border-red-500' : ''
                        }`}
                      />
                      <div className='flex justify-between mt-1'>
                        {validationErrors.rubrics?.[index] && (
                          <p className='text-sm text-red-500'>
                            {validationErrors.rubrics[index]}
                          </p>
                        )}
                        <p className='text-xs text-gray-500 -mt-1 ml-auto'>
                          {rubric.name.length}/15
                        </p>
                      </div>
                    </div>
                    <div className='relative w-[200px] -mt-4'>
                      <div className='flex items-center gap-2'>
                        <Slider
                          value={[rubric.weight]}
                          onValueChange={(value: number[]) =>
                            updateRubricDetail(index, 'weight', value[0])
                          }
                          max={100}
                          step={1}
                          className='w-[100px]'
                        />
                        <Input
                          value={rubric.weight}
                          onChange={(e) =>
                            updateRubricDetail(
                              index,
                              'weight',
                              parseInt(e.target.value)
                            )
                          }
                          type='number'
                          min={0}
                          max={100}
                          className='w-[60px] bg-gray-50 border-gray-200'
                        />
                        <span className='text-sm text-gray-500'>%</span>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-gray-600 font-medium'>
                        Group Criteria
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className='flex justify-end mt-2'>
                <p className='text-sm font-medium'>
                  Total Weight:{' '}
                  <span
                    className={
                      newReport.rubricDetails.reduce(
                        (sum, r) => sum + r.weight,
                        0
                      ) === 100
                        ? 'text-green-600'
                        : 'text-red-500'
                    }
                  >
                    {newReport.rubricDetails.reduce(
                      (sum, r) => sum + r.weight,
                      0
                    )}
                    %
                  </span>
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowNewRubricForm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRubric}
              disabled={
                isLoading ||
                !newReport.name ||
                newReport.rubricDetails.some((r) => !r.name) ||
                newReport.rubricDetails.reduce((sum, r) => sum + r.weight, 0) !== 100
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Rubric'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
} 