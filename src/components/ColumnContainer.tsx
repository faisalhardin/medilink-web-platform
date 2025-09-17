import { SortableContext, useSortable } from "@dnd-kit/sortable";
import TrashIcon from "assets/icons/TrashIcon";
import { Id } from "../types";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";
import PlusIcon from "assets/icons/PlusIcon";
import TaskCard from "./TaskCard";
import { JourneyPoint, PatientVisitTask } from "@models/journey";
import { getStorageUserJourneyPointsIDAsSet } from "@utils/storage";

interface Props {
  column: JourneyPoint;
  deleteColumn: (id: Id) => void;
  updateColumn: (id: Id, name: string) => void;

  createTask: (columnId: Id) => void;
  updateTask: (id: Id, content: string) => void;
  deleteTask: (id: Id) => void;
  tasks: PatientVisitTask[];
}

function ColumnContainer({
  column,
  deleteColumn,
  updateColumn,
  createTask,
  tasks,
  deleteTask,
  updateTask,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(column.name);
  const [userJourneyPoints, setUserJourneyPoints] = useState<Set<Id>>(new Set());
  
  useEffect(() => {
    const _userJourneyPoints = getStorageUserJourneyPointsIDAsSet() || new Set();
    setUserJourneyPoints(_userJourneyPoints);
  }, []);

  // Reset editValue when column name changes
  useEffect(() => {
    setEditValue(column.name);
  }, [column.name]);
  
  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id, // changing this to position smoothens columns swap transition
    data: {
      type: "Column",
      column,
    },
    disabled: editMode || (typeof column.id === "number" && column.id <= 0),
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {

    if (typeof column.id === "number" &&  column.id < 0) {
      return;
    }
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="
      bg-primary-1
      opacity-40
      border-2
      border-pink-500
      w-[350px]
      h-[500px]
      max-h-[500px]
      rounded-md
      flex
      flex-col
      "
      ></div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="
      bg-white
      w-[350px]
      h-[500px]
      max-h-[500px]
      rounded-xl
      flex
      flex-col
      shadow-lg
      border
      border-gray-200
      hover:shadow-xl
      transition-all
      duration-300
      "
    >
      {/* Column title */}
      <div
        {...attributes}
        {...listeners}
        onClick={() => {
          setEditMode(true);
        }}
        className="
        bg-gradient-to-r
        from-blue-500
        to-blue-600
        text-white
        text-md
        h-[60px]
        cursor-grab
        rounded-t-xl
        p-4
        font-semibold
        flex
        items-center
        justify-between
        hover:from-blue-600
        hover:to-blue-700
        transition-all
        duration-200
        shadow-md
        "
      >
        <div className="flex gap-3 items-center">
          <div
            className="
        flex
        justify-center
        items-center
        bg-white
        bg-opacity-20
        px-3
        py-1
        text-sm
        font-bold
        rounded-full
        min-w-[24px]
        h-6
        "
          >
            {tasks.length}
          </div>
          {!editMode && (
            <span className="text-white font-semibold truncate">
              {column.name}
            </span>
          )}
          {editMode && (
            <input
              className="bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 focus:bg-white focus:text-gray-900 focus:placeholder-gray-500 border border-white border-opacity-30 focus:border-white rounded-lg outline-none px-3 py-1 text-sm font-semibold transition-all duration-200"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              placeholder="Enter column name..."
              onBlur={() => {
                setEditMode(false);
                if (editValue !== column.name) {
                  updateColumn(column.id, editValue);
                }
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                setEditMode(false);
                if (editValue !== column.name) {
                  updateColumn(column.id, editValue);
                }
              }}
            />
          )}
        </div>
        <button
          onClick={() => {
            deleteColumn(column.id);
          }}
          className="
        stroke-white
        stroke-opacity-70
        hover:stroke-white
        hover:bg-white
        hover:bg-opacity-20
        rounded-lg
        p-2
        transition-all
        duration-200
        hover:scale-105
        active:scale-95
        z-5
        "
        >
          <TrashIcon />
        </button>
      </div>

      {/* Column task container */}
      <div className="flex flex-grow flex-col gap-3 p-4 overflow-x-hidden overflow-y-auto bg-gray-50">
          <SortableContext items={tasksIds} >
            {tasks
              .sort((a: PatientVisitTask, b: PatientVisitTask) => {
                return a.column_update_time - b.column_update_time
              })
              .map((task) =>
              (<TaskCard
                key={task.id}
                task={task}
                deleteTask={deleteTask}
                updateTask={updateTask}
              />)
              )}
          </SortableContext>
      </div>
      {userJourneyPoints.has(column.id) && (
        <div
          onClick={() => {
            createTask(column.id);
          }}
          className="
          flex 
          gap-3 
          items-center 
          justify-center
          border-2 
          border-dashed 
          border-gray-300 
          rounded-lg 
          p-4 
          m-4
          hover:border-blue-400 
          hover:bg-blue-50 
          hover:text-blue-600 
          active:bg-blue-100 
          cursor-pointer
          transition-all
          duration-200
          group
          "
        >
          <PlusIcon />
          <span className="font-medium text-sm">Add task</span>
        </div>
      )}
    </div>
  );
}

export default ColumnContainer;
