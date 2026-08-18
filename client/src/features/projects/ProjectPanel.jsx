import React, { useEffect, useMemo, useState } from "react";
import ProjectAnalytics from "../../components/ProjectAnalytics";
import ProjectCalendar from "../../components/ProjectCalendar";
import ProjectForm from "../../components/ProjectForm";
import ProjectMemberAssignment from "../../components/ProjectMemberAssignment";
import {
  createProject,
  getProjectAnalytics,
  getProjectCalendar,
  getProjects,
  updateProject,
} from "../../services/api";

export default function ProjectPanel({ workspace, currentUserId }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const isAdmin = useMemo(
    () => workspace?.members?.some((member) => member.userId === currentUserId && member.role === "Admin"),
    [workspace, currentUserId]
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const canManageProject = useMemo(() => {
    if (!selectedProject) return false;
    return isAdmin || selectedProject.projectLeadId === currentUserId;
  }, [selectedProject, isAdmin, currentUserId]);

  useEffect(() => {
    async function loadProjects() {
      if (!workspace?.id) return;
      setLoading(true);
      setError("");
      try {
        const items = await getProjects(workspace.id);
        setProjects(items);
        if (items.length > 0) {
          setSelectedProjectId((current) => current || items[0].id);
        } else {
          setSelectedProjectId("");
        }
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [workspace?.id]);

  useEffect(() => {
    async function loadProjectInsights() {
      if (!selectedProjectId) {
        setAnalytics(null);
        setCalendar(null);
        return;
      }

      setDetailLoading(true);
      try {
        const now = new Date();
        const [analyticsData, calendarData] = await Promise.all([
          getProjectAnalytics(selectedProjectId),
          getProjectCalendar(selectedProjectId, now.getFullYear(), now.getMonth() + 1),
        ]);
        setAnalytics(analyticsData);
        setCalendar(calendarData);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setDetailLoading(false);
      }
    }

    loadProjectInsights();
  }, [selectedProjectId]);

  async function handleCreate(payload) {
    const project = await createProject(payload);
    setProjects((items) => [project, ...items]);
    setSelectedProjectId(project.id);
    setShowCreateForm(false);
  }

  async function handleUpdate(payload) {
    const project = await updateProject(selectedProjectId, payload);
    setProjects((items) => items.map((item) => (item.id === project.id ? project : item)));
    setShowEditForm(false);
  }

  async function handleArchive() {
    const project = await updateProject(selectedProjectId, { archived: true, status: "Completed" });
    setProjects((items) => items.filter((item) => item.id !== project.id));
    setSelectedProjectId("");
    setShowEditForm(false);
  }

  function handleMemberAdded(project) {
    setProjects((items) => items.map((item) => (item.id === project.id ? project : item)));
  }

  if (!workspace) return null;

  return (
    <section className="project-panel">
      <div className="project-panel-header">
        <div>
          <p className="eyebrow">Projects</p>
          <h2>Project lifecycle</h2>
          <p className="workspace-copy">Create initiatives, assign team members, and track progress.</p>
        </div>
        {isAdmin && (
          <button type="button" className="secondary-button" onClick={() => setShowCreateForm((value) => !value)}>
            {showCreateForm ? "Close form" : "New project"}
          </button>
        )}
      </div>

      {error && <p className="login-error" role="alert">{error}</p>}

      {showCreateForm && isAdmin && (
        <ProjectForm workspaceId={workspace.id} onSubmit={handleCreate} onCancel={() => setShowCreateForm(false)} />
      )}

      {loading ? (
        <p>Loading projects…</p>
      ) : projects.length === 0 ? (
        <div className="project-empty-state">
          <p>No projects yet. {isAdmin ? "Create the first project for this workspace." : "Ask a workspace admin to create one."}</p>
        </div>
      ) : (
        <>
          <div className="project-list">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                className={project.id === selectedProjectId ? "project-card active" : "project-card"}
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setShowEditForm(false);
                }}
              >
                <div className="project-card-top">
                  <strong>{project.name}</strong>
                  <span className={`project-pill priority-${project.priority.toLowerCase()}`}>{project.priority}</span>
                </div>
                <p>{project.description || "No description"}</p>
                <div className="project-card-meta">
                  <span className={`project-pill status-${project.status.toLowerCase()}`}>{project.status}</span>
                  <span>{project.progress}% complete</span>
                  <span>{project.members.length} members</span>
                </div>
              </button>
            ))}
          </div>

          {selectedProject && (
            <div className="project-detail">
              <div className="project-detail-header">
                <div>
                  <h3>{selectedProject.name}</h3>
                  <p>{selectedProject.description || "No description provided."}</p>
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

              <div className="project-detail-grid">
                <div className="project-detail-card">
                  <span>Status</span>
                  <strong>{selectedProject.status}</strong>
                </div>
                <div className="project-detail-card">
                  <span>Priority</span>
                  <strong>{selectedProject.priority}</strong>
                </div>
                <div className="project-detail-card">
                  <span>Progress</span>
                  <strong>{selectedProject.progress}%</strong>
                </div>
                <div className="project-detail-card">
                  <span>Timeline</span>
                  <strong>
                    {selectedProject.startDate || "—"} → {selectedProject.endDate || "—"}
                  </strong>
                </div>
              </div>

              {showEditForm && canManageProject && (
                <ProjectForm
                  initialValues={selectedProject}
                  onSubmit={handleUpdate}
                  onCancel={() => setShowEditForm(false)}
                />
              )}

              {canManageProject && (
                <ProjectMemberAssignment
                  project={selectedProject}
                  workspace={workspace}
                  onMemberAdded={handleMemberAdded}
                />
              )}

              <div className="project-members-list">
                <h4>Team ({selectedProject.members.length})</h4>
                <ul>
                  {selectedProject.members.map((member) => (
                    <li key={member.userId}>
                      <span>{member.userId}</span>
                      <span className="project-pill">{member.role}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {detailLoading ? (
                <p>Loading project insights…</p>
              ) : (
                <>
                  <ProjectAnalytics analytics={analytics} />
                  {calendar && <ProjectCalendar calendar={calendar} />}
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
