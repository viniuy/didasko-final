import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Camera, X } from 'lucide-react';

interface Student {
  name: string;
  status: string;
  image?: string;
  date?: string;
  semester?: string;
}

interface StudentCardProps {
  student: Student;
  index: number;
  tempImage: { index: number; dataUrl: string } | null;
  onImageUpload: (index: number, name: string) => void;
  onSaveChanges: (index: number) => void;
  onRemoveImage: (index: number, name: string) => void;
  onStatusChange: (index: number, status: string) => void;
}

const statusStyles: Record<string, string> = {
  LATE: 'bg-[#FFF7E6] text-[#D4A017] border-[#D4A017]',
  ABSENT: 'bg-[#FFEFEF] text-[#BA6262] border-[#BA6262]',
  PRESENT: 'bg-[#EEFFF3] text-[#62BA7D] border-[#62BA7D]',
  EXCUSED: 'bg-[#EEF2FF] text-[#8F9FDA] border-[#8F9FDA]',
  DEFAULT: 'bg-white text-gray-500 border-gray-200',
};

export function StudentCard({
  student,
  index,
  tempImage,
  onImageUpload,
  onSaveChanges,
  onRemoveImage,
  onStatusChange,
}: StudentCardProps) {
  return (
    <div className='w-full bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
      <div className='flex flex-col items-center gap-3'>
        <Dialog>
          <DialogTrigger asChild>
            <div className='relative group cursor-pointer'>
              {student.image ||
              (tempImage?.index === index && tempImage.dataUrl) ? (
                <div className='relative'>
                  <Image
                    src={
                      tempImage?.index === index
                        ? tempImage.dataUrl
                        : student.image || '/placeholder.png'
                    }
                    alt={student.name}
                    width={64}
                    height={64}
                    className='w-16 h-16 rounded-full object-cover group-hover:opacity-80 transition-opacity'
                  />
                  <div className='absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                    <Camera className='text-white w-8 h-8' />
                  </div>
                </div>
              ) : (
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors'>
                  <Camera className='text-gray-400 w-6 h-6' />
                </div>
              )}
            </div>
          </DialogTrigger>
          <DialogContent className='max-w-[400px] p-6'>
            <DialogHeader>
              <DialogTitle className='text-xl text-center font-semibold text-[#124A69]'>
                Edit profile
              </DialogTitle>
            </DialogHeader>
            <div className='flex flex-col items-center gap-6 py-6'>
              <div className='relative'>
                <div
                  className='relative group cursor-pointer'
                  onClick={() => onImageUpload(index, student.name)}
                >
                  {student.image ||
                  (tempImage?.index === index && tempImage.dataUrl) ? (
                    <div className='relative'>
                      <Image
                        src={
                          tempImage?.index === index
                            ? tempImage.dataUrl
                            : student.image || '/placeholder.png'
                        }
                        alt={student.name}
                        width={128}
                        height={128}
                        className='w-32 h-32 rounded-full object-cover'
                      />
                      <div className='absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                        <Camera className='text-white w-8 h-8' />
                      </div>
                      {(student.image || tempImage?.index === index) && (
                        <button
                          className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors'
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveImage(index, student.name);
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className='w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors'>
                      <Camera className='text-gray-400 w-8 h-8' />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className='flex gap-3 mt-2'>
              <Button
                variant='outline'
                className='flex-1 rounded-lg'
                onClick={() => {
                  const dialogTrigger = document.querySelector(
                    '[data-state="open"]',
                  );
                  if (dialogTrigger instanceof HTMLElement) {
                    dialogTrigger.click();
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                className='flex-1 rounded-lg bg-[#124A69] hover:bg-[#0D3A54] text-white'
                onClick={() => onSaveChanges(index)}
              >
                Save changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <h3
          className='text-sm font-medium text-gray-900 w-full truncate text-center'
          title={student.name}
        >
          {student.name}
        </h3>
        <div className='w-full'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className={`w-full rounded-full px-4 py-1.5 text-sm font-medium border ${
                  statusStyles[student.status] || statusStyles.DEFAULT
                }`}
              >
                {student.status || 'Select status'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='center'>
              <DropdownMenuItem
                onClick={() => onStatusChange(index, 'PRESENT')}
              >
                Present
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(index, 'LATE')}>
                Late
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(index, 'ABSENT')}>
                Absent
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange(index, 'EXCUSED')}
              >
                Excused
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
