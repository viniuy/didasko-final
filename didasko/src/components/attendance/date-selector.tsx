import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  return (
    <div className='flex items-center gap-2'>
      <label className='text-sm font-medium text-gray-700'>Date:</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className={`justify-start text-left font-normal ${
              !selectedDate && 'text-muted-foreground'
            }`}
          >
            {selectedDate ? (
              format(selectedDate, 'MMMM dd, yyyy (EEEE)')
            ) : (
              <span>Pick a date</span>
            )}
            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={selectedDate}
            onSelect={onDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
