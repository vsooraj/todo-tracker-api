import React, { useEffect, useState } from "react";
import { inviteUserToWorkspace, getWorkspaceInvitations } from "../services/api";

export default function MemberInvitations({ workspace, currentUserId, onInvitationAdded }) {
  const [invitations, setInvitations] = useState([]);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if current user is admin
    const userMember = workspace?.members?.find((m) => m.userId === currentUserId);
    setIsAdmin(userMember?.role === "Admin");

    // Load pending invitations
    async function loadInvitations() {
      try {
        const data = await getWorkspaceInvitations(workspace.id);
        setInvitations(data || []);
      } catch (err) {
        console.error("Error loading invitations:", err.message);
      }
    }

    if (workspace?.id) {
      loadInvitations();
    }
  }, [workspace, currentUserId]);

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteeEmail.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const invitation = await inviteUserToWorkspace(workspace.id, inviteeEmail);
      setInvitations((prev) => [...prev, invitation]);
      setInviteeEmail("");
      if (onInvitationAdded) {
        onInvitationAdded(invitation);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return null;
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");

  return (
    <div className="member-invitations-panel">
      <div className="invitations-header">
        <h3>Manage Members</h3>
        <p className="invitations-copy">Invite team members to join this workspace.</p>
      </div>

      <form className="invite-form" onSubmit={handleInvite}>
        <div className="form-group">
          <label htmlFor="invitee-email">Email address</label>
          <div className="input-group">
            <input
              id="invitee-email"
              type="email"
              placeholder="teammate@example.com"
              value={inviteeEmail}
              onChange={(e) => setInviteeEmail(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Invite"}
            </button>
          </div>
        </div>
        {error && <p className="invite-error" role="alert">{error}</p>}
      </form>

      {pendingInvitations.length > 0 && (
        <div className="pending-invitations">
          <h4>Pending Invitations</h4>
          <ul className="invitations-list">
            {pendingInvitations.map((invitation) => (
              <li key={invitation.id} className="invitation-item">
                <div className="invitation-content">
                  <span className="invitation-email">{invitation.inviteeEmail}</span>
                  <span className="invitation-status">Pending</span>
                </div>
                <span className="invitation-date">
                  {new Date(invitation.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
