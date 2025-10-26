import React, { useState, useEffect } from 'react';
import {
  getAdminStats,
  getAllAppointments,
  updateAppointmentStatus,
  getAllUsers,
  blockUser
} from '../services/api';
import Navbar from '../components/Navbar';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [stats, setStats] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelDate, setCancelDate] = useState('');

  useEffect(() => {
    fetchStats();
    fetchAppointments();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getAdminStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await getAllAppointments();
      setAppointments(response.data.appointments);
    } catch (err) {
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateAppointmentStatus(id, { status });
      fetchAppointments();
      fetchStats();
      alert(`Appointment ${status} successfully! SMS sent to patient.`);
    } catch (err) {
      setError('Failed to update appointment');
    }
  };

  const handleBlockUser = async (id, isBlocked) => {
    if (!window.confirm(`Are you sure you want to ${isBlocked ? 'block' : 'unblock'} this user?`)) {
      return;
    }

    try {
      await blockUser(id, isBlocked);
      fetchUsers();
      fetchAppointments();
      alert(`User ${isBlocked ? 'blocked' : 'unblocked'} successfully!`);
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleCancelAllForDate = () => {
    if (!cancelDate) {
      alert('Please select a date');
      return;
    }

    if (!window.confirm(`Cancel all appointments for ${cancelDate}? SMS will be sent to all patients.`)) {
      return;
    }

    // Filter and cancel all appointments for the selected date
    const appointmentsToCancel = appointments.filter(
      apt => apt.date.split('T')[0] === cancelDate && apt.status !== 'cancelled'
    );

    Promise.all(
      appointmentsToCancel.map(apt => updateAppointmentStatus(apt._id, { status: 'cancelled' }))
    ).then(() => {
      fetchAppointments();
      fetchStats();
      alert(`${appointmentsToCancel.length} appointments cancelled and SMS sent to all patients!`);
      setCancelDate('');
    }).catch(() => {
      setError('Failed to cancel appointments');
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Navbar />
      <div className="admin-section">
        <div className="admin-card">
          <h2 className="admin-title">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Admin Dashboard
          </h2>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '25px', marginBottom: '50px' }}>
            <div style={{ background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)', color: 'white', padding: '35px 25px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 30px rgba(230, 126, 34, 0.3)' }}>
              <h3 style={{ fontSize: '3em', marginBottom: '10px' }}>{stats.totalUsers || 0}</h3>
              <p style={{ fontSize: '1.1em' }}>Total Patients</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white', padding: '35px 25px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 30px rgba(52, 152, 219, 0.3)' }}>
              <h3 style={{ fontSize: '3em', marginBottom: '10px' }}>{stats.todayAppointments || 0}</h3>
              <p style={{ fontSize: '1.1em' }}>Today's Appointments</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)', color: 'white', padding: '35px 25px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 30px rgba(243, 156, 18, 0.3)' }}>
              <h3 style={{ fontSize: '3em', marginBottom: '10px' }}>{stats.pendingAppointments || 0}</h3>
              <p style={{ fontSize: '1.1em' }}>Pending Approvals</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)', color: 'white', padding: '35px 25px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 30px rgba(46, 204, 113, 0.3)' }}>
              <h3 style={{ fontSize: '3em', marginBottom: '10px' }}>{stats.totalAppointments || 0}</h3>
              <p style={{ fontSize: '1.1em' }}>Total Bookings</p>
            </div>
          </div>

          {/* Cancel All Section */}
          <div className="cancel-all-section">
            <h3>Cancel All Appointments for a Date</h3>
            <div className="cancel-controls">
              <input 
                type="date"
                value={cancelDate}
                onChange={(e) => setCancelDate(e.target.value)}
              />
              <button onClick={handleCancelAllForDate} className="btn-cancel-all">
                Cancel All & Send SMS
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '3px solid #e8e8e8' }}>
            <button
              onClick={() => setActiveTab('appointments')}
              style={{
                padding: '15px 30px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.1em',
                color: activeTab === 'appointments' ? '#e67e22' : '#666',
                borderBottom: activeTab === 'appointments' ? '3px solid #e67e22' : '3px solid transparent',
                marginBottom: '-3px',
                transition: 'all 0.3s'
              }}
            >
              Appointments
            </button>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                padding: '15px 30px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.1em',
                color: activeTab === 'users' ? '#e67e22' : '#666',
                borderBottom: activeTab === 'users' ? '3px solid #e67e22' : '3px solid transparent',
                marginBottom: '-3px',
                transition: 'all 0.3s'
              }}
            >
              Users
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <>
              {loading && (
                <div style={{ textAlign: 'center', padding: '100px', fontSize: '1.3em', color: '#e67e22' }}>
                  Loading appointments...
                </div>
              )}

              {!loading && appointments.length === 0 && (
                <div className="empty-state">No appointments yet</div>
              )}

              {!loading && appointments.length > 0 && (
                <div className="appointments-list">
                  {appointments.map((appointment) => (
                    <div 
                      key={appointment._id}
                      className={`appointment-item ${appointment.status}`}
                    >
                      <div className="appointment-details">
                        <div><strong>Name:</strong> {appointment.user?.name}</div>
                        <div><strong>Phone:</strong> {appointment.user?.phone}</div>
                        <div><strong>Email:</strong> {appointment.user?.email || 'N/A'}</div>
                        <div><strong>Date:</strong> {formatDate(appointment.date)}</div>
                        <div><strong>Time:</strong> {appointment.timeSlot}</div>
                        <div><strong>Pain Type:</strong> {appointment.painType || 'N/A'}</div>
                      </div>

                      {appointment.reason && (
                        <div style={{ marginBottom: '20px', fontSize: '1.05em' }}>
                          <strong>Reason:</strong> {appointment.reason}
                        </div>
                      )}

                      <div className="appointment-actions">
                        {appointment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(appointment._id, 'confirmed')}
                              className="btn-verify"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Verify & Send SMS
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(appointment._id, 'cancelled')}
                              className="btn-admin-cancel"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                              </svg>
                              Cancel & Send SMS
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Block user ${appointment.user?.name}?`)) {
                                  handleBlockUser(appointment.user?._id, true);
                                }
                              }}
                              className="btn-block"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                              </svg>
                              Block User
                            </button>
                          </>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(appointment._id, 'completed')}
                            className="btn-verify"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <>
              {users.length === 0 && (
                <div className="empty-state">No users found</div>
              )}

              {users.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e8e8e8' }}>
                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Phone</th>
                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Joined</th>
                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '15px' }}>{user.name}</td>
                          <td style={{ padding: '15px' }}>{user.phone}</td>
                          <td style={{ padding: '15px' }}>
                            {user.isBlocked ? (
                              <span className="status-badge cancelled">Blocked</span>
                            ) : (
                              <span className="status-badge verified">Active</span>
                            )}
                          </td>
                          <td style={{ padding: '15px' }}>{formatDate(user.createdAt)}</td>
                          <td style={{ padding: '15px' }}>
                            {user.isBlocked ? (
                              <button
                                onClick={() => handleBlockUser(user._id, false)}
                                className="btn-verify"
                              >
                                Unblock
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlockUser(user._id, true)}
                                className="btn-block"
                              >
                                Block
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;