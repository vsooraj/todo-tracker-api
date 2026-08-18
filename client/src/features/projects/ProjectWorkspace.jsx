import React, { useMemo, useState } from "react";
import { ArrowLeft, LayoutGrid, LineChart, List, Plus } from "lucide-react";
import ProjectKanbanView from "./ProjectKanbanView";
import ProjectTaskListView from "./ProjectTaskListView";
import TaskDetailPage from "../tasks/TaskDetailPage";
import ProjectAnalytics from "../../components/ProjectAnalytics";
import ProjectCalendar from "../../components/ProjectCalendar";
import ProjectForm from "../../components/ProjectForm";
import ProjectMemberAssignment from "../../components/ProjectMemberAssignment";
import TaskForm from "../../components/TaskForm";
import {
  createTask,
  getProjectAnalytics,
  getProjectCalendar,
  updateProject,
} from "../../services/api";

const TABS = [
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
  { id: "overview", label: "Overview", icon: LineChart },
];

export default function ProjectWorkspace({
  workspace,
  project,
  currentUserId,
  isAdmin,
  onBack,
  onUpdated,
  onArchived,
}) {
  const [activeTab, setActiveTab] = useState("board");
  const [detailTaskId, setDetailTaskId] = useState("");
  const [siblingTaskIds, setSiblingTaskIds] = useState([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState("");

  const canManageProject = useMemo(
    () => isAdmin || project.projectLeadId === currentUserId,
    [isAdmin, project.projectLeadId, currentUserId]
  );

  async function loadOverview() {
    setOverviewLoading(true);
    try {
      const now = new Date();
      const [analyticsData, calendarData] = await Promise.all([
        getProjectAnalytics(project.id),
        getProjectCalendar(project.id, now.getFullYear(), now.getMonth() + 1),
      ]);
      setAnalytics(analyticsData);
      setCalendar(calendarData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setOverviewLoading(false);
    }
  }

  function handleTabChange(tabId) {
    setActiveTab(tabId);
    if (tabId === "overview" && !analytics) loadOverview();
  }

  async function handleUpdate(payload) {
    const updated = await updateProject(project.id, payload);
    onUpdated(updated);
    setShowEditForm(false);
  }

  async function handleArchive() {
    await updateProject(project.id, { archived: true, status: "Completed" });
    onArchived(project.id);
  }

  function handleOpenTaskDetail(taskId, taskIds = []) {
    setDetailTaskId(taskId);
    setSiblingTaskIds(taskIds.length ? taskIds : [taskId]);
  }

  async function handleCreateTask(payload) {
    const task = await createTask(project.id, payload);
    setShowCreateTask(false);
    handleOpenTaskDetail(task.id, [task.id]);
  }

  if (detailTaskId) {
    return (
      <TaskDetailPage
        taskId={detailTaskId}
        project={project}
        workspace={workspace}
        currentUserId={currentUserId}
        canManage={canManageProject}
        siblingTaskIds={siblingTaskIds}
        onBack={() => setDetailTaskId("")}
        onNavigateTask={setDetailTaskId}
      />
    );
  }

  return (
    <section className="project-workspace">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to all projects
      </button>

      <div className="project-workspace-header">
        <div>
          <p className="project-breadcrumb">Projects &gt; {project.name}</p>
          <div className="project-workspace-title">
            <h1>{project.name}</h1>
            <span className={`status-pill status-${project.status.toLowerCase()}`}>{project.status}</span>
          </div>
        </div>
        {canManageProject && activeTab === "overview" && (
          <div className="project-detail-actions">
            <button type="button" className="secondary-button" onClick={() => setShowEditForm((value) => !value)}>
              {showEditForm ? "Close edit" : "Edit project"}
            </button>
            <button type="button" className="danger-button" onClick={handleArchive}>Archive</button>
          </div>
        )}
        {canManageProject && activeTab !== "overview" && (
          <button type="button" className="primary-button" onClick={() => setShowCreateTask(true)}>
            <Plus size={16} />
            New Task
          </button>
        )}
      </div>

      <div className="project-workspace-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? "project-tab active" : "project-tab"}
            onClick={() => handleTabChange(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {error && <p className="login-error" role="alert">{error}</p>}

      {showCreateTask && (
        <div className="task-form-modal">
          <TaskForm
            project={project}
            workspace={workspace}
            currentUserId={currentUserId}
            onSubmit={handleCreateTask}
            onCancel={() => setShowCreateTask(false)}
          />
        </div>
      )}

      {activeTab === "board" && (
        <ProjectKanbanView
          project={project}
          workspace={workspace}
          currentUserId={currentUserId}
          canManage={canManageProject}
          onOpenTaskDetail={handleOpenTaskDetail}
        />
      )}

      {activeTab === "list" && (
        <ProjectTaskListView
          project={project}
          workspace={workspace}
          currentUserId={currentUserId}
          canManage={canManageProject}
          onOpenTaskDetail={handleOpenTaskDetail}
        />
      )}

      {activeTab === "overview" && (
        <div className="project-overview-tab">
          <div className="project-detail-grid">
            <div className="project-detail-card"><span>Lead</span><strong>{project.projectLeadName}</strong></div>
            <div className="project-detail-card"><span>Priority</span><strong>{project.priority}</strong></div>
            <div className="project-detail-card"><span>Progress</span><strong>{project.progress}%</strong></div>
            <div className="project-detail-card"><span>Tasks</span><strong>{project.taskCount}</strong></div>
          </div>

          {showEditForm && canManageProject && (
            <ProjectForm initialValues={project} onSubmit={handleUpdate} onCancel={() => setShowEditForm(false)} />
          )}

          {canManageProject && (
            <ProjectMemberAssignment project={project} workspace={workspace} onMemberAdded={onUpdated} />
          )}

          {overviewLoading ? (
            <p>Loading project insights…</p>
          ) : (
            <>
              <ProjectAnalytics analytics={analytics} />
              {calendar && <ProjectCalendar calendar={calendar} />}
            </>
          )}
        </div>
      )}
    </section>
  );
}
