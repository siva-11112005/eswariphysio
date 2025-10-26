import React, { useState, useEffect } from 'react';
import { getMyAppointments, cancelAppointment } from '../services/api';
import Navbar from '../components/Navbar';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await getMyAppointments();
      setAppointments(response.data.appointments);
    } catch (err) {
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await cancelAppointment(id);
      fetchAppointments();
      alert('Appointment cancelled successfully!');
    } catch (err) {
      setError('Failed to cancel appointment');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Navbar />
      <div className="appointments-section">
        <div className="appointments-card">
          <h2 className="appointments-title">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            My Appointments
          </h2>

          {loading && (
            <div style={{ textAlign: 'center', padding: '100px', fontSize: '1.3em', color: '#e67e22' }}>
              Loading appointments...
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          {!loading && appointments.length === 0 && (
            <div className="empty-state">
              No appointments yet. Book your first session!
            </div>
          )}

          {!loading && appointments.length > 0 && (
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <div 
                  key={appointment._id} 
                  className={`appointment-item ${appointment.status}`}
                >
                  <div className="appointment-details">
                    <div>
                      <strong>Date:</strong> {formatDate(appointment.date)}
                    </div>
                    <div>
                      <strong>Time:</strong> {appointment.timeSlot}
                    </div>
                    <div>
                      <strong>Pain Type:</strong> {appointment.painType || 'Not specified'}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span className={`status-badge ${appointment.status}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div style={{ marginBottom: '15px', fontSize: '1.05em' }}>
                      <strong>Notes:</strong> {appointment.notes}
                    </div>
                  )}

                  {appointment.reason && (
                    <div style={{ marginBottom: '15px', fontSize: '1.05em' }}>
                      <strong>Reason:</strong> {appointment.reason}
                    </div>
                  )}

                  <div className="appointment-actions">
                    {appointment.status === 'pending' && (
                      <button 
                        onClick={() => handleCancel(appointment._id)}
                        className="btn-cancel"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyAppointments;