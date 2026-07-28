import { useEffect, useState } from "react";
import { api, type Dependant, type DependantInput } from "../api";
import { CustomerPanel } from "./CustomerPageHeader";

const RELATIONSHIP_OPTIONS: { value: string; label: string }[] = [
  { value: "spouse", label: "Spouse" },
  { value: "partner", label: "Partner" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "other", label: "Other" },
];

const EMPTY_FORM: DependantInput = {
  full_name: "",
  date_of_birth: "",
  relationship: "child",
};

function formatRelationship(value: string) {
  const match = RELATIONSHIP_OPTIONS.find((opt) => opt.value === value);
  if (match) return match.label;
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDob(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type DependantsPanelProps = {
  token: string;
};

export function DependantsPanel({ token }: DependantsPanelProps) {
  const [dependants, setDependants] = useState<Dependant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DependantInput>(EMPTY_FORM);

  async function loadDependants() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDependants(token);
      setDependants(res.dependants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dependants");
      setDependants([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDependants();
  }, [token]);

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  }

  function openEditForm(row: Dependant) {
    setEditingId(row.id);
    setForm({
      full_name: row.full_name,
      date_of_birth: row.date_of_birth,
      relationship: row.relationship,
    });
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function saveDependant() {
    const name = form.full_name.trim();
    if (!name) {
      setError("Full name is required");
      return;
    }
    if (!form.date_of_birth) {
      setError("Date of birth is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: DependantInput = {
        full_name: name,
        date_of_birth: form.date_of_birth,
        relationship: form.relationship,
      };
      if (editingId) {
        const updated = await api.updateDependant(token, editingId, payload);
        setDependants((rows) => rows.map((row) => (row.id === editingId ? updated : row)));
      } else {
        const created = await api.createDependant(token, payload);
        setDependants((rows) => [...rows, created]);
      }
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save dependant");
    } finally {
      setSaving(false);
    }
  }

  async function removeDependant(id: string) {
    if (!window.confirm("Remove this dependant from your profile?")) return;
    setSaving(true);
    setError(null);
    try {
      await api.deleteDependant(token, id);
      setDependants((rows) => rows.filter((row) => row.id !== id));
      if (editingId === id) {
        closeForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove dependant");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CustomerPanel
      title="Dependants"
      description="People covered on your policies, such as spouse or children"
    >
      {loading ? <p className="muted">Loading dependants…</p> : null}

      {!loading && dependants.length === 0 && !showForm ? (
        <p className="manage-notice" role="status">
          No dependants added yet. Add family members you want to cover on health or other policies.
        </p>
      ) : null}

      {!loading && dependants.length > 0 ? (
        <ul className="dependants-list">
          {dependants.map((row) => (
            <li key={row.id} className="dependants-list-item">
              <div className="dependants-list-main">
                <strong>{row.full_name}</strong>
                <span className="muted">
                  {formatRelationship(row.relationship)} · Born {formatDob(row.date_of_birth)}
                </span>
              </div>
              <div className="dependants-list-actions">
                <button
                  type="button"
                  className="btn-link"
                  disabled={saving}
                  onClick={() => openEditForm(row)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-link danger"
                  disabled={saving}
                  onClick={() => void removeDependant(row.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {showForm ? (
        <div className="dependants-form stack">
          <p className="options-label">
            {editingId ? "Edit dependant" : "Add dependant"}
          </p>
          <div className="field">
            <label>Full name</label>
            <input
              className="input"
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="e.g. Jane Smith"
            />
          </div>
          <div className="field">
            <label>Date of birth</label>
            <input
              className="input"
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm((prev) => ({ ...prev, date_of_birth: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Relationship</label>
            <select
              className="input"
              value={form.relationship}
              onChange={(e) => setForm((prev) => ({ ...prev, relationship: e.target.value }))}
            >
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="dependants-form-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={saving}
              onClick={() => void saveDependant()}
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add dependant"}
            </button>
            <button type="button" className="btn-secondary" disabled={saving} onClick={closeForm}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn-primary" disabled={loading || saving} onClick={openAddForm}>
          Add dependant
        </button>
      )}

      {error ? (
        <p className="error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      ) : null}
    </CustomerPanel>
  );
}
