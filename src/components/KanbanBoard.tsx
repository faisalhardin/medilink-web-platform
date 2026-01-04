import PlusIcon from "assets/icons/PlusIcon";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Id } from "../types";
import { CreateJourneyPointRequest, JourneyPoint, PatientVisitTask } from "@models/journey";
import ColumnContainer from "./ColumnContainer";
import { GetPatientVisitParam, PatientVisit } from "@models/patient";
import lodash from 'lodash';
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
import { ArchiveJourneyPoint, CreateJourneyPoint, GetJourneyPoints, RenameJourneyPoint, UpdateJourneyPoint } from "@requests/journey";
import { ArchiveVisit, ListVisitsByParams, UpdatePatientVisit } from "@requests/patient";
import { useParams } from "react-router-dom";
import { useModal } from "context/ModalContext";
import React from "react";
import VisitFormComponent from "./VisitForm";
import FilterBar, { FilterPresetToday } from "./FilterBar";
import { formatDateTimeForAPI, formatDateTimeWithOffset } from "@utils/common";

// Function to map PatientVisit to PatientVisitTask
function mapPatientVisitsToTasks(visits: PatientVisit[]): PatientVisitTask[] {
  return visits.map((visit) => {


    const columnId = visit.journey_point_id;
    const patientVisitTask: PatientVisitTask = {
      id: visit.id,
      notes: visit.notes,
      status: visit.status,
      create_time: visit.create_time,
      update_time: visit.update_time,
      patient_name: visit.name,
      service_point_name: visit.service_point_name,
      sex: visit.sex,
      columnId: columnId,
      column_update_time: visit.column_update_time,
    };

    if (columnId === undefined || columnId === null ) {
      patientVisitTask.columnId = '';
    }

    return patientVisitTask;
  }).sort((a, b) => {
    return a.column_update_time - b.column_update_time
  });
}



function KanbanBoard() {
  const { boardID } = useParams<{ boardID: string }>();
  const [ queryParams, setQueryParams ] = useState<GetPatientVisitParam>({
    journey_board_id: boardID,
    from_time: formatDateTimeWithOffset(FilterPresetToday.startDate()),
    to_time: formatDateTimeWithOffset(FilterPresetToday.endDate()),
  } as GetPatientVisitParam);
  
  const {openModal} = useModal();

  const [columns, setColumns] = useState<JourneyPoint[]>([]);
  const [tasks, setTasks] = useState<PatientVisitTask[]>([]);
  const [isShowAddColumnPanel, setShowAddColumnPanel] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [createColumnError, setCreateColumnError] = useState<string | null>(null);  

  const fetchVisitsData = async () => {
    try {
      const patientVisits = await ListVisitsByParams(queryParams);
      setTasks(mapPatientVisitsToTasks(patientVisits));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {

        if (typeof boardID !== 'string') {
          throw new Error('Invalid board ID');
        }

        const boardIDNumber = Number(boardID);
        if (isNaN(boardIDNumber)) {
          throw new Error('Invalid board ID');
        }

        // First API call
        const journeyPoints = await GetJourneyPoints(boardIDNumber);
        setColumns((journeyPoints || []).sort((a, b) => {
          return a.position - b.position;
        }));

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [boardID]);

  useEffect(() => {
    fetchVisitsData();
  }, [queryParams])

   const onFilterChange = (filter: Record<string, any>) => {
    const updatedParams: GetPatientVisitParam = {
      ...queryParams,
      journey_board_id: queryParams.journey_board_id,
      
      from_time: formatDateTimeForAPI(filter.timeRange?.startDate || queryParams.from_time || ''),
      to_time: formatDateTimeForAPI(filter.timeRange?.endDate || queryParams.to_time || ''),
    };
      setQueryParams(updatedParams);

    };

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]); // TODO: changes cause it to have unresponsive draging effect

  const [activeColumn, setActiveColumn] = useState<JourneyPoint | null>(null);

  const [activeTask, setActiveTask] = useState<PatientVisitTask | null>(null);

  const [previousTasks, setPreviousTasks] = useState<PatientVisitTask[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 20,
      },
    })
  );

  return (
    <div className="m-auto gap-2 flex flex-col min-h-screen w-full items-center overflow-x-auto overflow-y-hidden p-6">
    <div className="w-full">
      <FilterBar onFiltersChange={onFilterChange} defaultFilters={FilterPresetToday}/>
    </div>
    <div
      className="
        flex
        w-full
        items-center
        overflow-x-auto
        overflow-y-hidden
        
    "
    >
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div className="m-auto flex gap-4">
          <div className="flex gap-4">
            <SortableContext items={columnsId}>
              {columns
                .sort((a, b) => (
                  a.position - b.position
                ))
                .map((col) => {
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
          {isShowAddColumnPanel ? (
            <div className="
              h-[120px]
              w-[300px]
              min-w-[300px]
              bg-white
              border-2
              border-blue-300
              rounded-lg
              p-4
              shadow-lg
              flex
              flex-col
              gap-3
            ">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Enter column name..."
                className="
                  w-full
                  px-3
                  py-2
                  border
                  border-gray-300
                  rounded-lg
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  focus:border-transparent
                "
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createNewColumn();
                  } else if (e.key === 'Escape') {
                    cancelAddColumn();
                  }
                }}
              />
              
              {createColumnError && (
                <div className="text-red-600 text-xs sm:text-sm">
                  {createColumnError}
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={createNewColumn}
                  disabled={isCreatingColumn || !newColumnName.trim()}
                  className="
                    flex-1
                    bg-blue-500
                    text-white
                    px-4
                    py-2
                    rounded-lg
                    hover:bg-blue-600
                    disabled:bg-gray-300
                    disabled:cursor-not-allowed
                    transition-colors
                    duration-200
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >
                  {isCreatingColumn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon />
                      Add Column
                    </>
                  )}
                </button>
                
                <button
                  onClick={cancelAddColumn}
                  disabled={isCreatingColumn}
                  className="
                    px-4
                    py-2
                    border
                    border-gray-300
                    text-gray-700
                    rounded-lg
                    hover:bg-gray-50
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    transition-colors
                    duration-200
                  "
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                ShowAddColumnPanel();
              }}
              className="
        h-[60px]
        w-[300px]
        min-w-[300px]
        cursor-pointer
        rounded-lg
        bg-gradient-to-r
        border-2
        border-primary-1
        p-4
        hover:ring-2
        flex
        gap-2
        "
            >
              <PlusIcon />
              Add Column
            </button>
          )}
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
    </div>
  );

  function createTask(columnId: Id) {
    
    openModal(
      <Suspense fallback={<div>Loading...</div>}>
        {React.createElement(VisitFormComponent, {
          journeyPointID: columnId as number
        })}
      </Suspense>,
      () => {
        fetchVisitsData();
      }
    )
  }

  async function deleteTask(id: Id) {
    try {
      await ArchiveVisit({
        id: id as number,
      });

      // Remove the deleted task from the local state
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  }

  function updateTask(id: Id, content: string) {
    const newTasks = tasks.map((task) => {
      if (task.id !== id) return task;
      return { ...task, content };
    });

    setTasks(newTasks);
  }

  function ShowAddColumnPanel() {
    setShowAddColumnPanel(true);
    setNewColumnName('');
    setCreateColumnError(null);
  }

  async function createNewColumn() {
    if (!newColumnName.trim()) {
      setCreateColumnError('Column name is required');
      return;
    }

    setIsCreatingColumn(true);
    setCreateColumnError(null);

    try {
      const boardIDNumber = Number(boardID);
        if (isNaN(boardIDNumber)) {
          throw new Error('Invalid board ID');
        }

      const columnToAdd: CreateJourneyPointRequest = {
        name: newColumnName.trim(),
        board_id: boardIDNumber,
      };

      // Simulate API delay
      const newJourneyPoint = await CreateJourneyPoint(columnToAdd);

      setColumns([...columns, newJourneyPoint]);
      setShowAddColumnPanel(false);
      setNewColumnName('');
    } catch (error) {
      console.error('Error creating column:', error);
      setCreateColumnError('Failed to create column. Please try again.');
    } finally {
      setIsCreatingColumn(false);
    }
  }

  function cancelAddColumn() {
    setShowAddColumnPanel(false);
    setNewColumnName('');
    setCreateColumnError(null);
  }

  async function deleteColumn(id: Id) {
    try {
      // Archive the column on the server
      await ArchiveJourneyPoint({
        id: id as number,
      });

      // Remove the column locally
      const filteredColumns = columns.filter((col) => col.id !== id);
      setColumns(filteredColumns);

      // Remove all tasks associated with this column
      const newTasks = tasks.filter((t) => t.columnId !== id);
      setTasks(newTasks);

    } catch (error) {
      console.error("Failed to delete column:", error);
    }
  }

  async function updateColumn(id: Id, title: string) {
    try {
      // Update on server
      await RenameJourneyPoint({
        id: id as number,
        name: title,
      });

      // Update locally
      const newColumns = columns.map((col) => {
        if (col.id !== id) return col;
        return { ...col, name: title };
      });

      setColumns(newColumns);
    } catch (error) {
      // Optionally handle error, e.g. show notification
      console.error("Failed to update column name:", error);
    }
  }

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      setPreviousTasks(lodash.cloneDeep(tasks));
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);


    const localPrevTask = previousTasks;
    setPreviousTasks(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const isActiveATask = active.data.current?.type === "Task";
    if (isActiveATask && localPrevTask != null) {

      const handlerTask = () => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const prevIndex = localPrevTask?.findIndex((t) => t.id === activeId);

        if (tasks[activeIndex].columnId === localPrevTask[prevIndex].columnId) {
          setTasks(localPrevTask);
          return;
        };

        try {
          if (!(typeof tasks[activeIndex].id === 'number' && typeof tasks[activeIndex].columnId === 'string')) return;
          UpdatePatientVisit({
            id: tasks[activeIndex].id as number,
            journey_point_id: tasks[activeIndex].columnId as string,
          });

        } catch (error) {
          setTasks(localPrevTask);
          return
        }
      }

      handlerTask();

    }



    const isActiveAColumn = active.data.current?.type === "Column";
    if (!isActiveAColumn || activeId === overId) return;

    if (activeId === overId) {
      return
    };

    if (overId.valueOf() === 0) return; // return if it is the registration columns;


    // DRAG END

    setColumns((columns) => {
      const activeColumnIndex = columns.findIndex((col) => col.id === activeId);

      const overColumnIndex = columns.findIndex((col) => col.id === overId);

      const updatedColumns = arrayMove(columns, activeColumnIndex, overColumnIndex);
      let beforePosition = overColumnIndex > 0 ? updatedColumns[overColumnIndex - 1].position : 0;
      let afterPosition = overColumnIndex < columns.length - 1 ? updatedColumns[overColumnIndex + 1].position : updatedColumns[overColumnIndex].position + 100;

      updatedColumns[overColumnIndex].position = Math.round((beforePosition + afterPosition) / 2);
      try {
        UpdateJourneyPoint(updatedColumns[overColumnIndex]);
      } catch (error) {
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
        }
        tasks[activeIndex].column_update_time = Math.floor(Date.now() / 1000);
        return arrayMove(tasks, activeIndex, -1);
      });
    }

    const isOverAColumn = over.data.current?.type === "Column";

    // Im dropping a Task over a column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);

        tasks[activeIndex].columnId = overId;
        // "DROPPING TASK OVER COLUMN"
        return arrayMove(tasks, activeIndex, -1);
      });
    }
  }
}

export default KanbanBoard;
