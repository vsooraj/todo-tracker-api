import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  HelpCircle,
  LayoutDashboard,
  ListTodo,
  Moon,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import MemberInvitations from "../../components/MemberInvitations";
import WorkspaceSwitcher from "../../components/WorkspaceSwitcher";
import ProjectListingView from "../projects/ProjectListingView";
import MyTasksView from "../tasks/MyTasksView";
import TodoView from "../todos/TodoView";
import DashboardHome from "./DashboardHome";
import { getProjects } from "../../services/api";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: CheckSquare },
  { id: "team", label: "Team", icon: Users },
  { id: "tasks", label: "My Tasks", icon: CheckSquare },
  { id: "todos", label: "Todos", icon: ListTodo },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const footerItems = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function DashboardApp({
  workspaces,
  activeWorkspace,
  onSwitchWorkspace,
  onCreateOrganisation,
  onSignOut,
}) {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarProjects, setSidebarProjects] = useState([]);
  const [error, setError] = useState("");
  const currentUserId = sessionStorage.getItem("user-id") || "local-demo-user";
  const currentUserName = sessionStorage.getItem("user-name") || "Demo User";

  useEffect(() => {
    async function loadSidebarProjects() {
      if (!activeWorkspace?.id) return;
      try {
        const items = await getProjects(activeWorkspace.id);
        setSidebarProjects(items.slice(0, 5));
      } catch {
        setSidebarProjects([]);
      }
    }

    loadSidebarProjects();
  }, [activeWorkspace?.id]);

  function renderContent() {
    if (!activeWorkspace) return <div className="dashboard-error">No active workspace selected.</div>;

    if (activeView === "dashboard") {
      return <DashboardHome workspace={activeWorkspace} currentUserId={currentUserId} onNavigate={setActiveView} />;
    }
    if (activeView === "projects") {
      return (
        <ProjectListingView
          workspace={activeWorkspace}
          currentUserId={currentUserId}
          onProjectsLoaded={setSidebarProjects}
        />
      );
    }
    if (activeView === "team") {
      return <MemberInvitations workspace={activeWorkspace} currentUserId={currentUserId} />;
    }
    if (activeView === "tasks") {
      return (
        <MyTasksView
          workspace={activeWorkspace}
          onOpenTask={() => setActiveView("projects")}
        />
      );
    }
    if (activeView === "todos") {
      return <TodoView />;
    }

    return (
      <div className="dashboard-placeholder">
        <h2>{navItems.find((item) => item.id === activeView)?.label || "Coming soon"}</h2>
        <p>This section is coming soon. Use Dashboard or Projects for now.</p>
        <button type="button" className="primary-button" onClick={() => setActiveView("dashboard")}>Back to dashboard</button>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">K</span>
          <span>Kairos</span>
        </div>

        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          onSwitch={onSwitchWorkspace}
          onCreateClick={onCreateOrganisation}
        />

        <nav className="sidebar-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={activeView === id ? "sidebar-link active" : "sidebar-link"}
              onClick={() => setActiveView(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-projects">
          <div className="sidebar-section-label">Projects</div>
          {sidebarProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              className="sidebar-project-link"
              onClick={() => setActiveView("projects")}
            >
              <span className="sidebar-project-dot" style={{ background: project.accentColor }} />
              <span>{project.name}</span>
            </button>
          ))}
          <button type="button" className="sidebar-link subtle" onClick={() => setActiveView("projects")}>
            <Plus size={16} />
            <span>Add Project</span>
          </button>
        </div>

        <div className="sidebar-footer-nav">
          {footerItems.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className="sidebar-link subtle" onClick={() => setActiveView(id)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            onSwitch={onSwitchWorkspace}
            onCreateClick={onCreateOrganisation}
          />
          <div className="header-search">
            <Search size={18} />
            <input type="search" placeholder="Search projects, tasks, or team members…" />
          </div>
          <div className="header-actions">
            <button type="button" className="icon-button" aria-label="Toggle theme"><Moon size={18} /></button>
            <button type="button" className="icon-button badge-button" aria-label="Notifications">
              <Bell size={18} />
              <span>3</span>
            </button>
            <button type="button" className="icon-button" aria-label="Help"><HelpCircle size={18} /></button>
            <div className="header-profile">
              <div className="profile-avatar">{currentUserName.slice(0, 1)}</div>
              <div>
                <strong>{currentUserName}</strong>
                <small>{activeWorkspace?.members?.find((m) => m.userId === currentUserId)?.role || "Member"}</small>
              </div>
            </div>
            <button type="button" className="text-button" onClick={onSignOut}>Sign out</button>
          </div>
        </header>

        <main className="dashboard-content">
          {activeView === "dashboard" && activeWorkspace && (
            <div className="dashboard-title-row">
              <div>
                <p className="eyebrow">Overview</p>
                <h1>{activeWorkspace.name} Workspace</h1>
              </div>
              <button type="button" className="primary-button" onClick={() => setActiveView("projects")}>
                <Plus size={16} />
                New Project
              </button>
            </div>
          )}
          {error && <p className="dashboard-error" role="alert">{error}</p>}
          {renderContent()}
        </main>

        {activeWorkspace && (
          <footer className="dashboard-footer">
            <span>{activeWorkspace.name}</span>
            <span>{activeWorkspace.members?.find((m) => m.userId === currentUserId)?.role || "Member"}</span>
            <span>{activeWorkspace.memberCount || activeWorkspace.members?.length || 0} workspace members</span>
          </footer>
        )}
      </div>
    </div>
  );
}
