import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAvailableSlots, bookAppointment } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const BookAppointment = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedDate, setSelectedDate] = useState(
    location.state?.date || new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState(location.state?.time || null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [bookingForm, setBookingForm] = useState({
    painType: '',
    phone: '',
    email: '',
    reason: ''
  });

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAvailableSlots(selectedDate);
      setSlots(response.data.slots);
    } catch (err) {
      setError('Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate, fetchSlots]);

  useEffect(() => {
    if (location.state?.time) {
      setShowModal(true);
    }
  }, [location.state]);

  const handleSlotClick = (slot) => {
    if (!slot.isBooked && !slot.time.includes('01:00 PM')) {
      setSelectedSlot(slot.time);
      setShowModal(true);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      await bookAppointment({
        date: selectedDate,
        timeSlot: selectedSlot,
        painType: bookingForm.painType,
        phone: bookingForm.phone || user.phone,
        email: bookingForm.email || user.email,
        reason: bookingForm.reason
      });

      setShowModal(false);
      alert('Appointment booked successfully! SMS confirmation sent.');
      navigate('/my-appointments');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().split('T')[0];
  };

  const painTypes = [
    'Back Pain',
    'Neck Pain', 
    'Knee Pain',
    'Shoulder Pain',
    'Sports Injury',
    'Other'
  ];

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const isSunday = selectedDateObj.getDay() === 0;

  return (
    <>
      <Navbar />
      <div className="booking-section">
        <div className="booking-card">
          <h2 className="booking-title">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Book Your Appointment
          </h2>

          <div className="date-selector">
            <label>Select Date:</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot(null);
              }}
              min={new Date().toISOString().split('T')[0]}
              max={getMaxDate()}
            />
            <div className="date-info">
              {selectedDateObj.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="date-note">
              Bookings available for the next 7 days
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px', fontSize: '1.2em', color: '#e67e22' }}>
              Loading available slots...
            </div>
          )}

          {!loading && isSunday && (
            <div className="closed-message">
              Clinic is closed on Sundays
            </div>
          )}

          {!loading && !isSunday && slots.length > 0 && (
            <div className="slots-grid">
              {slots.map((slot, index) => {
                const isLunch = slot.time.includes('01:00 PM');
                return (
                  <div 
                    key={index}
                    className={`slot-card ${
                      isLunch ? 'lunch' : slot.isBooked ? 'booked' : 'available'
                    }`}
                    onClick={() => handleSlotClick(slot)}
                  >
                    <div className="slot-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div className="slot-time">{slot.time}</div>
                    <div className="slot-status">
                      {isLunch ? 'Lunch Break' : slot.isBooked ? '🔴 BOOKED' : '✅ AVAILABLE'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Confirm Your Appointment</h2>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="booking-summary">
              <div><strong>Date:</strong> {selectedDate}</div>
              <div><strong>Time:</strong> {selectedSlot}</div>
              <div><strong>Duration:</strong> 50 minutes session</div>
            </div>

            <form onSubmit={handleBooking}>
              <div className="form-group">
                <label>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Select Pain Type *
                </label>
                <select 
                  value={bookingForm.painType}
                  onChange={(e) => setBookingForm({...bookingForm, painType: e.target.value})}
                  required
                >
                  <option value="">Choose pain type</option>
                  {painTypes.map((pain, idx) => (
                    <option key={idx} value={pain}>{pain}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Phone Number (Optional)
                </label>
                <input 
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                  placeholder={user?.phone || 'Enter phone number'}
                />
              </div>

              <div className="form-group">
                <label>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Email (Optional)
                </label>
                <input 
                  type="email"
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                  placeholder={user?.email || 'Enter email'}
                />
              </div>

              <div className="form-group">
                <label>Describe Your Condition</label>
                <textarea
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({...bookingForm, reason: e.target.value})}
                  placeholder="Please describe your pain, symptoms, or reason for consultation"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn-modal btn-modal-cancel"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-modal btn-modal-submit"
                  disabled={loading}
                >
                  {loading ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BookAppointment;