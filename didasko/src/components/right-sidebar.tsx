import UpcomingEvents from '@/components/events';
import Notes from '@/components/notes';

export default function Rightsidebar() {
  return (
    <div
      className={`w-[360px] bg-[#124A69] sticky top-0 p-4 pt-2 border-l h-screen flex flex-col transition-transform duration-300`}
    >
      <div className='flex items-center justify-center'></div>
      <div className='flex-grow'>
        <UpcomingEvents />

        <Notes />
      </div>
    </div>
  );
}
