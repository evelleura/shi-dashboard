'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskStatus, UserRole } from '../../types';
import KanbanCard from './KanbanCard';
import { useLanguage } from '../../hooks/useLanguage';
import { t } from '../../lib/i18n';

interface Props {
  tasks: Task[];
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  onTimerStart?: (taskId: number) => void;
  onTimerStop?: (taskId: number) => void;
  changingTaskId?: number;
  timerLoadingId?: number;
  userRole?: UserRole;
}

type KanbanColumn = 'to_do' | 'in_progress' | 'review' | 'done' | 'overtime' | 'over_deadline';

// Map from visual column → actual TaskStatus to send to backend
const COLUMN_TO_STATUS: Record<KanbanColumn, TaskStatus> = {
  to_do: 'to_do',
  in_progress: 'in_progress',
  review: 'review',
  done: 'done',
  overtime: 'working_on_it',
  over_deadline: 'to_do',
};

interface ColumnDef {
  id: KanbanColumn;
  label: string;
  borderColor: string;
  headerBg: string;
  headerText: string;
  dropBg: string;
  icon?: string;
}

function getColumns(language: 'id' | 'en'): ColumnDef[] {
  return [
    { id: 'to_do', label: t('status.to_do', language), borderColor: 'border-t-gray-400', headerBg: 'bg-gray-50 dark:bg-gray-700', headerText: 'text-gray-700 dark:text-gray-300', dropBg: 'bg-gray-50/50 dark:bg-gray-700/20' },
    { id: 'in_progress', label: t('status.in_progress', language), borderColor: 'border-t-blue-500', headerBg: 'bg-blue-50 dark:bg-blue-900/30', headerText: 'text-blue-700 dark:text-blue-400', dropBg: 'bg-blue-50/50 dark:bg-blue-900/10' },
    { id: 'review', label: t('status.review', language), borderColor: 'border-t-purple-500', headerBg: 'bg-purple-50 dark:bg-purple-900/30', headerText: 'text-purple-700 dark:text-purple-400', dropBg: 'bg-purple-50/50 dark:bg-purple-900/10' },
    { id: 'done', label: t('status.done', language), borderColor: 'border-t-green-500', headerBg: 'bg-green-50 dark:bg-green-900/30', headerText: 'text-green-700 dark:text-green-400', dropBg: 'bg-green-50/50 dark:bg-green-900/10' },
    { id: 'overtime', label: t('tech.overtime', language), borderColor: 'border-t-amber-500', headerBg: 'bg-amber-50 dark:bg-amber-900/30', headerText: 'text-amber-700 dark:text-amber-400', dropBg: 'bg-amber-50/50 dark:bg-amber-900/10', icon: 'warning' },
    { id: 'over_deadline', label: t('tech.over_deadline', language), borderColor: 'border-t-red-500', headerBg: 'bg-red-50 dark:bg-red-900/30', headerText: 'text-red-700 dark:text-red-400', dropBg: 'bg-red-50/50 dark:bg-red-900/10', icon: 'alert' },
  ];
}

function isOverdue(task: Task): boolean {
  if (!task.due_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function getTaskColumn(task: Task): KanbanColumn {
  if (task.status === 'done') return 'done';
  if (task.status === 'review') return 'review';
  if ((task.status === 'working_on_it' || task.status === 'in_progress') && isOverdue(task)) return 'overtime';
  if (task.status === 'to_do' && isOverdue(task)) return 'over_deadline';
  if (task.status === 'working_on_it' || task.status === 'in_progress') return 'in_progress';
  return 'to_do';
}

function WarningIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// Sortable wrapper for a single card
function SortableCard({
  task, onStatusChange, onTaskClick, onTimerStart, onTimerStop,
  isChanging, isTimerLoading, userRole, columnId, isBlocked,
}: {
  task: Task;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  onTimerStart?: (taskId: number) => void;
  onTimerStop?: (taskId: number) => void;
  isChanging?: boolean;
  isTimerLoading?: boolean;
  userRole?: UserRole;
  columnId?: string;
  isBlocked?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task, columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard
        task={task}
        onStatusChange={onStatusChange}
        onClick={onTaskClick}
        onTimerStart={onTimerStart}
        onTimerStop={onTimerStop}
        isChanging={isChanging}
        isTimerLoading={isTimerLoading}
        userRole={userRole}
        columnId={columnId}
        isBlocked={isBlocked}
      />
    </div>
  );
}

export default function KanbanBoard({ tasks, onStatusChange, onTaskClick, onTimerStart, onTimerStop, changingTaskId, timerLoadingId, userRole }: Props) {
  const { language } = useLanguage();
  const COLUMNS = getColumns(language);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = useState<KanbanColumn | null>(null);

  const isTechnician = userRole === 'technician';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const doneTaskIds = useMemo(() => new Set(tasks.filter((t) => t.status === 'done').map((t) => t.id)), [tasks]);

  const grouped = useMemo(() => {
    const map: Record<KanbanColumn, Task[]> = { to_do: [], in_progress: [], review: [], done: [], overtime: [], over_deadline: [] };
    for (const task of tasks) map[getTaskColumn(task)].push(task);
    for (const key of Object.keys(map) as KanbanColumn[]) map[key].sort((a, b) => a.sort_order - b.sort_order);
    return map;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) { setOverColumnId(null); return; }
    // over.id might be a column id or a task id — resolve to column
    const colId = COLUMNS.find((c) => c.id === over.id)?.id
      ?? (tasks.find((t) => t.id === over.id) ? getTaskColumn(tasks.find((t) => t.id === over.id)!) : null);
    setOverColumnId(colId as KanbanColumn | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumnId(null);
    if (!over || !active) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    // Resolve target column: over.id is either a column id or a task id
    const targetColumnId = (COLUMNS.find((c) => c.id === over.id)?.id
      ?? (tasks.find((t) => t.id === over.id) ? getTaskColumn(tasks.find((t) => t.id === over.id)!) : null)) as KanbanColumn | null;

    if (!targetColumnId) return;

    const currentColumnId = getTaskColumn(draggedTask);
    if (currentColumnId === targetColumnId) return;

    // Technicians can't move to done or review
    const newStatus = COLUMN_TO_STATUS[targetColumnId];
    if (isTechnician && (newStatus === 'done' || newStatus === 'review')) return;

    onStatusChange(draggedTask.id, newStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4" role="region" aria-label="Kanban board">
        {COLUMNS.map((col) => {
          const colTasks = grouped[col.id];
          const isOver = overColumnId === col.id && activeTask !== null;
          return (
            <SortableContext
              key={col.id}
              id={col.id}
              items={colTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                className={`rounded-xl border border-gray-200 dark:border-gray-700 border-t-4 ${col.borderColor} min-h-[200px] flex flex-col transition-colors ${isOver ? col.dropBg + ' ring-2 ring-blue-400/40' : ''}`}
                data-column-id={col.id}
              >
                <div className={`${col.headerBg} px-3 py-2.5 rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {col.icon === 'warning' && <WarningIcon />}
                      {col.icon === 'alert' && <AlertIcon />}
                      <h3 className={`text-sm font-semibold ${col.headerText}`}>{col.label}</h3>
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-full px-2 py-0.5">
                      {colTasks.length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh]">
                  {colTasks.length === 0 ? (
                    <div className={`text-center py-8 rounded-lg border-2 border-dashed transition-colors ${isOver ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t('kanban.no_tasks', language)}</p>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <SortableCard
                        key={task.id}
                        task={task}
                        onStatusChange={onStatusChange}
                        onTaskClick={onTaskClick}
                        onTimerStart={onTimerStart}
                        onTimerStop={onTimerStop}
                        isChanging={changingTaskId === task.id}
                        isTimerLoading={timerLoadingId === task.id}
                        userRole={userRole}
                        columnId={col.id}
                        isBlocked={task.depends_on != null && !doneTaskIds.has(task.depends_on)}
                      />
                    ))
                  )}
                </div>
              </div>
            </SortableContext>
          );
        })}
      </div>

      {/* Ghost card shown while dragging */}
      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeTask ? (
          <div className="rotate-2 opacity-95 shadow-2xl">
            <KanbanCard
              task={activeTask}
              onStatusChange={() => {}}
              columnId={getTaskColumn(activeTask)}
              isBlocked={activeTask.depends_on != null && !doneTaskIds.has(activeTask.depends_on)}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
