import PlusIcon from "assets/icons/PlusIcon";
import { useEffect, useMemo, useState } from "react";
import { Column, Id, Task } from "../types";
import { JourneyPoint, PatientVisitTask } from "@models/journey";
import ColumnContainer from "./ColumnContainer";
import { PatientVisit } from "@models/patient";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import TaskCard from "./TaskCard";
import { GetJourneyPoints, UpdateJourneyPoint } from "@requests/journey";
import { ListVisitsByParams } from "@requests/patient";

const registrationColumn: JourneyPoint = {
  id: 0,
  name: "Registration",
  position:0,
  board_id:1,
};

const defaultTasks: PatientVisitTask[] = [];

// Function to map PatientVisit to PatientVisitTask
function mapPatientVisitsToTasks(visits: PatientVisit[]): PatientVisitTask[] {
  return visits.map((visit) => {
    const columnId = visit.journey_point_id;

    if (columnId === undefined || columnId === null || columnId <= 0) {
      return {
        id: visit.id,
        columnId: 0, // Assign a default or fallback value
        notes: visit.notes,
        status: visit.status,
      };
    }

    return {
      id: visit.id,
      columnId: visit.journey_point_id,
      notes: visit.notes,
      status: visit.status,
    }
  });
}



function KanbanBoard() {
  const [columns, setColumns] = useState<JourneyPoint[]>([]);
  const [tasks, setTasks] = useState<PatientVisitTask[]>(defaultTasks);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First API call
        const journeyPoints = await GetJourneyPoints();
        setColumns(journeyPoints);

        // Second API call (dependent on the first)
        const patientVisits = await ListVisitsByParams({
          journey_board_id: 1,
        });
        setTasks(mapPatientVisitsToTasks(patientVisits));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const columnsId = useMemo(() => columns.map((col) => col.position), [columns]); // TODO: changes cause it to have unresponsive draging effect



  const [activeColumn, setActiveColumn] = useState<JourneyPoint | null>(null);

  const [activeTask, setActiveTask] = useState<PatientVisitTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  return (
    <div
      className="
        m-auto
        flex
        min-h-screen
        w-full
        items-center
        overflow-x-auto
        overflow-y-hidden
        px-[40px]
    "
    >
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div className="m-auto flex gap-4">
          <ColumnContainer
            key={registrationColumn.id}
            column={registrationColumn}
            deleteColumn={deleteColumn}
            updateColumn={updateColumn}
            createTask={createTask}
            deleteTask={deleteTask}
            updateTask={updateTask}
            tasks={tasks.filter((task) => task.columnId === registrationColumn.id)}
          />
          <div className="flex gap-4">
            <SortableContext items={columnsId}>
              {columns.map((col) => {
                return (
                  <ColumnContainer
                    key={col.id}
                    column={col}
                    deleteColumn={deleteColumn}
                    updateColumn={updateColumn}
                    createTask={createTask}
                    deleteTask={deleteTask}
                    updateTask={updateTask}
                    tasks={tasks.filter((task) => task.columnId === col.id)}
                  />
                )
              })}
            </SortableContext>
          </div>
          <button
            onClick={() => {
              createNewColumn();
            }}
            className="
      h-[60px]
      w-[350px]
      min-w-[350px]
      cursor-pointer
      rounded-lg
      bg-primary-3
      border-2
      border-primary-1
      p-4
      ring-rose-500
      hover:ring-2
      flex
      gap-2
      "
          >
            <PlusIcon />
            Add Column
          </button>
        </div>

        {createPortal(
          <DragOverlay>
            {activeColumn && (
              <ColumnContainer
                column={activeColumn}
                deleteColumn={deleteColumn}
                updateColumn={updateColumn}
                createTask={createTask}
                deleteTask={deleteTask}
                updateTask={updateTask}
                tasks={tasks.filter(
                  (task) => task.columnId === activeColumn.id
                )}
              />
            )}
            {activeTask && (
              <TaskCard
                task={activeTask}
                deleteTask={deleteTask}
                updateTask={updateTask}
              />
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );

  function createTask(columnId: Id) {
    const newTask: PatientVisitTask = {
      id: generateId(),
      columnId,
      notes: `Task ${tasks.length + 1}`,
      status: "new",
    };

    setTasks([...tasks, newTask]);
  }

  function deleteTask(id: Id) {
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
  }

  function updateTask(id: Id, content: string) {
    const newTasks = tasks.map((task) => {
      if (task.id !== id) return task;
      return { ...task, content };
    });

    setTasks(newTasks);
  }

  function createNewColumn() {
    const columnToAdd: JourneyPoint = {
      id: generateId(),
      name: `Column ${columns.length + 1}`,
      board_id: 1,
      position: 100,
    };

    setColumns([...columns, columnToAdd]);
  }

  function deleteColumn(id: Id) {
    const filteredColumns = columns.filter((col) => col.id !== id);
    setColumns(filteredColumns);

    const newTasks = tasks.filter((t) => t.columnId !== id);
    setTasks(newTasks);
  }

  function updateColumn(id: Id, title: string) {
    const newColumns = columns.map((col) => {
      if (col.id !== id) return col;
      return { ...col, name: title };
    });

    setColumns(newColumns);
  }

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if(overId.valueOf() === 0) return; // return if it is a newly register column

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === "Column";
    if (!isActiveAColumn) return;

    console.log("DRAG END");

    setColumns((columns) => {
      const activeColumnIndex = columns.findIndex((col) => col.id === activeId);

      const overColumnIndex = columns.findIndex((col) => col.id === overId);

      const updatedColumns = arrayMove(columns, activeColumnIndex, overColumnIndex);
      let beforePosition = overColumnIndex > 0 ? updatedColumns[overColumnIndex-1].position: 0;
      let afterPosition = overColumnIndex < columns.length-1? updatedColumns[overColumnIndex+1].position: updatedColumns[overColumnIndex].position + 100;

      updatedColumns[overColumnIndex].position = Math.round((beforePosition + afterPosition)/2);
      try {
        UpdateJourneyPoint(updatedColumns[overColumnIndex]);  
      } catch(error) {
        return columns;
      }
      return updatedColumns;
    });
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";

    if (!isActiveATask) return;

    // Im dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].columnId != tasks[overIndex].columnId) {
          tasks[activeIndex].columnId = tasks[overIndex].columnId;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === "Column";

    // Im dropping a Task over a column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);

        tasks[activeIndex].columnId = overId;
        console.log("DROPPING TASK OVER COLUMN", { activeIndex });
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  }
}

function generateId() {
  /* Generate a random number between 0 and 10000 */
  return Math.floor(Math.random() * 10001);
}

export default KanbanBoard;
