import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getSpecializations, addSpecialization, deleteSpecialization } from '../../api/providerApi';

const ManageSpecializations = () => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchSpecializations();
  }, []);

  const fetchSpecializations = async () => {
    setLoading(true);
    try {
      const data = await getSpecializations();
      setSpecializations(data);
    } catch (err) {
      toast.error('Failed to load specializations');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Please enter a specialization name');
      return;
    }
    setSaving(true);
    try {
      await addSpecialization(newName.trim());
      toast.success(`"${newName}" added successfully`);
      setNewName('');
      fetchSpecializations();
    } catch (err) {
      toast.error(err.response?.data || 'Failed to add specialization');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteSpecialization(id);
      toast.success(`"${name}" deleted`);
      fetchSpecializations();
    } catch (err) {
      toast.error('Failed to delete specialization');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
          Manage Specializations
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Add or remove medical specializations — providers and patients will see these instantly
        </p>
      </div>

      {/* Add new */}
      <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid #c7d2fe' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '1rem' }}>
          ➕ Add New Specialization
        </h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="e.g. Cardiology, Neurology, Dentistry..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            disabled={saving}
            style={{
              flex: 1, padding: '10px 14px',
              border: '1px solid #cbd5e1', borderRadius: '8px',
              fontSize: '14px', outline: 'none'
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '10px 24px' }}
            disabled={saving}
          >
            {saving ? 'Adding...' : '➕ Add'}
          </button>
        </form>
      </div>

      {/* Summary */}
      {!loading && (
        <div style={{ marginBottom: '1rem' }}>
          <span className="badge badge-info" style={{ fontSize: '13px', padding: '6px 14px' }}>
            {specializations.length} specialization(s) active
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          Loading...
        </div>
      )}

      {/* Empty */}
      {!loading && specializations.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          backgroundColor: 'white', borderRadius: '12px', color: '#64748b'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏥</div>
          <p style={{ fontWeight: '600' }}>No specializations yet</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>
            Add specializations above — they will appear in provider registration and patient search instantly
          </p>
        </div>
      )}

      {/* List */}
      {!loading && specializations.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Specialization Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {specializations.map(spec => (
                <tr key={spec.id}>
                  <td>#{spec.id}</td>
                  <td style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>
                    🏥 {spec.name}
                  </td>
                  <td>
                    <span className="badge badge-success">✓ Active</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => handleDelete(spec.id, spec.name)}
                      disabled={deletingId === spec.id}
                    >
                      {deletingId === spec.id ? '...' : '🗑️ Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageSpecializations;