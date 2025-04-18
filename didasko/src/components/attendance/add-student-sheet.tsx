import { useState } from 'react';
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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddStudentSheetProps {
  onAddStudent: (student: {
    lastName: string;
    firstName: string;
    middleInitial?: string;
    image?: string;
  }) => void;
}

export function AddStudentSheet({ onAddStudent }: AddStudentSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [image, setImage] = useState<string | null>(null);

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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className='bg-[#124A69] hover:bg-[#0D3A54] text-white rounded-full px-4 h-10 flex items-center gap-2'>
          <Plus className='h-4 w-4' /> Add Student
        </Button>
      </SheetTrigger>
      <SheetContent className='p-4'>
        <SheetHeader>
          <SheetTitle>Add New Student</SheetTitle>
          <SheetDescription>
            Fill in the student's information below.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className='space-y-4 mt-4'>
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
      </SheetContent>
    </Sheet>
  );
}
