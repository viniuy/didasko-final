import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Plus, Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
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

interface Student {
  id: string;
  lastName: string;
  firstName: string;
  middleInitial?: string;
  image?: string;
}

interface AddStudentSheetProps {
  onAddStudent: (student: {
    lastName: string;
    firstName: string;
    middleInitial?: string;
    image?: string;
  }) => void;
  onSelectExistingStudent: (student: Student) => void;
}

export function AddStudentSheet({
  onAddStudent,
  onSelectExistingStudent,
}: AddStudentSheetProps) {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [isOpen, setIsOpen] = useState(false);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [existingStudents, setExistingStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [studentToAdd, setStudentToAdd] = useState<Student | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  console.log('Component rendered with courseId:', courseId);

  useEffect(() => {
    console.log('Current students:', existingStudents);
  }, [existingStudents]);

  useEffect(() => {
    console.log('useEffect triggered with:', { courseId, isOpen });

    const fetchUnenrolledStudents = async () => {
      console.log('Starting fetch with courseId:', courseId);
      if (!courseId) {
        console.log('No courseId provided, skipping fetch');
        return;
      }

      setIsLoading(true);
      try {
        console.log('Making API request...');
        const response = await fetch(
          `/api/students/unenrolled?courseId=${courseId}`,
        );
        console.log('API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched students:', data.students);
          setExistingStudents(data.students || []);
        } else {
          console.error('Failed to fetch students:', response.status);
          toast.error('Failed to fetch unenrolled students');
        }
      } catch (error) {
        console.error('Error fetching unenrolled students:', error);
        toast.error('Error fetching unenrolled students');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchUnenrolledStudents();
    }
  }, [courseId, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName || !firstName) {
      toast.error('Last name and first name are required');
      return;
    }

    onAddStudent({
      lastName,
      firstName,
      middleInitial: middleInitial || undefined,
      image: image || undefined,
    });

    // Reset form
    setLastName('');
    setFirstName('');
    setMiddleInitial('');
    setImage(null);
    setIsOpen(false);
    toast.success('Student added successfully');
  };

  const filteredStudents = existingStudents.filter((student) => {
    const fullName = `${student.lastName}, ${student.firstName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const handleSelectStudent = (student: Student) => {
    console.log('Selecting student:', student);
    setStudentToAdd(student);
    setShowConfirmDialog(true);
  };

  const handleConfirmAddStudent = () => {
    if (studentToAdd) {
      onSelectExistingStudent(studentToAdd);
      setShowConfirmDialog(false);
      setIsOpen(false);
      toast.success('Student added to class successfully');
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button className='bg-[#124A69] hover:bg-[#0D3A54] text-white rounded-full px-4 h-10 flex items-center gap-2'>
            <Plus className='h-4 w-4' /> Add Student
          </Button>
        </SheetTrigger>
        <SheetContent className='p-4'>
          <SheetHeader>
            <SheetTitle>Add Student</SheetTitle>
            <SheetDescription>
              Choose how you want to add a student to the class.
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue='existing' className='w-full mt-4'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='existing'>Select Existing</TabsTrigger>
              <TabsTrigger value='new'>Add New</TabsTrigger>
            </TabsList>

            <TabsContent value='existing' className='mt-4'>
              <div className='space-y-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Search students...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-9'
                  />
                </div>

                <div className='border rounded-lg max-h-[300px] overflow-y-auto'>
                  {isLoading ? (
                    <div className='p-4 text-center text-gray-500'>
                      Loading students...
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className='p-4 text-center text-gray-500'>
                      No students found
                    </div>
                  ) : (
                    <div className='divide-y'>
                      {filteredStudents.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => handleSelectStudent(student)}
                          className='w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between'
                        >
                          <span>
                            {student.lastName}, {student.firstName}
                          </span>
                          <Plus className='h-4 w-4 text-gray-400' />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value='new' className='mt-4'>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2 flex justify-center items-center'>
                  <div className='items-center'>
                    {image ? (
                      <div className='relative'>
                        <img
                          src={image}
                          alt='Preview'
                          className='w-20 h-20 rounded-full object-cover'
                        />
                        <button
                          type='button'
                          onClick={() => setImage(null)}
                          className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-4 w-4'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          >
                            <line x1='18' y1='6' x2='6' y2='18' />
                            <line x1='6' y1='6' x2='18' y2='18' />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className='w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-8 w-8 text-gray-400'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
                          <circle cx='12' cy='7' r='4' />
                        </svg>
                      </div>
                    )}
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleImageUpload}
                      className='hidden'
                      id='image-upload'
                    />
                    <label
                      htmlFor='image-upload'
                      className='text-sm text-blue-600 hover:text-blue-800 cursor-pointer'
                    >
                      {image ? 'Change' : 'Upload'} photo
                    </label>
                  </div>
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Last Name</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder='Enter last name'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>First Name</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder='Enter first name'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Middle Initial</label>
                  <Input
                    value={middleInitial}
                    onChange={(e) => setMiddleInitial(e.target.value)}
                    placeholder='Enter middle initial'
                    maxLength={1}
                  />
                </div>
                <Button
                  type='submit'
                  className='w-full bg-[#124A69] hover:bg-[#0D3A54] text-white rounded-full px-4 h-10 flex items-center gap-2'
                >
                  Add Student
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Student to Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to add {studentToAdd?.lastName},{' '}
              {studentToAdd?.firstName} to this class?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAddStudent}>
              Add Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
