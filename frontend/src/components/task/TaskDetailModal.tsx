import React, { useEffect, useState } from 'react';
import { Task, taskService } from '../../services/taskService';
import { getActivityLogs, recordActivity, recordNotification } from '../../utils/activityStore';
import {
    CheckCircle2,
    Clock,
    User,
    Calendar,
    X,
    Edit3,
    Activity,
    MessageSquare,
    Paperclip,
    Clock3,
    Tag,
    Shield,
    Sparkles,
    AlertCircle,
    ChevronRight
} from 'lucide-react';

interface Props {
    task: Task | null;
    projectId: number;
    onClose: () => void;
    onEdit?: (task: Task) => void;
    onUpdated?: (updatedTask: Task) => void;
}

const getDeptBadgeClass = (dept?: string) => {
    switch ((dept || '').toLowerCase()) {
        case 'frontend':
            return 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30';
        case 'backend':
            return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30';
        case 'qa':
            return 'bg-amber-500/10 text-amber-500 border border-amber-500/30';
        case 'devops':
            return 'bg-purple-500/10 text-purple-500 border border-purple-500/30';
        case 'management':
            return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30';
        case 'admin':
        case 'admins':
            return 'bg-rose-500/10 text-rose-500 border border-rose-500/30';
        default:
            return 'bg-slate-500/10 text-slate-400 border border-slate-500/30';
    }
};

const getPriorityBadge = (priority?: string) => {
    const p = (priority || '').toUpperCase();
    if (p === 'HIGH' || p === 'URGENT') return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
    if (p === 'MEDIUM') return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
};

const TaskDetailModal: React.FC<Props> = ({ task, projectId, onClose, onEdit, onUpdated }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'comments' | 'files'>('overview');
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [status, setStatus] = useState<string>(task?.status || 'TODO');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<Array<{ id: string; author: string; text: string; time: string }>>([
        { id: '1', author: 'Team Lead', text: 'Please ensure test coverage is completed before final review.', time: '2 hours ago' }
    ]);

    useEffect(() => {
        if (task) {
            setStatus(task.status);
            const logs = getActivityLogs(50, task.projectId || projectId, task.id);
            setActivityLogs(logs);
        }
    }, [task, projectId]);

    if (!task) return null;

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === status) return;
        setUpdatingStatus(true);
        try {
            const updated = await taskService.update(projectId || task.projectId, task.id, {
                ...task,
                status: newStatus,
            });
            setStatus(newStatus);
            recordActivity({
                message: `Changed status of "${task.title}" to ${newStatus}`,
                projectId: projectId || task.projectId,
                taskId: task.id,
                type: 'status_changed',
                meta: { field: 'status', previousValue: status, newValue: newStatus }
            });
            recordNotification({
                message: `Task #${task.id} updated to ${newStatus}`,
                projectId: projectId || task.projectId,
            });
            const refreshedLogs = getActivityLogs(50, task.projectId || projectId, task.id);
            setActivityLogs(refreshedLogs);
            if (onUpdated) onUpdated(updated);
        } catch {
            // fallback
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        const newComment = {
            id: String(Date.now()),
            author: 'Current User',
            text: commentText.trim(),
            time: 'Just now',
        };
        setComments((prev) => [newComment, ...prev]);
        recordActivity({
            message: `Added a comment on task "${task.title}": "${commentText.trim().slice(0, 30)}..."`,
            projectId: projectId || task.projectId,
            taskId: task.id,
            type: 'comment_added',
        });
        setCommentText('');
        const refreshedLogs = getActivityLogs(50, task.projectId || projectId, task.id);
        setActivityLogs(refreshedLogs);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100">
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/40">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-slate-500">TASK-{task.id}</span>
                                {task.department && (
                                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${getDeptBadgeClass(task.department)}`}>
                                        {task.department}
                                    </span>
                                )}
                                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${getPriorityBadge(task.priority)}`}>
                                    {task.priority || 'NORMAL'}
                                </span>
                            </div>
                            <h2 className="mt-0.5 text-lg font-bold text-slate-100 leading-snug">{task.title}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onEdit(task);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
                            >
                                <Edit3 size={14} />
                                Edit Task
                            </button>
                        )}
                        <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-slate-800 px-5 bg-slate-900/60 text-xs font-bold text-slate-400">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 border-b-2 py-3 px-3 transition ${
                            activeTab === 'overview' ? 'border-cyan-500 text-cyan-400' : 'border-transparent hover:text-slate-200'
                        }`}
                    >
                        <Tag size={15} />
                        Overview & Specs
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`flex items-center gap-2 border-b-2 py-3 px-3 transition ${
                            activeTab === 'activity' ? 'border-cyan-500 text-cyan-400' : 'border-transparent hover:text-slate-200'
                        }`}
                    >
                        <Activity size={15} />
                        Audit Trail & Timeline
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-cyan-400 font-extrabold">{activityLogs.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`flex items-center gap-2 border-b-2 py-3 px-3 transition ${
                            activeTab === 'comments' ? 'border-cyan-500 text-cyan-400' : 'border-transparent hover:text-slate-200'
                        }`}
                    >
                        <MessageSquare size={15} />
                        Discussion
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-bold">{comments.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`flex items-center gap-2 border-b-2 py-3 px-3 transition ${
                            activeTab === 'files' ? 'border-cyan-500 text-cyan-400' : 'border-transparent hover:text-slate-200'
                        }`}
                    >
                        <Paperclip size={15} />
                        Time & Files
                    </button>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'overview' && (
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-4 md:col-span-2">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-300 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                        {task.description || 'No detailed implementation notes provided for this task.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase">Department Domain</span>
                                        <div className="mt-1 text-sm font-bold text-cyan-400">{task.department || 'Frontend'}</div>
                                    </div>
                                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase">Priority Level</span>
                                        <div className="mt-1 text-sm font-bold text-amber-400">{task.priority || 'MEDIUM'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Meta Controls */}
                            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
                                <div>
                                    <label className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Workflow Status</label>
                                    <select
                                        value={status}
                                        disabled={updatingStatus}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-100 outline-none focus:border-cyan-500"
                                    >
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="IN_REVIEW">In Review</option>
                                        <option value="DONE">Done</option>
                                    </select>
                                </div>

                                <div>
                                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Assigned Owner</span>
                                    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                                        <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-800 font-bold text-cyan-400 text-xs border border-slate-700">
                                            {task.assignedTo ? `#${task.assignedTo}` : 'U'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-200">{task.assignedTo ? `Member #${task.assignedTo}` : 'Unassigned'}</div>
                                            <div className="text-[11px] text-slate-500">{task.assignedTo ? 'Active Assignee' : 'Needs owner'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Due Date</span>
                                    <div className="mt-1.5 flex items-center gap-2 text-slate-300">
                                        <Calendar size={15} className="text-slate-400" />
                                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline set'}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Created At</span>
                                    <div className="mt-1 flex items-center gap-2 text-slate-400 text-[11px]">
                                        <Clock size={13} />
                                        <span>{task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Recently created'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Structured Timeline & Audit Trail</h4>
                            {activityLogs.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                                    No audit entries recorded for this task yet.
                                </div>
                            ) : (
                                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                                    {activityLogs.map((log) => (
                                        <div key={log.id} className="relative flex items-start gap-3">
                                            <div className="absolute -left-6 top-1 grid h-4 w-4 place-items-center rounded-full bg-slate-900 border-2 border-cyan-500 text-[9px] font-bold text-cyan-400" />
                                            <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-bold text-slate-200">{log.message}</span>
                                                    <span className="text-[11px] text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                                                    <User size={13} className="text-slate-500" />
                                                    <span>{log.actor}</span>
                                                    {log.type && (
                                                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
                                                            {log.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div className="space-y-4">
                            <form onSubmit={handleAddComment} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add a team comment or note..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-cyan-500"
                                />
                                <button type="submit" className="rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400">
                                    Post
                                </button>
                            </form>

                            <div className="grid gap-3">
                                {comments.map((c) => (
                                    <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-200">{c.author}</span>
                                            <span className="text-[11px] text-slate-500">{c.time}</span>
                                        </div>
                                        <p className="mt-2 leading-relaxed text-slate-300">{c.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <div className="space-y-4 text-xs">
                            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                                <h4 className="font-bold text-slate-200">Time Tracking & Sprint Resources</h4>
                                <p className="mt-1 text-slate-400">Estimated duration: 8 hrs | Logged: 3.5 hrs</p>
                            </div>
                            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
                                <Paperclip size={20} className="mx-auto mb-2 text-slate-600" />
                                <span>No attachments uploaded yet. Drag & drop files here.</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
