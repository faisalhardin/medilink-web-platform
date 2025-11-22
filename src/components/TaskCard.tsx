import { useState } from "react";
import TrashIcon from "assets/icons/TrashIcon";
import { Id } from "../types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PatientVisitTask } from "@models/journey";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { ModalLink } from "./ModalLink";
import { formatDateTimeHHmm } from "@utils/common";
import { t } from "i18next";

interface Props {
  task: PatientVisitTask;
  deleteTask: (id: Id) => void;
  updateTask: (id: Id, content: string) => void;
}

function TaskCard({ task, deleteTask }: Props) {
  const [_, setMouseIsOver] = useState(false);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
    disabled: false,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="
        opacity-40
        bg-white
        p-4
        h-[120px]
        min-h-[100px]
        items-center
        flex
        text-left
        rounded-xl
        border-2
        border-blue-400
        shadow-lg
        cursor-grab
        relative
        "
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="
      bg-white
      p-4
      h-[120px]
      min-h-[120px]
      items-center
      flex-col
      text-left
      rounded-xl
      border
      border-gray-200
      shadow-sm
      hover:shadow-md
      hover:border-blue-300
      cursor-grab
      relative
      transition-all
      duration-200
      group
      "
      onMouseEnter={() => {
        setMouseIsOver(true);
      }}
      onMouseLeave={() => {
        setMouseIsOver(false);
      }}
    >
      {/* ModalLink covering the entire card */}
      <ModalLink to={`/patient-visit/${task.id}`} className="absolute inset-0 z-10">
        <div className="w-full h-full"></div>
      </ModalLink>

      {/* Task ID Badge - Above ModalLink */}
      <div className="flex justify-between items-start w-full mb-2 relative">
        <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
          #{task.id}
        </div>
        <div className="relative z-20">
          <TaskCardDropDown taskId={task.id} deleteTask={deleteTask} />
        </div>
      </div>
      
      {/* Patient Name */}
      <div className="flex-1 w-full relative">
        <p className="text-xs sm:text-sm font-medium text-gray-900 leading-tight">
          {getTitle(task.sex)} {task.patient_name}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {task.create_time ? formatDateTimeHHmm(task.create_time) : ''}
        </p>
      </div>
      
    </div>
  );
}

export default TaskCard;

const getTitle = (sex?: string) => {
  if (!sex) return "";
  const normalizedSex = sex.toLowerCase();
  return normalizedSex === "male" ? "Bapak" : normalizedSex === "female" ? "Ibu" : "";
};


interface TaskCardDropDownProps {
  taskId: Id;
  deleteTask: (id: Id) => void;
}

const TaskCardDropDown = ({ taskId, deleteTask }: TaskCardDropDownProps) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton 
          className="
          inline-flex 
          w-full 
          justify-center 
          gap-x-1 
          rounded-lg 
          bg-gray-100 
          px-2 
          py-1 
          text-xs 
          font-medium 
          text-gray-700 
          hover:bg-gray-200 
          hover:text-gray-900
          transition-all
          duration-200
          group-hover:bg-blue-100
          group-hover:text-blue-700
        ">
          ⋯
          <ChevronDownIcon aria-hidden="true" className="-mr-1 size-3 text-gray-400" />
        </MenuButton>
      </div>

      <MenuItems
        transition
        className="absolute right-0 z-30 mt-2 w-48 origin-top-right rounded-lg bg-white ring-1 shadow-lg ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
      >
        <div className="py-1">
                      <MenuItem>
              <div className="block px-4 py-2 text-xs sm:text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden hover:bg-blue-100 hover:text-blue-700">
                <ModalLink to={`/patient-visit/${taskId}`} className="block w-full">
                  {t('patient.editVisit')}
                </ModalLink>
              </div>
            </MenuItem>
          <div className="border-t border-gray-100 my-1"></div>
          <MenuItem>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteTask(taskId);
              }}
              className="block w-full px-4 py-2 text-left text-xs sm:text-sm text-red-600 data-focus:bg-red-50 data-focus:text-red-700 data-focus:outline-hidden hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <TrashIcon/>
                {t('patient.archiveVisit')}
              </div>
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
};