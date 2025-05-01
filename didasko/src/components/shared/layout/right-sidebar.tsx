import UpcomingEvents from '@/components/events';
import Notes from '@/components/notes';

export default function Rightsidebar() {
  return (
    <div className='fixed top-0 right-0 z-40 h-screen w-[360px] bg-[#124A69] border-l p-4 pt-2 flex flex-col transition-transform duration-300 overflow-hidden'>
      <div className='flex-grow overflow-y-auto flex flex-col gap-4'>
        <div className='flex-shrink-0'>
          <UpcomingEvents />
        </div>
        <div className='flex-shrink-0'>
          <Notes />
        </div>
      </div>
    </div>
  );
}
