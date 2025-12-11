import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const today = () => format(new Date(), "yyyy-MM-dd");

export default function App() {
  const [options, setOptions] = useState({ locations: [], clients: [] });
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    date: today(),
    fromLocation: "",
    toLocation: "",
    clientName: "",
    kilometers: "",
    rupees: 3,
  });

  useEffect(() => {
    loadData();
  }, [page]);

  async function loadData() {
    setError("");
    try {
      const [optRes, expRes] = await Promise.all([
        api.get("/options"),
        api.get("/expenses", { params: { page, limit: 10 } }),
      ]);
      setOptions(optRes.data || { locations: [], clients: [] });
      const data = expRes.data;
      if (data?.items) {
        setExpenses(data.items);
        setPages(data.pages || 1);
        setTotalCount(data.total || 0);
        setTotalSum(data.totalSum ?? data.items.reduce((s, e) => s + Number(e.total || 0), 0));
      } else {
        setExpenses(data || []);
        setPages(1);
        setTotalCount((data || []).length);
        setTotalSum((data || []).reduce((s, e) => s + Number(e.total || 0), 0));
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load data. Is the API running?");
    }
  }

  const total = useMemo(() => {
    const km = Number(form.kilometers || 0);
    const rate = Number(form.rupees || 0);
    return (km * rate).toFixed(2);
  }, [form.kilometers, form.rupees]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        kilometers: Number(form.kilometers),
        rupees: Number(form.rupees) || 3,
      };
      if (editId) {
        await api.put(`/expenses/${editId}`, payload);
      } else {
        await api.post("/expenses", payload);
      }
      await loadData();
      setForm((prev) => ({
        ...prev,
        fromLocation: "",
        toLocation: "",
        clientName: "",
        kilometers: "",
        rupees: prev.rupees || 3,
      }));
      setEditId(null);
    } catch (err) {
      console.error(err);
      setError("Could not save expense. Please check inputs.");
    } finally {
      setLoading(false);
    }
  }

  function onEdit(expense) {
    setEditId(expense._id);
    setForm({
      date: expense.date?.slice(0, 10) || today(),
      fromLocation: expense.fromLocation,
      toLocation: expense.toLocation,
      clientName: expense.clientName,
      kilometers: expense.kilometers,
      rupees: expense.rupees,
    });
  }

  async function onDelete(id) {
    const ok = window.confirm("Delete this expense?");
    if (!ok) return;
    try {
      await api.delete(`/expenses/${id}`);
      await loadData();
      if (editId === id) {
        setEditId(null);
        setForm((prev) => ({ ...prev, fromLocation: "", toLocation: "", clientName: "", kilometers: "", rupees: 3 }));
      }
    } catch (err) {
      console.error(err);
      setError("Could not delete expense.");
    }
  }

  async function handleExport() {
    setExporting(true);
    setError("");
    try {
      const res = await api.get("/expenses/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "expenses.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Export failed. Try again.");
    } finally {
      setExporting(false);
    }
  }

  const groupedByDate = useMemo(() => {
    return expenses.reduce((acc, exp) => {
      const key = exp.date?.slice(0, 10) || "Unknown";
      acc[key] = acc[key] || [];
      acc[key].push(exp);
      return acc;
    }, {});
  }, [expenses]);

  const [totalSum, setTotalSum] = useState(0);

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1 style={{ margin: 0 }}>Expense Reports</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Quick entry and exportable daily grouped reports
          </p>
        </div>
        <button className="ghost-btn" onClick={loadData} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "#fda4af", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={onSubmit}>
          <div className="grid">
            <Field label="Date">
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={onChange}
                required
              />
            </Field>

            <Field label="From Location">
              <input
                name="fromLocation"
                list="location-options"
                value={form.fromLocation}
                onChange={onChange}
                placeholder="Select or type new"
                required
              />
            </Field>

            <Field label="To Location">
              <input
                name="toLocation"
                list="location-options"
                value={form.toLocation}
                onChange={onChange}
                placeholder="Select or type new"
                required
              />
            </Field>

            <Field label="Client Name">
              <input
                name="clientName"
                list="client-options"
                value={form.clientName}
                onChange={onChange}
                placeholder="Select or type new"
                required
              />
            </Field>

            <Field label="Kilometer (km)">
              <input
                type="number"
                name="kilometers"
                value={form.kilometers}
                onChange={onChange}
                min="0"
                step="0.01"
                placeholder="0"
                required
              />
            </Field>

            <Field label="Rupees (₹/km)">
              <input
                type="number"
                name="rupees"
                value={form.rupees}
                onChange={onChange}
                min="0"
                step="0.01"
              />
            </Field>

            <Field label="Total">
              <input value={total} readOnly />
            </Field>
          </div>

          <div className="form-footer">
            <div className="totals">
              <span className="pill">
                Current total: <strong>₹{total}</strong>
              </span>
              <span className="pill">
                All entries: <strong>₹{totalSum.toFixed(2)}</strong>
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {editId && (
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setForm((prev) => ({
                      ...prev,
                      fromLocation: "",
                      toLocation: "",
                      clientName: "",
                      kilometers: "",
                      rupees: prev.rupees || 3,
                    }));
                  }}
                  disabled={loading}
                >
                  Cancel edit
                </button>
              )}
              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? (editId ? "Updating..." : "Saving...") : editId ? "Update entry" : "Save entry"}
              </button>
            </div>
          </div>
        </form>

        <datalist id="location-options">
          {options.locations.map((loc) => (
            <option key={loc} value={loc} />
          ))}
        </datalist>
        <datalist id="client-options">
          {options.clients.map((client) => (
            <option key={client} value={client} />
          ))}
        </datalist>
      </div>

      <div className="card">
        <div className="header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            
            <span className="muted">
              Page {page}/{pages} • {totalCount} entries
            </span>
          </div>
          <button className="primary-btn" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting..." : "Export Excel"}
          </button>
        </div>

        {Object.keys(groupedByDate).length === 0 ? (
          <p className="muted">No expenses yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Client</th>
                  <th>Km</th>
                  <th>₹/Km</th>
                  <th>Total</th>
              <th></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedByDate)
                  .sort((a, b) => (a[0] < b[0] ? 1 : -1))
                  .map(([dateKey, items]) => (
                <FragmentedRows
                  key={dateKey}
                  dateKey={dateKey}
                  items={items}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
                  ))}
              </tbody>
            </table>
            <div className="form-footer" style={{ justifyContent: "flex-end" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="ghost-btn"
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
}

function FragmentedRows({ dateKey, items, onEdit, onDelete }) {
  return items.map((item, idx) => (
    <tr key={item._id || `${dateKey}-${idx}`}>
      <td>{idx === 0 ? dateKey : ""}</td>
      <td>{item.fromLocation}</td>
      <td>{item.toLocation}</td>
      <td>{item.clientName}</td>
      <td>{item.kilometers}</td>
      <td>₹{item.rupees}</td>
      <td>₹{item.total}</td>
      <td>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="ghost-btn" type="button" onClick={() => onEdit(item)}>
            Edit
          </button>
          <button className="ghost-btn" type="button" onClick={() => onDelete(item._id)}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  ));
}

