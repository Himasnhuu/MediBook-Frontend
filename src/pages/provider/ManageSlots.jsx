import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getSlotsByProvider,
  addSlot,
  releaseSlot,
  deleteSlot
} from '../../api/scheduleApi';

const STATUS_COLORS = {
  AVAILABLE: { badge: 'badge-success', label: 'Available' },
  BOOKED:    { badge: 'badge-info',    label: 'Booked'    },
  BLOCKED:   { badge: 'badge-danger',  label: 'Blocked'   }
};

const ManageSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actioningId, setActioningId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    durationMinutes: 30,
    recurrence: 'NONE'
  });
  const [saving, setSaving] = useState(false);

  const providerId = localStorage.getItem('providerId');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const data = await getSlotsByProvider(providerId);
      data.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
      setSlots(data);
    } catch (err) {
      toast.error('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    if (!form.date || !form.startTime || !form.endTime) {
      toast.error('Date, start time and end time are required');
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error('End time must be after start time');
      return;
    }
    setSaving(true);
    try {
      await addSlot({
        providerId: parseInt(providerId),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        durationMinutes: parseInt(form.durationMinutes),
        recurrence: form.recurrence,
        status: 'AVAILABLE'
      });
      toast.success('Slot added successfully');
      setShowForm(false);
      setForm({ date: '', startTime: '', endTime: '', durationMinutes: 30, recurrence: 'NONE' });
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data || 'Failed to add slot');
    } finally {
      setSaving(false);
    }
  };

  const handleRelease = async (slotId) => {
    setActioningId(slotId);
    try {
      await releaseSlot(slotId);
      toast.success('Slot released');
      fetchSlots();
    } catch (err) {
      toast.error('Failed to release slot');
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm('Delete this slot?')) return;
    setActioningId(slotId);
    try {
      await deleteSlot(slotId);
      toast.success('Slot deleted');
      fetchSlots();
    } catch (err) {
      toast.error('Failed to delete slot');
    } finally {
      setActioningId(null);
    }
  };

  const filtered = slots.filter(slot => {
    const dateMatch = filterDate ? slot.date === filterDate : true;
    const statusMatch = filterStatus === 'ALL' ? true : slot.status === filterStatus;
    return dateMatch && statusMatch;
  });

  const grouped = filtered.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2C2825' }}>
            Manage Slots
          </h2>
          <p style={{ color: '#8C7E72', fontSize: '14px', marginTop: '4px' }}>
            Add and manage your availability slots
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ padding: '10px 20px' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add New Slot'}
        </button>
      </div>

      {/* Add Slot Form */}
      {showForm && (
        <div className="card" style={{
          border: '2px solid #B8DADA', backgroundColor: '#E8F4F4',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ marginBottom: '1.2rem', color: '#1F4E4E', fontSize: '16px', fontWeight: '700' }}>
            New Availability Slot
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Date *</label>
              <input
                type="date"
                min={today}
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Start Time *</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>End Time *</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Duration (minutes)</label>
              <select
                value={form.durationMinutes}
                onChange={e => setForm({ ...form, durationMinutes: e.target.value })}
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Recurrence</label>
              <select
                value={form.recurrence}
                onChange={e => setForm({ ...form, recurrence: e.target.value })}
              >
                <option value="NONE">No Recurrence</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: '1.2rem', padding: '10px 28px' }}
            onClick={handleAddSlot}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Slot'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '1.5rem',
        flexWrap: 'wrap', alignItems: 'center'
      }}>
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{
            padding: '8px 12px', border: '1.5px solid #E2D9CE',
            borderRadius: '8px', fontSize: '13px', outline: 'none',
            fontFamily: 'inherit', backgroundColor: '#FAFAF8'
          }}
        />
        {filterDate && (
          <button
            className="btn"
            style={{ backgroundColor: '#F2EDE4', color: '#8C7E72', padding: '8px 12px', fontSize: '13px', border: '1px solid #E2D9CE' }}
            onClick={() => setFilterDate('')}
          >
            Clear Date
          </button>
        )}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'AVAILABLE', 'BOOKED', 'BLOCKED'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="btn"
              style={{
                backgroundColor: filterStatus === s ? '#2D6B6B' : '#F2EDE4',
                color: filterStatus === s ? 'white' : '#8C7E72',
                padding: '8px 14px', fontSize: '12px',
                border: filterStatus === s ? 'none' : '1px solid #E2D9CE'
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#8C7E72' }}>
          {filtered.length} slot(s) found
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8C7E72' }}>
          Loading slots...
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          backgroundColor: 'white', borderRadius: '12px',
          color: '#8C7E72', border: '1px solid #E2D9CE'
        }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#2C2825' }}>No slots found</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>
            Click "+ Add New Slot" to create your first availability slot
          </p>
        </div>
      )}

      {/* Slots grouped by date */}
      {!loading && Object.keys(grouped).map(date => (
        <div key={date} style={{ marginBottom: '1.5rem' }}>
          <div style={{
            backgroundColor: '#2D6B6B', color: 'white',
            padding: '10px 16px', borderRadius: '8px 8px 0 0',
            fontSize: '14px', fontWeight: '700'
          }}>
            {formatDate(date)} — {grouped[date].length} slot(s)
          </div>
          <div className="table-wrap" style={{
            backgroundColor: 'white',
            border: '1px solid #E2D9CE',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            overflow: 'hidden'
          }}>
            <table>
              <thead>
                <tr>
                  <th>Slot ID</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Duration</th>
                  <th>Recurrence</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grouped[date].map(slot => (
                  <tr key={slot.slotId}>
                    <td>#{slot.slotId}</td>
                    <td style={{ fontWeight: '600' }}>{slot.startTime}</td>
                    <td>{slot.endTime}</td>
                    <td>{slot.durationMinutes} min</td>
                    <td style={{ fontSize: '12px', color: '#8C7E72' }}>
                      {slot.recurrence || 'NONE'}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[slot.status]?.badge}`}>
                        {STATUS_COLORS[slot.status]?.label || slot.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {slot.status === 'BLOCKED' && (
                          <button
                            className="btn btn-success"
                            style={{ padding: '5px 10px', fontSize: '11px', fontWeight: '600' }}
                            onClick={() => handleRelease(slot.slotId)}
                            disabled={actioningId === slot.slotId}
                          >
                            Release
                          </button>
                        )}
                        {(slot.status === 'AVAILABLE' || slot.status === 'BLOCKED') && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '5px 10px', fontSize: '11px', fontWeight: '600' }}
                            onClick={() => handleDelete(slot.slotId)}
                            disabled={actioningId === slot.slotId}
                          >
                            {actioningId === slot.slotId ? '...' : 'Delete'}
                          </button>
                        )}
                        {slot.status === 'BOOKED' && (
                          <span style={{ fontSize: '12px', color: '#8C7E72' }}>
                            Booked
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ManageSlots;
