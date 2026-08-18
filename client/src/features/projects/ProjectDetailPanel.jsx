import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import ProjectAnalytics from "../../components/ProjectAnalytics";
import ProjectCalendar from "../../components/ProjectCalendar";
import ProjectForm from "../../components/ProjectForm";
import ProjectMemberAssignment from "../../components/ProjectMemberAssignment";
import {
  getProjectAnalytics,
  getProjectCalendar,
  updateProject,
} from "../../services/api";

export default function ProjectDetailPanel({
  workspace,
  project,
  currentUserId,
  isAdmin,
  onBack,
  onUpdated,
  onArchived,
}) {
  const [analytics, setAnalytics] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState("");

  const canManageProject = useMemo(
    () => isAdmin || project.projectLeadId === currentUserId,
    [isAdmin, project.projectLeadId, currentUserId]
  );

  useEffect(() => {
    async function loadInsights() {
      setDetailLoading(true);
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
        setDetailLoading(false);
      }
    }

    loadInsights();
  }, [project.id]);

  async function handleUpdate(payload) {
    const updated = await updateProject(project.id, payload);
    onUpdated(updated);
    setShowEditForm(false);
  }

  async function handleArchive() {
    await updateProject(project.id, { archived: true, status: "Completed" });
    onArchived(project.id);
  }

  return (
    <section className="project-detail-page">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to all projects
      </button>

      <div className="project-detail-header">
        <div>
          <span className={`status-pill status-${project.status.toLowerCase()}`}>{project.status}</span>
          <h1>{project.name}</h1>
          <p>{project.description || "No description provided."}</p>
        </div>
        {canManageProject && (
          <div className="project-detail-actions">
            <button type="button" className="secondary-button" onClick={() => setShowEditForm((value) => !value)}>
              {showEditForm ? "Close edit" : "Edit project"}
            </button>
            <button type="button" className="danger-button" onClick={handleArchive}>Archive</button>
          </div>
        )}
      </div>

      {error && <p className="login-error" role="alert">{error}</p>}

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
        <ProjectMemberAssignment
          project={project}
          workspace={workspace}
          onMemberAdded={onUpdated}
        />
      )}

      {detailLoading ? (
        <p>Loading project insights…</p>
      ) : (
        <>
          <ProjectAnalytics analytics={analytics} />
          {calendar && <ProjectCalendar calendar={calendar} />}
        </>
      )}
    </section>
  );
}
