import { RecallCalendar } from "@components/RecallCalendar";

const RecallPage = () => {
  return (
    <div className="w-full h-full p-3 sm:p-6 flex">
      <div className="flex-1 min-h-0">
        <RecallCalendar />
      </div>
    </div>
  );
};

export default RecallPage;

