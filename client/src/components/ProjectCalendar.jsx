import React, { useMemo } from "react";

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startOffset = firstDay.getDay();
  const days = [];

  for (let index = 0; index < startOffset; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push({ day, dateKey });
  }

  return days;
}

export default function ProjectCalendar({ calendar }) {
  if (!calendar) return <div className="project-calendar"><p className="analytics-empty">No calendar data available.</p></div>;

  const days = useMemo(
    () => buildCalendarDays(calendar.year, calendar.month),
    [calendar.year, calendar.month]
  );

  const monthLabel = new Date(calendar.year, calendar.month - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="project-calendar">
      <h4>{monthLabel}</h4>
      <div className="calendar-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((entry, index) => {
          if (!entry) return <div key={`empty-${index}`} className="calendar-cell empty" />;
          const tasks = calendar.tasksByDate[entry.dateKey] || [];
          return (
            <div key={entry.dateKey} className={tasks.length ? "calendar-cell has-tasks" : "calendar-cell"}>
              <span className="calendar-day">{entry.day}</span>
              {tasks.slice(0, 2).map((task) => (
                <span key={task.id} className="calendar-task" title={task.title}>{task.title}</span>
              ))}
              {tasks.length > 2 && <span className="calendar-more">+{tasks.length - 2} more</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
