import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AddGroupModalProps {
  courseCode: string;
  excludedStudentIds?: string[];
  nextGroupNumber?: number;
  onGroupAdded?: () => void;
}

interface Student {
  id: string;
  name: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'No Attendance';
}

export function AddGroupModal({
  courseCode,
  excludedStudentIds = [],
  nextGroupNumber,
  onGroupAdded,
}: AddGroupModalProps) {
  const [groupNumber, setGroupNumber] = React.useState('');
  const [groupName, setGroupName] = React.useState('');
  const [selectedStudents, setSelectedStudents] = React.useState<string[]>([]);
  const [selectedLeader, setSelectedLeader] = React.useState<string>('');
  const [students, setStudents] = React.useState<Student[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [studentSearch, setStudentSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [groupNameError, setGroupNameError] = React.useState('');
  const [groupNumberError, setGroupNumberError] = React.useState('');

  // Clear form when modal is opened
  React.useEffect(() => {
    if (open) {
      setGroupNumber(nextGroupNumber ? String(nextGroupNumber) : '');
      setGroupName('');
      setSelectedStudents([]);
      setSelectedLeader('');
      setStudentSearch('');
      setGroupNameError('');
      setGroupNumberError('');
    }
  }, [open, nextGroupNumber]);

  // Fetch students immediately when component mounts
  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/courses/${courseCode}/students`);
        const data = await res.json();
        setStudents(data.students || []);
      } catch (err) {
        console.error('Error fetching students:', err);
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [courseCode]);

  // Set default group number when nextGroupNumber changes
  React.useEffect(() => {
    if (nextGroupNumber !== undefined && nextGroupNumber !== null) {
      setGroupNumber(String(nextGroupNumber));
    }
  }, [nextGroupNumber]);

  // Filter out students already in a group
  const availableStudents = students.filter(
    (student) => !excludedStudentIds.includes(student.id),
  );

  // Filter students by name or attendance status
  const filteredStudents = availableStudents.filter((student) => {
    const search = studentSearch.toLowerCase();
    return (
      student.name.toLowerCase().includes(search) ||
      student.status.toLowerCase().includes(search)
    );
  });

  // Multi-select logic
  const handleStudentSelect = (id: string) => {
    setSelectedStudents((prev) => {
      const newSelected = prev.includes(id)
        ? prev.filter((sid) => sid !== id)
        : [...prev, id];
      // If the leader is no longer in the selected students, clear the leader
      if (!newSelected.includes(selectedLeader)) {
        setSelectedLeader('');
      }
      return newSelected;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate group number
    const groupNum = parseInt(groupNumber);
    if (isNaN(groupNum) || groupNum < 1 || groupNum > 15) {
      setGroupNumberError('Group number must be between 1 and 15');
      return;
    }

    // Check if group number already exists
    try {
      const checkResponse = await fetch(
        `/api/courses/${courseCode}/groups/check-number?number=${groupNum}`,
      );
      if (!checkResponse.ok) {
        throw new Error('Failed to check group number');
      }
      const { exists } = await checkResponse.json();
      if (exists) {
        setGroupNumberError('A group with this number already exists');
        return;
      }
      setGroupNumberError('');
    } catch (error) {
      console.error('Error checking group number:', error);
      setGroupNumberError('Error checking group number');
      return;
    }

    // Validate minimum number of students
    if (selectedStudents.length < 2) {
      toast.error('Please select at least 2 students for the group');
      return;
    }

    // Validate group name if provided
    if (groupName) {
      try {
        const checkResponse = await fetch(
          `/api/courses/${courseCode}/groups/check-name?name=${encodeURIComponent(
            groupName,
          )}`,
        );
        if (!checkResponse.ok) {
          throw new Error('Failed to check group name');
        }
        const { exists } = await checkResponse.json();
        if (exists) {
          setGroupNameError('A group with this name already exists');
          return;
        }
        setGroupNameError('');
      } catch (error) {
        console.error('Error checking group name:', error);
        setGroupNameError('Error checking group name');
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseCode}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupNumber,
          groupName,
          studentIds: selectedStudents,
          leaderId: selectedLeader,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to create group');
        throw new Error('Failed to create group');
      }

      // Gracefully close the modal, reset form, and notify parent to refresh groups
      setGroupNumber(nextGroupNumber ? String(nextGroupNumber + 1) : '');
      setGroupName('');
      setSelectedStudents([]);
      setSelectedLeader('');
      setOpen(false);
      if (onGroupAdded) onGroupAdded();
      toast.success('Group created successfully!');
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Error creating group');
    } finally {
      setIsLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'ABSENT':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'No Attendance':
        return 'bg-gray-100 text-gray-500 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className='relative h-35 w-35 rounded-full bg-gray-200 flex flex-col items-center justify-center shadow-none transition-all p-0 mb-2 border-none outline-none focus:outline-none cursor-pointer group hover:bg-gray-300'>
          <span className='absolute inset-0 flex items-center justify-center'>
            <svg
              className='h-20 w-20 text-gray-400 opacity-70'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
            >
              <path d='M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2' />
              <circle cx='9' cy='7' r='4' />
              <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
              <path d='M16 3.13a4 4 0 0 1 0 7.75' />
            </svg>
            <svg
              className='h-10 w-10 text-white absolute'
              style={{
                filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.15))',
              }}
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              viewBox='0 0 24 24'
            >
              <path d='M12 5v14m7-7H5' strokeLinecap='round' />
            </svg>
          </span>
          <span className='mt-20 text-sm font-bold text-shadow-lg text-white drop-shadow-sm text-center pointer-events-none select-none'>
            Add groups
            <br />
            manually
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-[#124A69]'>
            Add groups
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='flex flex-col'>
                <label
                  htmlFor='groupNumber'
                  className='text-sm font-semibold mb-1'
                >
                  Group Number <span className='text-red-500'> *</span>
                </label>
                <Input
                  id='groupNumber'
                  value={groupNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numbers and limit to 15
                    if (/^\d*$/.test(value)) {
                      const num = parseInt(value);
                      if (value === '' || (num >= 1 && num <= 15)) {
                        setGroupNumber(value);
                        setGroupNumberError('');
                      } else {
                        setGroupNumberError('Maximum group number is 15');
                      }
                    }
                  }}
                  placeholder='1'
                  required
                  className={groupNumberError ? 'border-red-500' : ''}
                  maxLength={2}
                />
                {groupNumberError && (
                  <span className='text-red-500 text-xs mt-1'>
                    {groupNumberError}
                  </span>
                )}
              </div>
              <div className='flex flex-col'>
                <label
                  htmlFor='groupName'
                  className='text-sm font-semibold mb-1'
                >
                  Group Name <span className='text-gray-400'>(optional)</span>
                </label>
                <Input
                  id='groupName'
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    setGroupNameError(''); // Clear error when user types
                  }}
                  placeholder='Group Name'
                  className={groupNameError ? 'border-red-500' : ''}
                />
                {groupNameError && (
                  <span className='text-red-500 text-xs mt-1'>
                    {groupNameError}
                  </span>
                )}
              </div>
            </div>
            <div className='flex flex-col'>
              <label className='text-sm font-semibold mb-1'>
                Group Leader <span className='text-gray-400'>(optional)</span>
              </label>
              <Select
                value={selectedLeader}
                onValueChange={setSelectedLeader}
                disabled={selectedStudents.length === 0}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue
                    placeholder={
                      selectedStudents.length === 0
                        ? 'Select students first'
                        : 'Select a leader'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudents
                    .filter((student) => selectedStudents.includes(student.id))
                    .map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col'>
              <label className='text-sm font-semibold mb-1'>
                Add Students <span className='text-red-500'> *</span>
              </label>
              <Input
                type='text'
                placeholder='Search students by name or attendance status...'
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className='mb-2'
              />
              <div className='border rounded max-h-40 overflow-y-auto bg-white'>
                {filteredStudents.length === 0 ? (
                  <div className='px-3 py-2 text-gray-400 text-sm'>
                    No students found.
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <label
                      key={student.id}
                      className='flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer'
                    >
                      <input
                        type='checkbox'
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelect(student.id)}
                        className='mr-2'
                      />
                      <span>{student.name}</span>
                      <span
                        className={`ml-3 px-2 py-0.5 rounded text-xs border ${statusColor(
                          student.status,
                        )}`}
                      >
                        {student.status === 'PRESENT'
                          ? 'Present'
                          : student.status === 'LATE'
                          ? 'Late'
                          : student.status === 'ABSENT'
                          ? 'Absent'
                          : 'No Attendance'}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <div className='text-xs text-gray-500 mt-1'>
                {selectedStudents.length} out of {filteredStudents.length}{' '}
                students selected
                {selectedStudents.length < 2 && (
                  <span className='text-red-500 ml-2'>
                    (Minimum 2 students required)
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className='flex justify-between gap-4 mt-6'>
            <Button
              type='button'
              variant='outline'
              className='w-1/2'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='w-1/2 bg-[#124A69] text-white'
              disabled={isLoading || selectedStudents.length < 2}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Adding...
                </>
              ) : (
                'Add group'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
