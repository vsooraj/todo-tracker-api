import React from "react";
import { CheckCircle2, LockKeyhole } from "lucide-react";

export default function LoginIllustration() {
  return (
    <aside className="illustration-panel" aria-hidden="true">
      <div className="orb orb-large" /><div className="orb orb-small" /><div className="dot-grid" />
      <div className="security-card"><LockKeyhole size={48} strokeWidth={1.75} /></div>
      <div className="chart-card"><div className="browser-dots"><i /><i /><i /></div><div className="chart-content"><div className="chart-copy"><span /><span /><span /></div><div className="donut" /><div className="bars"><i /><i /><i /><i /></div></div></div>
      <div className="check-card"><CheckCircle2 size={20} /><span /><CheckCircle2 size={20} /><span /></div>
      <div className="desk" /><div className="person"><div className="head" /><div className="hair" /><div className="body" /><div className="laptop"><span /></div><div className="leg leg-left" /><div className="leg leg-right" /></div>
      <div className="plant"><i /><i /><i /><b /></div><div className="plant plant-right"><i /><i /><i /><b /></div><div className="cup" />
    </aside>
  );
}
