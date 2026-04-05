import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import TaskStatusSelect from './TaskStatusSelect';
import EvidenceUploader from '../evidence/EvidenceUploader';
import EvidenceGallery from '../evidence/EvidenceGallery';
import ActivityFeed from './ActivityFeed';
import TaskTimer from './TaskTimer';
import { useStartTimer, useStopTimer } from '../../hooks/useActivities';
import { useCreateEscalation } from '../../hooks/useEscalations';
import { getProjectMaterials } from '../../services/api';
import type { Task, TaskStatus, UserRole, Material, EscalationPriority } from '../../types';

type Section = 'details' | 'evidence' | 'activity' | 'materials';

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
  const [activeSection, setActiveSection] = useState<Section>('details');

  const startTimerMutation = useStartTimer();
  const stopTimerMutation = useStopTimer();
  const createEscalationMutation = useCreateEscalation();

  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [escTitle, setEscTitle] = useState('');
  const [escDescription, setEscDescription] = useState('');
  const [escPriority, setEscPriority] = useState<EscalationPriority>('medium');
  const [escFile, setEscFile] = useState<File | null>(null);
  const escFileRef = useRef<HTMLInputElement>(null);

  const resetEscalationForm = () => {
    setEscTitle('');
    setEscDescription('');
    setEscPriority('medium');
    setEscFile(null);
    if (escFileRef.current) escFileRef.current.value = '';
    setShowEscalationForm(false);
  };

  const handleEscalationSubmit = () => {
    if (!task || !escTitle.trim() || !escDescription.trim()) return;
    const formData = new FormData();
    formData.append('task_id', String(task.id));
    formData.append('title', escTitle.trim());
    formData.append('description', escDescription.trim());
    formData.append('priority', escPriority);
    if (escFile) formData.append('file', escFile);
    createEscalationMutation.mutate(formData, {
      onSuccess: () => resetEscalationForm(),
    });
  };

  // Fetch project materials for the Materials tab
  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['materials', task?.project_id],
    queryFn: () => getProjectMaterials(task!.project_id),
    staleTime: 1000 * 60 * 2,
    enabled: !!task && task.project_id > 0 && activeSection === 'materials',
  });

  if (!task) return null;

  const isTechnician = userRole === 'technician';
  const isOverdue = task.due_date && task.status !== 'done' && task.status !== 'review' && new Date(task.due_date) < new Date();
  const isOvertime = isOverdue && (task.status === 'working_on_it' || task.status === 'in_progress');
  const isOverDeadline = isOverdue && task.status === 'to_do';

  const evidenceCount = task.evidence_count ?? 0;
  const activityCount = task.activity_count ?? 0;

  const handleUploadComplete = () => {
    void qc.invalidateQueries({ queryKey: ['task', task.id] });
    void qc.invalidateQueries({ queryKey: ['technician-dashboard'] });
  };

  const handleStartTimer = () => {
    startTimerMutation.mutate({ taskId: task.id, projectId: task.project_id });
  };

  const handleStopTimer = () => {
    stopTimerMutation.mutate({ taskId: task.id, projectId: task.project_id });
  };

  const tabs: { id: Section; label: string; badge?: number }[] = [
    { id: 'details', label: 'Details' },
    { id: 'evidence', label: 'Evidence', badge: evidenceCount },
    { id: 'activity', label: 'Activity', badge: activityCount },
    { id: 'materials', label: 'Materials' },
  ];

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
            {/* Escalate button -- technician only, task not done */}
            {isTechnician && task.status !== 'done' && (
              <button
                onClick={() => setShowEscalationForm(true)}
                className="ml-auto text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                aria-label="Escalate this task"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Escalate
              </button>
            )}
          </div>
        </div>

        {/* Escalation Form (inline) */}
        {showEscalationForm && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3" role="form" aria-label="Escalation form">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-red-700">Report an Issue</h4>
              <button onClick={resetEscalationForm} className="text-gray-400 hover:text-gray-600 text-xs" aria-label="Cancel escalation">Cancel</button>
            </div>
            <div>
              <label htmlFor="esc-title" className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <input
                id="esc-title"
                type="text"
                value={escTitle}
                onChange={(e) => setEscTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="esc-desc" className="block text-xs font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                id="esc-desc"
                value={escDescription}
                onChange={(e) => setEscDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="esc-priority" className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  id="esc-priority"
                  value={escPriority}
                  onChange={(e) => setEscPriority(e.target.value as EscalationPriority)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="esc-file" className="block text-xs font-medium text-gray-700 mb-1">Attachment (optional)</label>
                <input
                  id="esc-file"
                  ref={escFileRef}
                  type="file"
                  onChange={(e) => setEscFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={resetEscalationForm}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalationSubmit}
                disabled={!escTitle.trim() || !escDescription.trim() || createEscalationMutation.isPending}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createEscalationMutation.isPending ? 'Submitting...' : 'Submit Escalation'}
              </button>
            </div>
            {createEscalationMutation.isError && (
              <p className="text-xs text-red-600">Failed to submit escalation. Please try again.</p>
            )}
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{task.description}</p>
          </div>
        )}

        {/* Info grid */}
        <div className={`grid ${isTechnician ? 'grid-cols-2' : 'grid-cols-2'} gap-3`}>
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
          {!isTechnician && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Budget</p>
              <p className="text-sm font-medium text-gray-900">
                {Number(task.budget) > 0 ? formatCurrency(Number(task.budget)) : '--'}
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        {task.notes && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">{task.notes}</p>
          </div>
        )}

        {/* Section tabs */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex gap-4 border-b border-gray-200 overflow-x-auto" role="tablist" aria-label="Task detail tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeSection === tab.id}
                className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
                onClick={() => setActiveSection(tab.id)}
              >
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Details tab */}
          {activeSection === 'details' && (
            <div className="pt-3 space-y-3">
              {(task.timeline_start || task.timeline_end) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Timeline</p>
                  <p className="text-sm text-gray-700">
                    {task.timeline_start ? formatDate(task.timeline_start) : '?'} -- {task.timeline_end ? formatDate(task.timeline_end) : '?'}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-400 space-y-1">
                {task.created_at && <p>Created: {formatDate(task.created_at)}</p>}
                {task.updated_at && <p>Last updated: {formatDate(task.updated_at)}</p>}
              </div>
            </div>
          )}

          {/* Evidence tab */}
          {activeSection === 'evidence' && (
            <div className="pt-3 space-y-4">
              <EvidenceUploader taskId={task.id} onUploadComplete={handleUploadComplete} />
              <EvidenceGallery taskId={task.id} />
            </div>
          )}

          {/* Activity tab */}
          {activeSection === 'activity' && (
            <div className="pt-3 space-y-4">
              {/* Timer at top */}
              <TaskTimer
                task={task}
                onStart={handleStartTimer}
                onStop={handleStopTimer}
                isLoading={startTimerMutation.isPending || stopTimerMutation.isPending}
              />

              {/* Activity feed */}
              <ActivityFeed taskId={task.id} />
            </div>
          )}

          {/* Materials tab */}
          {activeSection === 'materials' && (
            <div className="pt-3">
              {materialsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                </div>
              ) : materials.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No materials recorded for this project</p>
              ) : (
                <MaterialsReadOnly materials={materials} />
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function MaterialsReadOnly({ materials }: { materials: Material[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Name</th>
            <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Qty</th>
            <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Unit</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id} className="border-b border-gray-100">
              <td className="py-2 px-2 text-gray-700">{m.name}</td>
              <td className="py-2 px-2 text-gray-600 text-right">{Number(m.quantity)}</td>
              <td className="py-2 px-2 text-gray-600">{m.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
