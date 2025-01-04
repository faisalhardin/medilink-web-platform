import { JourneyPoint, Id, Task } from "@models/journey"
import PlusIcon from "assets/icons/PlusIcon";
import { useMemo, useState } from "react"
import ColumnContainer from "./ColumnContainer";
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

const defaultCols: JourneyPoint[] = [
    {
        id: 1,
        title: "Todo",
    },
    {
        id: 2,
        title: "Work in progress",
    },
    {
        id: 3,
        title: "Done",
    },
];

const defaultTasks: Task[] = [
    {
        id: 1,
        columnId: 1,
        content: "List admin APIs for dashboard",
    },
    {
        id: 2,
        columnId: 2,
        content:
            "Develop user registration functionality with OTP delivered on SMS after email confirmation and phone number confirmation",
    },
    {
        id: 3,
        columnId: 3,
        content: "Conduct security testing",
    },
    {
        id: 4,
        columnId: 4,
        content: "Analyze competitors",
    },
    {
        id: 5,
        columnId: 5,
        content: "Create UI kit documentation",
    },
    {
        id: 6,
        columnId: 6,
        content: "Dev meeting",
    },
    {
        id: 7,
        columnId: 7,
        content: "Deliver dashboard prototype",
    },
    {
        id: 8,
        columnId: 8,
        content: "Optimize application performance",
    },
    {
        id: 9,
        columnId: 9,
        content: "Implement data validation",
    },
    {
        id: 10,
        columnId: 10,
        content: "Design database schema",
    },
    {
        id: 11,
        columnId: 1,
        content: "Integrate SSL web certificates into workflow",
    },
    {
        id: 12,
        columnId: 12,
        content: "Implement error logging and monitoring",
    },
    {
        id: 13,
        columnId: 13,
        content: "Design and implement responsive UI",
    },
];

export default function KanbanBoard() {
    const [columns, setColumns] = useState<JourneyPoint[]>(defaultCols);
    const columnsId = useMemo(() => columns.map((col) => col.id), [columns])

    const [tasks, setTasks] = useState<Task[]>(defaultTasks);

    const [activeColumn, setActiveColumn] = useState<JourneyPoint | null>(null);

    const [activeTask, setActiveTask] = useState<Task | null>(null);

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
        <div className="flex gap-4">
            <SortableContext items={columnsId}>
                {columns.map((col) => (
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
                    ))}
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
                p-4
                ring-primary-5
                hover:ring-2
                flex
                gap-2
                text-primary-8
                ">
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
        const newTask: Task = {
            id: generateID(),
            columnId,
            content: `Task ${tasks.length + 1}`,
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
            id: generateID(),
            title: `Column ${columns.length + 1}`
        };



        setColumns([...columns, columnToAdd])
    }

    function deleteColumn(id: Id) {
        const filteredColumns = columns.filter((col) => col.id !== id);
        setColumns(filteredColumns);

        const newTasks = tasks.filter((t) => t.columnId !== id);
        setTasks(newTasks);
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

        if (activeId === overId) return;

        const isActiveAColumn = active.data.current?.type === "Column";
        if (!isActiveAColumn) return;

        console.log("DRAG END");

        setColumns((columns) => {
            const activeColumnIndex = columns.findIndex((col) => col.id === activeId);

            const overColumnIndex = columns.findIndex((col) => col.id === overId);

            return arrayMove(columns, activeColumnIndex, overColumnIndex);
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
                    // Fix introduced after video recording
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

                tasks[activeIndex].columnId = +overId.toString;
                console.log("DROPPING TASK OVER COLUMN", { activeIndex });
                return arrayMove(tasks, activeIndex, activeIndex);
            });
        }
    }

    function updateColumn(id: Id, title: string) {
        const newColumns = columns.map((col) => {
            if (col.id !== id) return col;
            return { ...col, title };
        });

        setColumns(newColumns);
    }

    

    

    

}




const generateID = (): number => {
    return Math.floor(Math.random() * 1_000_000);
}