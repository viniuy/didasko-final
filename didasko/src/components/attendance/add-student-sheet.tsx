import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { UserRoundCog, Plus, Search, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// For available students (from /available-students endpoint)
interface AvailableStudent {
  id: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  image?: string;
}

// For enrolled students (from /students endpoint)
interface EnrolledStudent {
  id: string;
  name: string;
  image?: string;
  status?: string;
  attendanceRecords?: any[];
}

// Combined type for all cases
type Student = AvailableStudent | EnrolledStudent;

// Helper function to check if student is available student
const isAvailableStudent = (student: Student): student is AvailableStudent => {
  return 'firstName' in student && 'lastName' in student;
};

// Helper function to check if student is enrolled student
const isEnrolledStudent = (student: Student): student is EnrolledStudent => {
  return 'name' in student;
};

// Helper function to format student name
const formatStudentName = (student: Student): string => {
  if (isEnrolledStudent(student)) {
    return student.name;
  } else {
    // We know it's an AvailableStudent at this point
    const availableStudent = student as AvailableStudent;
    return `${availableStudent.lastName}, ${availableStudent.firstName}${
      availableStudent.middleInitial
        ? ` ${availableStudent.middleInitial}.`
        : ''
    }`;
  }
};

interface AddStudentSheetProps {
  onSelectExistingStudent: (student: {
    id: string;
    lastName: string;
    firstName: string;
    middleInitial?: string;
    image?: string;
  }) => void;
  onStudentsRemoved?: () => void;
}

export function AddStudentSheet({
  onSelectExistingStudent,
  onStudentsRemoved,
}: AddStudentSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [isOpen, setIsOpen] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [removeSearchQuery, setRemoveSearchQuery] = useState('');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set(),
  );
  const [selectedStudentsToRemove, setSelectedStudentsToRemove] = useState<
    Set<string>
  >(new Set());
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('add');
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);

  const fetchEnrolledStudents = async () => {
    if (!courseId) return;

    try {
      setIsLoadingEnrolled(true);
      const response = await fetch(`/api/courses/${courseId}/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch enrolled students');
      }
      const data = await response.json();
      setEnrolledStudents(data.students);
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      toast.error('Failed to fetch enrolled students');
    } finally {
      setIsLoadingEnrolled(false);
    }
  };

  // Fetch all available students when the sheet is opened
  useEffect(() => {
    const fetchAvailableStudents = async () => {
      if (!isOpen || !courseId) return;

      setIsLoadingAvailable(true);
      try {
        const response = await fetch(
          `/api/courses/${courseId}/available-students`,
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch available students: ${response.status}`,
          );
        }
        const data = await response.json();
        setAllStudents(data);
      } catch (error) {
        console.error('Error fetching available students:', error);
        toast.error('Failed to fetch available students');
      } finally {
        setIsLoadingAvailable(false);
      }
    };

    fetchAvailableStudents();
  }, [isOpen, courseId]);

  // Fetch enrolled students when the sheet opens
  useEffect(() => {
    if (isOpen) {
      fetchEnrolledStudents();
    }
  }, [isOpen, courseId]);

  // Filter available students based on search query
  const availableSearchResults =
    addSearchQuery.length >= 2
      ? allStudents.filter((student) => {
          const fullName = formatStudentName(student).toLowerCase();
          return fullName.includes(addSearchQuery.toLowerCase());
        })
      : allStudents;

  // Filter enrolled students based on search query
  const enrolledSearchResults =
    removeSearchQuery.length >= 2
      ? enrolledStudents.filter((student) => {
          const fullName = formatStudentName(student).toLowerCase();
          return fullName.includes(removeSearchQuery.toLowerCase());
        })
      : enrolledStudents;

  const handleAddSearch = (query: string) => {
    setAddSearchQuery(query);
  };

  const handleRemoveSearch = (query: string) => {
    setRemoveSearchQuery(query);
  };

  const handleSelectStudent = () => {
    const selectedStudentsArray = allStudents.filter((student) =>
      selectedStudents.has(student.id),
    );

    selectedStudentsArray.forEach((student) => {
      if (isAvailableStudent(student)) {
        onSelectExistingStudent(student);
      }
    });

    setIsOpen(false);
    setAddSearchQuery('');
    setRemoveSearchQuery('');
    setSelectedStudents(new Set());
  };

  const handleNewStudent = () => {
    setIsOpen(false);
    router.push('/students/new');
  };

  const toggleAllStudents = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(
        new Set(availableSearchResults.map((student) => student.id)),
      );
    } else {
      setSelectedStudents(new Set());
    }
  };

  const toggleStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const areAllSelected =
    availableSearchResults.length > 0 &&
    availableSearchResults.every((student) => selectedStudents.has(student.id));

  const areSomeSelected = availableSearchResults.some((student) =>
    selectedStudents.has(student.id),
  );

  const handleRemoveStudent = async (studentId: string) => {
    try {
      const response = await fetch(
        `/api/courses/${courseId}/students/${studentId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) throw new Error('Failed to remove student');

      // Update the local state by removing the student
      setEnrolledStudents((prev) =>
        prev.filter((student) => student.id !== studentId),
      );

      toast.success('Student removed successfully');
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Failed to remove student');
    }
  };

  const toggleAllStudentsToRemove = (checked: boolean) => {
    if (checked) {
      setSelectedStudentsToRemove(
        new Set(enrolledSearchResults.map((student) => student.id)),
      );
    } else {
      setSelectedStudentsToRemove(new Set());
    }
  };

  const toggleStudentToRemove = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudentsToRemove);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudentsToRemove(newSelected);
  };

  const handleRemoveSelectedStudents = async () => {
    if (!courseId) return;

    try {
      setIsLoadingEnrolled(true);

      // Create an array of promises for each student removal
      const promises = Array.from(selectedStudentsToRemove).map((studentId) =>
        fetch(`/api/courses/${courseId}/students/${studentId}`, {
          method: 'DELETE',
        }).then(async (response) => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to remove student');
          }
          return studentId;
        }),
      );

      // Wait for all removals to complete
      await Promise.all(promises);

      // Reset selection
      setSelectedStudentsToRemove(new Set());

      // Close the sheet
      setIsOpen(false);

      // Show success message
      toast.success('Students removed successfully');

      // Trigger parent component to refresh student list using the proper callback
      if (onStudentsRemoved) {
        onStudentsRemoved();
      }
    } catch (error) {
      console.error('Error removing students:', error);
      toast.error('Failed to remove some students');
    } finally {
      setIsLoadingEnrolled(false);
    }
  };

  const handleSheetOpen = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset states when closing
      setAddSearchQuery('');
      setRemoveSearchQuery('');
      setSelectedStudents(new Set());
      setSelectedStudentsToRemove(new Set());
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant='outline'
          size='icon'
          className='rounded-full'
          title='Add Student'
        >
          <UserRoundCog className='h-4 w-4' />
        </Button>
      </SheetTrigger>
      <SheetContent className='w-full max-w-4xl p-4'>
        <SheetHeader>
          <SheetTitle className='text-[#124A69]'>Manage Students</SheetTitle>
        </SheetHeader>
        <Tabs
          defaultValue='add'
          className='p-2'
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='add'>Add Student</TabsTrigger>
            <TabsTrigger value='remove'>Remove Student</TabsTrigger>
          </TabsList>

          <TabsContent value='add' className='mt-4'>
            <div className='flex flex-col h-full'>
              <div className='flex items-center gap-4 mb-6'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Search existing students...'
                    value={addSearchQuery}
                    onChange={(e) => handleAddSearch(e.target.value)}
                    className='pl-9'
                  />
                </div>
              </div>

              <div className='flex-1 overflow-auto -mx-6 px-6'>
                {isLoadingAvailable ? (
                  <div className='flex justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-2 border-[#124A69] border-t-transparent'></div>
                  </div>
                ) : availableSearchResults.length > 0 ? (
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-[50px]'>
                            <Checkbox
                              checked={areAllSelected}
                              onCheckedChange={toggleAllStudents}
                              aria-label='Select all students'
                            />
                          </TableHead>
                          <TableHead className='w-[100px]'>Photo</TableHead>
                          <TableHead>Name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableSearchResults.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedStudents.has(student.id)}
                                onCheckedChange={(checked) =>
                                  toggleStudent(student.id, checked as boolean)
                                }
                                aria-label={`Select ${formatStudentName(
                                  student,
                                )}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className='relative h-10 w-10 rounded-full overflow-hidden bg-gray-100'>
                                {student.image ? (
                                  <Image
                                    src={student.image}
                                    alt={formatStudentName(student)}
                                    fill
                                    className='object-cover'
                                  />
                                ) : (
                                  <div className='h-full w-full flex items-center justify-center text-gray-400'>
                                    <UserRound className='h-5 w-5' />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className='font-medium'>
                                  {formatStudentName(student)}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : addSearchQuery.length >= 2 ? (
                  <p className='text-center text-gray-500 py-8'>
                    No students found
                  </p>
                ) : addSearchQuery.length > 0 ? (
                  <p className='text-center text-gray-500 py-8'>
                    Type at least 2 characters to search
                  </p>
                ) : (
                  <p className='text-center text-gray-500 py-8'>
                    Search for students to add to this course
                  </p>
                )}
              </div>

              <SheetFooter className='mt-6'>
                <Button
                  onClick={handleSelectStudent}
                  className='w-full bg-[#124A69] hover:bg-[#0D3A54] text-white'
                  disabled={selectedStudents.size === 0}
                >
                  Add Selected Students ({selectedStudents.size})
                </Button>
              </SheetFooter>
            </div>
          </TabsContent>

          <TabsContent value='remove' className='mt-4'>
            <div className='flex flex-col h-full'>
              <div className='flex items-center gap-4 mb-6'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Search enrolled students...'
                    value={removeSearchQuery}
                    onChange={(e) => handleRemoveSearch(e.target.value)}
                    className='pl-9'
                  />
                </div>
              </div>

              <div className='flex-1 overflow-auto -mx-6 px-6'>
                {isLoadingEnrolled ? (
                  <div className='flex justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-2 border-[#124A69] border-t-transparent'></div>
                  </div>
                ) : enrolledSearchResults.length > 0 ? (
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-[50px]'>
                            <Checkbox
                              checked={
                                enrolledSearchResults.length > 0 &&
                                selectedStudentsToRemove.size ===
                                  enrolledSearchResults.length
                              }
                              onCheckedChange={toggleAllStudentsToRemove}
                              aria-label='Select all students'
                            />
                          </TableHead>
                          <TableHead className='w-[100px]'>Photo</TableHead>
                          <TableHead>Name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrolledSearchResults.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedStudentsToRemove.has(
                                  student.id,
                                )}
                                onCheckedChange={(checked) =>
                                  toggleStudentToRemove(
                                    student.id,
                                    checked as boolean,
                                  )
                                }
                                aria-label={`Select ${formatStudentName(
                                  student,
                                )}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className='relative h-10 w-10 rounded-full overflow-hidden bg-gray-100'>
                                {student.image ? (
                                  <Image
                                    src={student.image}
                                    alt={formatStudentName(student)}
                                    fill
                                    className='object-cover'
                                  />
                                ) : (
                                  <div className='h-full w-full flex items-center justify-center text-gray-400'>
                                    <UserRound className='h-5 w-5' />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className='font-medium'>
                                  {formatStudentName(student)}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : removeSearchQuery.length >= 2 ? (
                  <p className='text-center text-gray-500 py-8'>
                    No enrolled students found
                  </p>
                ) : removeSearchQuery.length > 0 ? (
                  <p className='text-center text-gray-500 py-8'>
                    Type at least 2 characters to search
                  </p>
                ) : (
                  <p className='text-center text-gray-500 py-8'>
                    No students are currently enrolled in this course
                  </p>
                )}
              </div>

              <SheetFooter className='mt-6'>
                <Button
                  onClick={handleRemoveSelectedStudents}
                  className='w-full bg-red-600 hover:bg-red-700 text-white'
                  disabled={selectedStudentsToRemove.size === 0}
                >
                  Remove Selected Students ({selectedStudentsToRemove.size})
                </Button>
              </SheetFooter>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
