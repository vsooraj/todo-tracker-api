import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  LayoutGrid,
  List,
  Minus,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import TaskDetailSidebar from "../../components/TaskDetailSidebar";
import { bulkDeleteTasks, createTask, getProjectTasks, updateTask } from "../../services/api";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function formatDueDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function PriorityIcon({ priority }) {
  if (priority === "High") return <ArrowUp size={14} className="priority-icon high" />;
  if (priority === "Low") return <ArrowDown size={14} className="priority-icon low" />;
  return <Minus size={14} className="priority-icon medium" />;
}

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

export default function ProjectTaskListView({ project, workspace, currentUserId, canManage, onOpenTaskDetail }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [sortKey, setSortKey] = useState("taskNumber");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterAssignee, setFilterAssignee] = useState("All");
  const [filterSprint, setFilterSprint] = useState("All");
  const [filterTag, setFilterTag] = useState("All");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      setError("");
      try {
        const board = await getProjectTasks(project.id);
        setTasks(board.tasks || board.columns.flatMap((column) => column.tasks));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [project.id]);

  const assignees = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => map.set(task.assigneeId, task.assigneeName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const sprints = useMemo(() => [...new Set(tasks.map((task) => task.sprint).filter(Boolean))], [tasks]);
  const tags = useMemo(() => [...new Set(tasks.flatMap((task) => task.tags || []))], [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = !search.trim()
        || task.title.toLowerCase().includes(search.toLowerCase())
        || task.taskNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "All" || task.status === filterStatus;
      const matchesPriority = filterPriority === "All" || task.priority === filterPriority;
      const matchesAssignee = filterAssignee === "All" || task.assigneeId === filterAssignee;
      const matchesSprint = filterSprint === "All" || task.sprint === filterSprint;
      const matchesTag = filterTag === "All" || (task.tags || []).includes(filterTag);
      const matchesDueFrom = !dueFrom || (task.dueDate && task.dueDate >= dueFrom);
      const matchesDueTo = !dueTo || (task.dueDate && task.dueDate <= dueTo);
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesSprint && matchesTag && matchesDueFrom && matchesDueTo;
    });
  }, [tasks, search, filterStatus, filterPriority, filterAssignee, filterSprint, filterTag, dueFrom, dueTo]);

  const sortedTasks = useMemo(() => {
    const copy = [...filteredTasks];
    copy.sort((left, right) => {
      const leftValue = left[sortKey] ?? "";
      const rightValue = right[sortKey] ?? "";
      if (leftValue < rightValue) return sortDir === "asc" ? -1 : 1;
      if (leftValue > rightValue) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredTasks, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedTasks = sortedTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function clearFilters() {
    setSearch("");
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterAssignee("All");
    setFilterSprint("All");
    setFilterTag("All");
    setDueFrom("");
    setDueTo("");
    setPage(1);
  }

  function toggleSelectAll(checked) {
    if (checked) setSelectedIds(new Set(pagedTasks.map((task) => task.id)));
    else setSelectedIds(new Set());
  }

  function toggleSelect(taskId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function openTaskDetail(task) {
    setSelectedTask(task);
    if (onOpenTaskDetail) onOpenTaskDetail(task.id, sortedTasks.map((item) => item.id));
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected task(s)?`)) return;
    setError("");
    try {
      await bulkDeleteTasks(Array.from(selectedIds));
      setTasks((items) => items.filter((task) => !selectedIds.has(task.id)));
      setSelectedIds(new Set());
      if (selectedTask && selectedIds.has(selectedTask.id)) setSelectedTask(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCreateTask() {
    try {
      const task = await createTask(project.id, {
        title: "New task",
        status: "To Do",
        assigneeId: currentUserId,
        priority: "Medium",
      });
      setTasks((items) => [...items, task]);
      setSelectedTask(task);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleTaskUpdated(updatedTask) {
    setSelectedTask(updatedTask);
    setTasks((items) => items.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
  }

  async function moveTask(task, newStatus) {
    const updatedTask = await updateTask(task.id, { status: newStatus });
    handleTaskUpdated(updatedTask);
  }

  if (loading) return <p className="dashboard-loading">Loading task list…</p>;

  return (
    <div className="task-list-layout">
      <div className="task-list-main">
        <div className="task-list-toolbar">
          <button type="button" className={showFilters ? "toolbar-chip active" : "toolbar-chip"} onClick={() => setShowFilters((value) => !value)}>
            <SlidersHorizontal size={14} />
            Filter
          </button>
          <label className="toolbar-chip">
            Sort
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
              <option value="taskNumber">ID</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="progress">Progress</option>
            </select>
          </label>
          <div className="task-list-search">
            <Search size={16} />
            <input type="search" placeholder="Search tasks…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </div>
          <span className="task-list-group-label">Group by: None</span>
          <button type="button" className="toolbar-chip"><Download size={14} /> Export</button>
          <div className="task-list-view-toggle">
            <button type="button" className="active" aria-label="List view"><List size={16} /></button>
            <button type="button" aria-label="Grid view"><LayoutGrid size={16} /></button>
          </div>
          {canManage && selectedIds.size > 0 && (
            <button type="button" className="danger-button" onClick={handleBulkDelete}>
              Delete ({selectedIds.size})
            </button>
          )}
          {canManage && (
            <button type="button" className="primary-button task-list-add" onClick={handleCreateTask}>
              <Plus size={16} />
              Add Task
            </button>
          )}
        </div>

        {error && <p className="login-error" role="alert">{error}</p>}

        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={pagedTasks.length > 0 && pagedTasks.every((task) => selectedIds.has(task.id))}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                    aria-label="Select all tasks on page"
                  />
                </th>
                <th><button type="button" className="table-sort" onClick={() => toggleSort("taskNumber")}>ID</button></th>
                <th><button type="button" className="table-sort" onClick={() => toggleSort("title")}>Task Title</button></th>
                <th><button type="button" className="table-sort" onClick={() => toggleSort("assigneeName")}>Assignee</button></th>
                <th><button type="button" className="table-sort" onClick={() => toggleSort("status")}>Status</button></th>
                <th><button type="button" className="table-sort" onClick={() => toggleSort("priority")}>Priority</button></th>
                <th><button type="button" className="table-sort" onClick={() => toggleSort("dueDate")}>Due Date</button></th>
                <th><button type="button" className="table-sort" onClick={() => toggleSort("sprint")}>Sprint</button></th>
                <th><button type="button" className="table-sort" onClick={() => toggleSort("progress")}>Progress</button></th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {pagedTasks.map((task) => (
                <tr key={task.id} className={selectedTask?.id === task.id ? "selected" : ""}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(task.id)}
                      onChange={() => toggleSelect(task.id)}
                      aria-label={`Select ${task.title}`}
                    />
                  </td>
                  <td><button type="button" className="task-id-link" onClick={() => openTaskDetail(task)}>{task.taskNumber}</button></td>
                  <td><button type="button" className="task-title-link" onClick={() => openTaskDetail(task)}>{task.title}</button></td>
                  <td>
                    <div className="task-assignee-cell">
                      <span className="kanban-avatar">{task.assigneeName.slice(0, 1)}</span>
                      {task.assigneeName}
                    </div>
                  </td>
                  <td><span className={`status-pill compact status-${statusClass(task.status)}`}>{task.status}</span></td>
                  <td>
                    <span className={`task-priority-label priority-${task.priority.toLowerCase()}`}>
                      <PriorityIcon priority={task.priority} />
                      {task.priority}
                    </span>
                  </td>
                  <td>{formatDueDate(task.dueDate)}</td>
                  <td>{task.sprint || "—"}</td>
                  <td>
                    <div className="task-progress-cell">
                      <div className="progress-track"><div className="progress-bar" style={{ width: `${task.progress}%` }} /></div>
                      <span>{task.progress}%</span>
                    </div>
                  </td>
                  <td><button type="button" className="icon-button" aria-label="Task actions"><MoreHorizontal size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="task-list-pagination">
          <span>Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedTasks.length)} of {sortedTasks.length} tasks</span>
          <div className="pagination-controls">
            <button type="button" className="secondary-button" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={pageNumber === currentPage ? "page-button active" : "page-button"}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button type="button" className="secondary-button" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
              {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size} / page</option>)}
            </select>
          </div>
        </div>
      </div>

      {showFilters && (
        <aside className="task-filter-panel">
          <h3>Filters</h3>
          <label>
            Search
            <input type="search" placeholder="Title or ID" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <label>
            Status
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
              {["All", "To Do", "In Progress", "In Review", "Done"].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Priority
            <select value={filterPriority} onChange={(event) => setFilterPriority(event.target.value)}>
              {["All", "High", "Medium", "Low"].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Assignee
            <select value={filterAssignee} onChange={(event) => setFilterAssignee(event.target.value)}>
              <option value="All">All</option>
              {assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}
            </select>
          </label>
          <label>
            Sprint
            <select value={filterSprint} onChange={(event) => setFilterSprint(event.target.value)}>
              <option value="All">All</option>
              {sprints.map((sprint) => <option key={sprint} value={sprint}>{sprint}</option>)}
            </select>
          </label>
          <label>
            Tags
            <select value={filterTag} onChange={(event) => setFilterTag(event.target.value)}>
              <option value="All">All</option>
              {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          </label>
          <div className="task-filter-dates">
            <label>
              From
              <input type="date" value={dueFrom} onChange={(event) => setDueFrom(event.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={dueTo} onChange={(event) => setDueTo(event.target.value)} />
            </label>
          </div>
          <button type="button" className="primary-button" onClick={() => setPage(1)}>Apply Filters</button>
          <button type="button" className="text-button" onClick={clearFilters}>Clear All</button>
          <button type="button" className="secondary-button save-view-button">Save as View</button>
        </aside>
      )}

      {selectedTask && (
        <TaskDetailSidebar
          task={selectedTask}
          workspace={workspace}
          canManage={canManage}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onMove={moveTask}
          onOpenFullDetail={() => onOpenTaskDetail?.(selectedTask.id, sortedTasks.map((item) => item.id))}
        />
      )}
    </div>
  );
}
