import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckSquare,
  Grid3X3,
  LayoutList,
  Plus,
  Search,
  Users,
} from "lucide-react";
import ProjectWorkspace from "./ProjectWorkspace";
import ProjectForm from "../../components/ProjectForm";
import { createProject, getProjects } from "../../services/api";

const STATUS_OPTIONS = ["All", "Planning", "Active", "Completed"];
const PRIORITY_OPTIONS = ["All", "Low", "Medium", "High"];

function formatDueDate(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function ProjectCard({ project, onSelect, viewMode }) {
  const statusClass = project.status.toLowerCase().replace(/\s+/g, "-");

  return (
    <button
      type="button"
      className={viewMode === "list" ? "project-listing-card list" : "project-listing-card"}
      onClick={() => onSelect(project.id)}
    >
      <div className="project-listing-card-head">
        <div className="project-listing-icon" style={{ background: project.accentColor }}>
          {project.name.slice(0, 1)}
        </div>
        <div className="project-listing-title-wrap">
          <strong>{project.name}</strong>
          <span className={`status-pill status-${statusClass}`}>{project.status}</span>
        </div>
      </div>

      <p className="project-listing-description">{project.description || "No description provided."}</p>

      <div className="project-listing-lead">
        <span className="project-listing-avatar">{project.projectLeadName.slice(0, 1)}</span>
        <div>
          <strong>{project.projectLeadName}</strong>
          <small>{project.projectLeadRole}</small>
        </div>
      </div>

      <div className="project-listing-progress">
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${project.progress}%`, background: project.accentColor }} />
        </div>
        <span>{project.progress}%</span>
      </div>

      <div className="project-listing-stats">
        <span><Users size={14} /> {project.memberCount} Members</span>
        <span><CheckSquare size={14} /> {project.taskCount} Tasks</span>
        <span><Calendar size={14} /> Due {formatDueDate(project.endDate)}</span>
      </div>

      <div className={`project-listing-priority priority-${project.priority.toLowerCase()}`}>
        {project.priority} Priority
      </div>
    </button>
  );
}

export default function ProjectListingView({ workspace, currentUserId, onProjectsLoaded }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isAdmin = useMemo(
    () => workspace?.members?.some((member) => member.userId === currentUserId && member.role === "Admin"),
    [workspace, currentUserId]
  );

  const owners = useMemo(() => {
    const unique = new Map();
    projects.forEach((project) => {
      unique.set(project.projectLeadId, project.projectLeadName);
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = !search.trim()
        || project.name.toLowerCase().includes(search.toLowerCase())
        || (project.description || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || project.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || project.priority === priorityFilter;
      const matchesOwner = ownerFilter === "All" || project.projectLeadId === ownerFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesOwner;
    });
  }, [projects, search, statusFilter, priorityFilter, ownerFilter]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    async function loadProjects() {
      if (!workspace?.id) return;
      setLoading(true);
      setError("");
      try {
        const items = await getProjects(workspace.id);
        setProjects(items);
        if (onProjectsLoaded) onProjectsLoaded(items);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [workspace?.id]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setOwnerFilter("All");
  }

  async function handleCreate(payload) {
    const project = await createProject(payload);
    setProjects((items) => [project, ...items]);
    if (onProjectsLoaded) onProjectsLoaded([project, ...projects]);
    setShowCreateForm(false);
  }

  function handleProjectUpdated(project) {
    setProjects((items) => items.map((item) => (item.id === project.id ? project : item)));
  }

  function handleProjectArchived(projectId) {
    setProjects((items) => items.filter((item) => item.id !== projectId));
    setSelectedProjectId("");
  }

  if (selectedProject) {
    return (
      <ProjectWorkspace
        workspace={workspace}
        project={selectedProject}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onBack={() => setSelectedProjectId("")}
        onUpdated={handleProjectUpdated}
        onArchived={handleProjectArchived}
      />
    );
  }

  return (
    <section className="project-listing-page">
      <div className="project-listing-header">
        <div>
          <h1>All Projects</h1>
          <p>Manage and track all projects in your workspace.</p>
        </div>
        {isAdmin && (
          <button type="button" className="primary-button" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} />
            New Project
          </button>
        )}
      </div>

      <div className="project-listing-toolbar">
        <div className="project-listing-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search projects…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="project-listing-filters">
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option === "All" ? "All" : option}</option>)}
            </select>
          </label>
          <label>
            Priority
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              {PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{option === "All" ? "All" : option}</option>)}
            </select>
          </label>
          <label>
            Owner
            <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
              <option value="All">All</option>
              {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
            </select>
          </label>
          <button type="button" className="text-button" onClick={clearFilters}>Clear Filters</button>
        </div>
        <div className="project-listing-view-toggle">
          <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view">
            <Grid3X3 size={16} />
          </button>
          <button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} aria-label="List view">
            <LayoutList size={16} />
          </button>
        </div>
      </div>

      {error && <p className="login-error" role="alert">{error}</p>}

      {showCreateForm && isAdmin && (
        <div className="project-create-modal">
          <ProjectForm workspaceId={workspace.id} onSubmit={handleCreate} onCancel={() => setShowCreateForm(false)} />
        </div>
      )}

      {loading ? (
        <p className="dashboard-loading">Loading projects…</p>
      ) : filteredProjects.length === 0 ? (
        <div className="project-empty-state">
          <p>{projects.length === 0 ? "No projects yet. Create the first project for this workspace." : "No projects match your filters."}</p>
        </div>
      ) : (
        <>
          <div className={viewMode === "grid" ? "project-listing-grid" : "project-listing-grid list"}>
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onSelect={setSelectedProjectId} viewMode={viewMode} />
            ))}
          </div>
          <div className="project-listing-pagination">
            <span>Showing 1 to {filteredProjects.length} of {filteredProjects.length} projects</span>
          </div>
        </>
      )}
    </section>
  );
}
