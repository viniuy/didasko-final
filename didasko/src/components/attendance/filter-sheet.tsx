import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';

interface FilterState {
  date: Date | undefined;
  status: string[];
}

interface FilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
}

export function FilterSheet({
  isOpen,
  onOpenChange,
  filters,
  onFiltersChange,
  onApplyFilters,
}: FilterSheetProps) {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'Present';
      case 'LATE':
        return 'Late';
      case 'ABSENT':
        return 'Absent';
      case 'EXCUSED':
        return 'Excused';
      default:
        return 'Status';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <div className='flex items-center gap-2'>
        <SheetTrigger asChild>
          <Button
            variant='outline'
            className='border border-gray-300 rounded-full px-3 h-8 flex items-center gap-1.5 hover:bg-gray-50 shadow-sm text-sm'
          >
            Add filter
            <span className='text-base font-normal'>+</span>
          </Button>
        </SheetTrigger>

        {/* Active Filters */}
        {(filters.date || filters.status.length > 0) && (
          <div className='flex items-center gap-1.5'>
            {filters.date && (
              <div className='inline-flex items-center gap-1 px-3 h-8 bg-[#124A69] text-white rounded-full text-xs font-medium'>
                {format(filters.date, 'MMM dd, yyyy')}
                <button
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      date: undefined,
                    });
                  }}
                  className='hover:bg-[#0D3A54] rounded-full'
                >
                  <X size={12} className='text-white' />
                </button>
              </div>
            )}
            {filters.status.map((status) => (
              <div
                key={status}
                className='inline-flex items-center gap-1 px-3 h-8 bg-[#124A69] text-white rounded-full text-xs font-medium'
              >
                {getStatusDisplay(status)}
                <button
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      status: filters.status.filter((s) => s !== status),
                    });
                  }}
                  className='hover:bg-[#0D3A54] rounded-full'
                >
                  <X size={12} className='text-white' />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <SheetContent side='right' className='w-[400px] sm:w-[540px] p-0'>
        <div className='p-6 border-b'>
          <SheetHeader>
            <SheetTitle className='text-xl font-semibold'>
              Add filter
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className='p-6 space-y-6'>
          {/* Date Filter */}
          <div className='space-y-4'>
            <label className='text-sm font-medium text-gray-700'>Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={`w-full justify-start text-left font-normal ${
                    !filters.date && 'text-muted-foreground'
                  }`}
                >
                  {filters.date ? (
                    format(filters.date, 'MMMM dd, yyyy (EEEE)')
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={filters.date}
                  onSelect={(date) => onFiltersChange({ ...filters, date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Attendance Status Filter */}
          <div className='space-y-4'>
            <label className='text-sm font-medium text-gray-700'>
              Attendance Status
            </label>
            <div className='space-y-3 border rounded-lg p-4'>
              {['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].map((status) => (
                <label
                  key={status}
                  className='flex items-center gap-2 cursor-pointer'
                >
                  <input
                    type='checkbox'
                    checked={filters.status.includes(status)}
                    onChange={(e) => {
                      onFiltersChange({
                        ...filters,
                        status: e.target.checked
                          ? [...filters.status, status]
                          : filters.status.filter((s) => s !== status),
                      });
                    }}
                    className='rounded border-gray-300 text-[#124A69] focus:ring-[#124A69]'
                  />
                  <span className='text-sm'>{getStatusDisplay(status)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className='flex items-center gap-4 p-6 border-t mt-auto'>
          <Button
            variant='outline'
            className='flex-1 rounded-lg'
            onClick={() => {
              onFiltersChange({ date: undefined, status: [] });
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            className='flex-1 rounded-lg bg-[#124A69] hover:bg-[#0D3A54]'
            onClick={onApplyFilters}
          >
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
