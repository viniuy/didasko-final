import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface GradeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  onConfigSaved: () => void;
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
}

const GradeConfigDialog = ({
  open,
  onOpenChange,
  courseId,
  onConfigSaved,
}: GradeConfigDialogProps) => {
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);
  const [existingConfigs, setExistingConfigs] = useState<ExistingConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [config, setConfig] = useState<GradeConfiguration>({
    name: '',
    reportingWeight: 0,
    recitationWeight: 0,
    quizWeight: 0,
    passingThreshold: 0,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const fetchConfigs = async () => {
    try {
      setIsLoadingConfigs(true);
      const response = await fetch(`/api/courses/${courseId}/grade-configs`);
      const data = await response.json();
      setExistingConfigs(data);
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  const handleUseExistingConfig = async (configId: string) => {
    try {
      setIsLoadingConfigs(true);
      const response = await fetch(
        `/api/courses/${courseId}/grade-configs/${configId}`,
      );
      const data = await response.json();
      setConfig(data);
      setSelectedConfig(data.id);
      onConfigSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error using existing config:', error);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  const handleConfigChange = (
    field: keyof GradeConfiguration,
    value: string | number,
  ) => {
    setConfig({ ...config, [field]: value });
  };

  const handleSaveConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/grade-configs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          dateRange,
        }),
      });
      if (response.ok) {
        onConfigSaved();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[450px]'>
        <DialogHeader>
          <DialogTitle className='text-[#124A69] text-2xl font-bold'>
            Configure Gradebook
          </DialogTitle>
          <DialogDescription className='text-gray-500'>
            Set up your grading criteria and weights
          </DialogDescription>
        </DialogHeader>
        {isLoadingConfigs ? (
          <div className='flex justify-center items-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <Tabs defaultValue='existing' className='w-full'>
            <TabsList className='grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg'>
              <TabsTrigger
                value='existing'
                className='data-[state=active]:bg-white data-[state=active]:shadow-sm'
              >
                Use Existing
              </TabsTrigger>
              <TabsTrigger
                value='new'
                className='data-[state=active]:bg-white data-[state=active]:shadow-sm'
              >
                Create New
              </TabsTrigger>
            </TabsList>
            <TabsContent value='existing'>
              <div className='space-y-4 py-4'>
                <div className='text-sm font-medium text-gray-700 mb-2'>
                  Select a gradebook configuration
                </div>
                {existingConfigs.length === 0 ? (
                  <div className='text-gray-500 text-center py-4'>
                    No existing configurations found.
                  </div>
                ) : (
                  <div className='flex flex-col gap-4'>
                    <Select
                      value={selectedConfig}
                      onValueChange={setSelectedConfig}
                    >
                      <SelectTrigger className='bg-gray-50 border-gray-200 w-full max-w-[400px]'>
                        <SelectValue placeholder='Select saved configuration' />
                      </SelectTrigger>
                      <SelectContent>
                        {existingConfigs.map((config) => (
                          <SelectItem key={config.id} value={config.id}>
                            <div className='flex flex-col items-start'>
                              <span className='font-medium text-[#124A69]'>
                                {config.name}
                              </span>
                              <span className='text-xs text-gray-500'>
                                Created:{' '}
                                {format(new Date(config.createdAt), 'PPP')} |
                                Reporting: {config.reportingWeight}% |
                                Recitation: {config.recitationWeight}% | Quiz:{' '}
                                {config.quizWeight}%
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <DialogFooter className='gap-2 sm:gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => onOpenChange(false)}
                    className='border-gray-200'
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleUseExistingConfig(selectedConfig)}
                    disabled={!selectedConfig}
                    className='bg-[#124A69] hover:bg-[#0d3a56]'
                  >
                    Use Selected Configuration
                  </Button>
                </DialogFooter>
              </div>
            </TabsContent>
            <TabsContent value='new'>
              <div className='space-y-3 py-2'>
                <div className='grid gap-3'>
                  <div className='grid gap-1.5'>
                    <label
                      htmlFor='name'
                      className='text-sm font-medium text-gray-700'
                    >
                      Gradebook Name
                    </label>
                    <Input
                      id='name'
                      value={config.name}
                      onChange={(e) =>
                        handleConfigChange('name', e.target.value)
                      }
                      placeholder='e.g., First Quarter Gradebook'
                      maxLength={50}
                      className='bg-gray-50 border-gray-200 h-9'
                    />
                    <div className='flex justify-between mt-0.5'>
                      <p className='text-xs text-gray-500'>
                        Only letters, numbers, and spaces allowed
                      </p>
                      <p className='text-xs text-gray-500'>
                        {config.name.length}/50
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    <div className='grid gap-1.5'>
                      <label
                        htmlFor='reporting'
                        className='text-sm font-medium text-gray-700'
                      >
                        Reporting Weight (%)
                      </label>
                      <div className='flex items-center gap-2'>
                        <Slider
                          value={[config.reportingWeight]}
                          onValueChange={(value: number[]) =>
                            handleConfigChange('reportingWeight', value[0])
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

                    <div className='grid gap-1.5'>
                      <label
                        htmlFor='recitation'
                        className='text-sm font-medium text-gray-700'
                      >
                        Recitation Weight (%)
                      </label>
                      <div className='flex items-center gap-2'>
                        <Slider
                          value={[config.recitationWeight]}
                          onValueChange={(value: number[]) =>
                            handleConfigChange('recitationWeight', value[0])
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

                    <div className='grid gap-1.5'>
                      <label
                        htmlFor='quiz'
                        className='text-sm font-medium text-gray-700'
                      >
                        Quiz Weight (%)
                      </label>
                      <div className='flex items-center gap-2'>
                        <Slider
                          value={[config.quizWeight]}
                          onValueChange={(value: number[]) =>
                            handleConfigChange('quizWeight', value[0])
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

                    <div className='grid gap-1.5'>
                      <label
                        htmlFor='threshold'
                        className='text-sm font-medium text-gray-700'
                      >
                        Passing Threshold (%)
                      </label>
                      <div className='flex items-center gap-2'>
                        <Slider
                          value={[config.passingThreshold]}
                          onValueChange={(value: number[]) =>
                            handleConfigChange('passingThreshold', value[0])
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

                  <div className='grid gap-1.5'>
                    <label className='text-sm font-medium text-gray-700'>
                      Date Range
                    </label>
                    <div className='flex justify-center bg-white p-1 rounded-lg border border-gray-200'>
                      <Calendar
                        mode='range'
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={1}
                        className='rounded-md border-0 scale-40'
                        classNames={{
                          months:
                            'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                          month: 'space-y-4',
                          caption:
                            'flex justify-center pt-1 relative items-center',
                          caption_label: 'text-sm font-medium',
                          nav: 'space-x-1 flex items-center',
                          nav_button:
                            'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                          nav_button_previous: 'absolute left-1',
                          nav_button_next: 'absolute right-1',
                          table: 'w-full border-collapse space-y-1',
                          head_row: 'flex',
                          head_cell:
                            'text-gray-500 rounded-md w-8 font-normal text-[0.8rem]',
                          row: 'flex w-full mt-2',
                          cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                          day: 'h-7 w-7 p-0 font-normal aria-selected:opacity-100',
                          day_selected:
                            'bg-[#124A69] text-white hover:bg-[#124A69] hover:text-white focus:bg-[#124A69] focus:text-white',
                          day_today: 'bg-gray-100 text-gray-900',
                          day_outside: 'text-gray-400 opacity-50',
                          day_disabled: 'text-gray-400 opacity-50',
                          day_range_middle:
                            'aria-selected:bg-gray-100 aria-selected:text-gray-900',
                          day_hidden: 'invisible',
                        }}
                      />
                    </div>
                  </div>

                  <div className='flex justify-end'>
                    <p className='text-sm font-medium'>
                      Total Weight:{' '}
                      <span
                        className={
                          config.reportingWeight +
                            config.recitationWeight +
                            config.quizWeight ===
                          100
                            ? 'text-green-600'
                            : 'text-red-500'
                        }
                      >
                        {config.reportingWeight +
                          config.recitationWeight +
                          config.quizWeight}
                        %
                      </span>
                    </p>
                  </div>
                </div>
                <DialogFooter className='gap-2 sm:gap-2 pt-2'>
                  <Button
                    variant='outline'
                    onClick={() => onOpenChange(false)}
                    className='border-gray-200'
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveConfig}
                    disabled={!config.name || isLoading}
                    className='bg-[#124A69] hover:bg-[#0d3a56]'
                  >
                    {isLoading ? 'Saving...' : 'Create New Gradebook'}
                  </Button>
                </DialogFooter>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GradeConfigDialog;
