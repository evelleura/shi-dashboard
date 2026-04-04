import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import TaskStatusSelect from './TaskStatusSelect';
import EvidenceUploader from '../evidence/EvidenceUploader';
import EvidenceGallery from '../evidence/EvidenceGallery';
import type { Task, TaskStatus, UserRole } from '../../types';

interface Props {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  isChanging?: boolean;
  userRole?: UserRole;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export default function TaskDetailModal({ task, open, onClose, onStatusChange, isChanging, userRole }: Props) {
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState<'details' | 'evidence'>('details');

  if (!task) return null;

  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
  const isOvertime = isOverdue && task.status === 'working_on_it';
  const isOverDeadline = isOverdue && task.status === 'to_do';

  const evidenceCount = task.evidence_count ?? 0;

  const handleUploadComplete = () => {
    void qc.invalidateQueries({ queryKey: ['task', task.id] });
    void qc.invalidateQueries({ queryKey: ['technician-dashboard'] });
  };

  return (
    <Modal open={open} onClose={onClose} title="Task Details" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Title + badges */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <TaskStatusSelect
              value={task.status}
              onChange={(s) => onStatusChange(task.id, s)}
              disabled={isChanging}
              size="md"
              userRole={userRole}
            />
            {task.is_survey_task && (
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">Survey</span>
            )}
            {isOvertime && (
              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">Overtime</span>
            )}
            {isOverDeadline && (
              <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-medium">Over Deadline</span>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{task.description}</p>
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Assignee</p>
            <p className="text-sm font-medium text-gray-900">{task.assigned_to_name ?? 'Unassigned'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Project</p>
            <p className="text-sm font-medium text-gray-900">{task.project_name ?? '--'}</p>
          </div>
          <div className={`rounded-lg p-3 ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className="text-xs text-gray-500">Due Date</p>
            <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {task.due_date ? formatDate(task.due_date) : 'No due date'}
              {isOverdue && ' (overdue)'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Budget</p>
            <p className="text-sm font-medium text-gray-900">
              {Number(task.budget) > 0 ? formatCurrency(Number(task.budget)) : '--'}
            </p>
          </div>
        </div>

        {/* Notes */}
        {task.notes && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">{task.notes}</p>
          </div>
        )}

        {/* Section tabs: Details / Evidence */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeSection === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setActiveSection('details')}
            >
              Details
            </button>
            <button
              className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                activeSection === 'evidence'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setActiveSection('evidence')}
            >
              Evidence
              {evidenceCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{evidenceCount}</span>
              )}
            </button>
          </div>

          {activeSection === 'details' && (
            <div className="pt-3 space-y-3">
              {/* Timeline */}
              {(task.timeline_start || task.timeline_end) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Timeline</p>
                  <p className="text-sm text-gray-700">
                    {task.timeline_start ? formatDate(task.timeline_start) : '?'} -- {task.timeline_end ? formatDate(task.timeline_end) : '?'}
                  </p>
                </div>
              )}

              {/* Created info */}
              <div className="text-xs text-gray-400 space-y-1">
                {task.created_at && <p>Created: {formatDate(task.created_at)}</p>}
                {task.updated_at && <p>Last updated: {formatDate(task.updated_at)}</p>}
              </div>
            </div>
          )}

          {activeSection === 'evidence' && (
            <div className="pt-3 space-y-4">
              {/* Upload section */}
              <EvidenceUploader taskId={task.id} onUploadComplete={handleUploadComplete} />

              {/* Evidence list */}
              <EvidenceGallery taskId={task.id} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
