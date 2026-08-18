import React, { useEffect, useMemo, useState } from "react";
import { Calendar, MessageSquare, Plus, Search, SlidersHorizontal } from "lucide-react";
import TaskDetailSidebar from "../../components/TaskDetailSidebar";
import { createTask, getProjectTasks, updateTask } from "../../services/api";

const COLUMNS = ["To Do", "In Progress", "In Review", "Done"];

function formatDueDate(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function KanbanTaskCard({ task, onSelect, isSelected }) {
  return (
    <button
      type="button"
      className={isSelected ? "kanban-task-card selected" : "kanban-task-card"}
      onClick={() => onSelect(task)}
    >
      <div className="kanban-task-top">
        <span className="kanban-task-id">{task.taskNumber}</span>
        <span className={`priority-chip priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
      </div>
      <strong>{task.title}</strong>
      {task.progress > 0 && task.status !== "Done" && (
        <div className="kanban-task-progress">
          <div className="progress-track"><div className="progress-bar" style={{ width: `${task.progress}%` }} /></div>
          <span>{task.progress}%</span>
        </div>
      )}
      <div className="kanban-task-meta">
        <span className="kanban-avatar">{task.assigneeName.slice(0, 1)}</span>
        <span><Calendar size={12} /> {formatDueDate(task.dueDate)}</span>
        {task.commentCount > 0 && <span><MessageSquare size={12} /> {task.commentCount}</span>}
      </div>
    </button>
  );
}

export default function ProjectKanbanView({ project, workspace, currentUserId, canManage, onOpenTaskDetail }) {
  const [columns, setColumns] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {
    async function loadBoard() {
      setLoading(true);
      setError("");
      try {
        const board = await getProjectTasks(project.id);
        setColumns(board.columns);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadBoard();
  }, [project.id]);

  const filteredColumns = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => {
        const matchesSearch = !search.trim()
          || task.title.toLowerCase().includes(search.toLowerCase())
          || task.taskNumber.toLowerCase().includes(search.toLowerCase());
        const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
        return matchesSearch && matchesPriority;
      }),
    }));
  }, [columns, search, priorityFilter]);

  const allTaskIds = useMemo(
    () => columns.flatMap((column) => column.tasks.map((task) => task.id)),
    [columns]
  );

  function openTaskDetail(task) {
    setSelectedTask(task);
    if (onOpenTaskDetail) onOpenTaskDetail(task.id, allTaskIds);
  }

  async function handleCreateTask(status) {
    try {
      const task = await createTask(project.id, {
        title: "New task",
        status,
        assigneeId: currentUserId,
        priority: "Medium",
      });
      setColumns((items) => items.map((column) => (
        column.status === status
          ? { ...column, tasks: [...column.tasks, task] }
          : column
      )));
      setSelectedTask(task);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleTaskUpdated(updatedTask) {
    setSelectedTask(updatedTask);
    setColumns((items) => {
      const flat = items.flatMap((column) => column.tasks).filter((task) => task.id !== updatedTask.id);
      flat.push(updatedTask);
      return COLUMNS.map((status) => ({
        status,
        tasks: flat.filter((task) => task.status === status),
      }));
    });
  }

  async function moveTask(task, newStatus) {
    if (task.status === newStatus) return;
    try {
      const updatedTask = await updateTask(task.id, { status: newStatus });
      handleTaskUpdated(updatedTask);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (loading) return <p className="dashboard-loading">Loading kanban board…</p>;

  return (
    <div className="kanban-layout">
      <div className="kanban-toolbar">
        <div className="kanban-search">
          <Search size={16} />
          <input type="search" placeholder="Search tasks…" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <label className="kanban-filter">
          <SlidersHorizontal size={14} />
          Priority
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            {["All", "High", "Medium", "Low"].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <span className="kanban-group-label">Group by: Status</span>
      </div>

      {error && <p className="login-error" role="alert">{error}</p>}

      <div className="kanban-board-wrap">
        <div className="kanban-board">
          {filteredColumns.map((column) => (
            <section key={column.status} className="kanban-column">
              <header className="kanban-column-header">
                <h3>{column.status}</h3>
                <span>{column.tasks.length}</span>
              </header>
              <div className="kanban-column-body">
                {column.tasks.map((task) => (
                  <KanbanTaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTask?.id === task.id}
                    onSelect={openTaskDetail}
                  />
                ))}
              </div>
              {canManage && (
                <button type="button" className="kanban-add-task" onClick={() => handleCreateTask(column.status)}>
                  <Plus size={14} />
                  Add Task
                </button>
              )}
            </section>
          ))}
        </div>

        {selectedTask && (
          <TaskDetailSidebar
            task={selectedTask}
            workspace={workspace}
            canManage={canManage}
            onClose={() => setSelectedTask(null)}
            onUpdated={handleTaskUpdated}
            onMove={moveTask}
            onOpenFullDetail={() => onOpenTaskDetail?.(selectedTask.id, allTaskIds)}
          />
        )}
      </div>
    </div>
  );
}
