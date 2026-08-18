import React, { useEffect, useMemo, useState } from "react";
import { Check, CloudUpload, X } from "lucide-react";
import WorkspacePreview from "./WorkspacePreview";
import { createWorkspace, getSlugAvailability } from "../services/api";

const WORKSPACE_DOMAIN = import.meta.env.VITE_WORKSPACE_DOMAIN || "kairos.app";

function makeSlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CreateOrganisationModal({ open, onClose, onCreated, required = false }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoMeta, setLogoMeta] = useState(null);
  const [slugStatus, setSlugStatus] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slugTouched) setSlug(makeSlug(name));
  }, [name, slugTouched]);

  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus(null);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const result = await getSlugAvailability(slug);
        setSlugStatus(result);
      } catch {
        setSlugStatus({ available: false, reason: "Unable to validate slug." });
      } finally {
        setCheckingSlug(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slug]);

  const previewWorkspace = useMemo(() => ({
    name: name || "Organisation name",
    slug: slug || "my-org",
    logoUrl,
    workspaceUrl: `${slug || "my-org"}.${WORKSPACE_DOMAIN}`,
    status: "Active",
    projectCount: 0,
    memberCount: 1,
  }), [name, slug, logoUrl]);

  function handleLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Logo must be 10MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result);
      setLogoMeta({ name: file.name, size: file.size });
      setError("");
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogoUrl(null);
    setLogoMeta(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const workspace = await createWorkspace({ name, slug, logoUrl });
      onCreated(workspace);
      setName("");
      setSlug("");
      setSlugTouched(false);
      setLogoUrl(null);
      setLogoMeta(null);
      if (!required) onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="org-modal-backdrop" role="presentation" onClick={required ? undefined : onClose}>
      <div className="org-modal" role="dialog" aria-modal="true" aria-labelledby="create-org-title" onClick={(event) => event.stopPropagation()}>
        <div className="org-modal-header">
          <h2 id="create-org-title">Create Organisation</h2>
          {!required && (
            <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        <form className="org-modal-form" onSubmit={handleSubmit}>
          <div className="org-form-grid">
            <div className="org-form-fields">
              <label className="org-field">
                <span>Logo</span>
                <div className="logo-upload-box">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} hidden id="org-logo-input" />
                  <label htmlFor="org-logo-input" className="logo-upload-trigger">
                    <CloudUpload size={22} />
                    <span>Upload</span>
                  </label>
                  <small>Recommended size 1:1, up to 10MB. JPG, PNG or WEBP.</small>
                </div>
                {logoMeta && (
                  <div className="logo-file-row">
                    {logoUrl && <img src={logoUrl} alt="" className="logo-file-thumb" />}
                    <div>
                      <strong>{logoMeta.name}</strong>
                      <small>{Math.round(logoMeta.size / 1024)} KB</small>
                    </div>
                    <button type="button" className="danger-text-button" onClick={removeLogo}>Remove</button>
                  </div>
                )}
              </label>

              <label className="org-field">
                <span>Organisation Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter organisation name" maxLength="100" required />
                <small>This will be shown to your team members.</small>
              </label>

              <label className="org-field">
                <span>Slug</span>
                <div className="slug-input-row">
                  <input
                    value={slug}
                    onChange={(event) => { setSlug(event.target.value.toLowerCase()); setSlugTouched(true); }}
                    placeholder="my-org"
                    required
                  />
                  <span className="slug-suffix">.{WORKSPACE_DOMAIN}</span>
                </div>
                <small>This will be used in your workspace URL.</small>
                {checkingSlug && <p className="slug-feedback checking">Checking availability…</p>}
                {!checkingSlug && slugStatus?.available && (
                  <p className="slug-feedback available"><Check size={14} /> Slug is available</p>
                )}
                {!checkingSlug && slugStatus && !slugStatus.available && (
                  <p className="slug-feedback unavailable">{slugStatus.reason}</p>
                )}
              </label>
            </div>

            <WorkspacePreview workspace={previewWorkspace} />
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <div className="org-modal-actions">
            {!required && <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>}
            <button type="submit" className="primary-button" disabled={submitting || checkingSlug || (slugStatus && !slugStatus.available)}>
              {submitting ? "Creating…" : "Create Organisation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
