import UpcomingEvents from '@/components/events';
import Notes from '@/components/notes';

export default function Rightsidebar() {
  return (
    <div className='fixed top-0 right-0 z-40 h-screen w-[360px] bg-[#124A69] border-l p-4 pt-2 flex flex-col transition-transform duration-300 overflow-hidden'>
      <div className='flex-grow overflow-y-auto grid grid-rows-2 gap-4 h-[calc(100vh-32px)]'>
        <div className='h-[calc(50vh-20px)]'>
          <UpcomingEvents />
        </div>
        <div className='h-[calc(50vh-20px)]'>
          <Notes />
        </div>
      </div>
    </div>
  );
}
