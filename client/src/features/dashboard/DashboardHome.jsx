import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, FolderKanban, ListTodo, Users } from "lucide-react";
import { getDashboard } from "../../services/api";

function StatCard({ label, value, subtext, icon: Icon, tone = "default" }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-card-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <small>{subtext}</small>
    </div>
  );
}

function DonutChart({ items }) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1;
  const colors = {
    "To Do": "#7c5cff",
    "In Progress": "#3b82f6",
    Done: "#22c997",
    Overdue: "#f59e0b",
  };

  let offset = 0;
  const segments = items.map((item) => {
    const percent = (item.count / total) * 100;
    const segment = `${colors[item.label] || "#ccc"} ${offset}% ${offset + percent}%`;
    offset += percent;
    return segment;
  });

  return (
    <div className="donut-chart-wrap">
      <div className="donut-chart" style={{ background: segments.length ? `conic-gradient(${segments.join(", ")})` : "#ece8fb" }}>
        <div className="donut-center">
          <strong>{total}</strong>
          <span>Total Tasks</span>
        </div>
      </div>
      <ul className="donut-legend">
        {items.map((item) => (
          <li key={item.label}>
            <span className="legend-dot" style={{ background: colors[item.label] || "#ccc" }} />
            <span>{item.label}</span>
            <strong>{item.count} ({item.percentage}%)</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatRelativeTime(value) {
  if (!value) return "Recently";
  const diffMs = Date.now() - new Date(value).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function DashboardHome({ workspace, currentUserId, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      if (!workspace?.id) return;
      setLoading(true);
      setError("");
      try {
        const dashboard = await getDashboard(workspace.id);
        setData(dashboard);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [workspace?.id]);

  if (loading) return <p className="dashboard-loading">Loading workspace overview…</p>;
  if (error) return <p className="dashboard-error" role="alert">{error}</p>;
  if (!data) return null;

  return (
    <div className="dashboard-home">
      <section className="stats-grid">
        <StatCard
          label="Total Projects"
          value={data.stats.totalProjects}
          subtext={`${data.stats.planningProjects} in Planning`}
          icon={FolderKanban}
        />
        <StatCard
          label="Active Tasks"
          value={data.stats.activeTasks}
          subtext={`${data.stats.inProgressTasks} In Progress`}
          icon={ListTodo}
          tone="blue"
        />
        <StatCard
          label="Completed Projects"
          value={data.stats.completedProjects}
          subtext={`${data.stats.completedPercentage}% Completed`}
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="Overdue Tasks"
          value={data.stats.overdueTasks}
          subtext="Needs attention"
          icon={AlertTriangle}
          tone="orange"
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel-card span-2">
          <div className="panel-header">
            <h2>Project Overview</h2>
            <button type="button" className="text-button" onClick={() => onNavigate("projects")}>View All</button>
          </div>
          {data.projects.length === 0 ? (
            <p className="panel-empty">No projects yet. Create your first project to get started.</p>
          ) : (
            <div className="project-overview-list">
              {data.projects.map((project) => (
                <div key={project.id} className="project-overview-item">
                  <div className="project-overview-top">
                    <strong>{project.name}</strong>
                    <span className={`status-pill status-${project.status.toLowerCase()}`}>{project.status}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: `${project.progress}%` }} />
                  </div>
                  <div className="project-overview-meta">
                    <span>{project.progress}%</span>
                    <span>Due: {formatDate(project.endDate)}</span>
                    <span><Users size={14} /> {project.memberCount} Members</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h2>Tasks by Status</h2>
          </div>
          <DonutChart items={data.taskStatusBreakdown} />
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h2>My Tasks</h2>
            <button type="button" className="text-button" onClick={() => onNavigate("tasks")}>View All</button>
          </div>
          {data.myTasks.length === 0 ? (
            <p className="panel-empty">No tasks assigned to you yet.</p>
          ) : (
            <ul className="task-list">
              {data.myTasks.map((task) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.projectName}</span>
                  </div>
                  <span className={`status-pill compact status-${task.status.toLowerCase().replace(" ", "-")}`}>{task.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h2>Overdue Tasks</h2>
          </div>
          {data.overdueTasks.length === 0 ? (
            <p className="panel-empty">No overdue tasks. You're all caught up.</p>
          ) : (
            <ul className="task-list overdue">
              {data.overdueTasks.map((task) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.projectName}</span>
                  </div>
                  <span className="overdue-date">Due {formatDate(task.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel-card span-2">
          <div className="panel-header">
            <h2>Recent Activity</h2>
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="panel-empty">Activity will appear here as your team works.</p>
          ) : (
            <ul className="activity-list">
              {data.recentActivity.map((item) => (
                <li key={item.id}>
                  <span className="activity-dot" />
                  <div>
                    <p>{item.message}</p>
                    <small>{formatRelativeTime(item.timestamp)}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
