import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAvailableSlots } from '../services/api';
import Navbar from '../components/Navbar';

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAvailableSlots(selectedDate);
      setSlots(response.data.slots);
    } catch (err) {
      console.error('Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate, fetchSlots]);

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().split('T')[0];
  };

  const handleSlotClick = (slot) => {
    const isLunch = slot.time.includes('01:00 PM');
    
    if (slot.isBooked || isLunch) {
      // Do nothing if slot is booked or lunch time
      return;
    }

    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: '/', date: selectedDate, time: slot.time } });
    } else {
      // Navigate to booking page if authenticated
      navigate('/book', { state: { date: selectedDate, time: slot.time } });
    }
  };

  const painTypes = [
    { name: 'Back Pain', icon: '🏋️', color: '#e74c3c' },
    { name: 'Neck Pain', icon: '💆', color: '#3498db' },
    { name: 'Knee Pain', icon: '🦵', color: '#f39c12' },
    { name: 'Shoulder Pain', icon: '💪', color: '#9b59b6' },
    { name: 'Sports Injury', icon: '⚡', color: '#2ecc71' },
    { name: 'Other', icon: '🏥', color: '#95a5a6' }
  ];

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const isSunday = selectedDateObj.getDay() === 0;

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      {!user && (
        <>
          <div className="hero-section">
            <div className="hero-content">
              <h1>Expert Physiotherapy Care</h1>
              <p>Specialized treatment for back pain, neck pain, knee pain, shoulder pain, and sports injuries. Book your appointment today!</p>
              <button onClick={() => navigate('/register')} className="btn-hero">
                Book Appointment Now
              </button>
            </div>
          </div>

          {/* Pain Types Section */}
          <div className="pain-types-section">
            <div className="pain-types-content">
              <h2>Physiotherapy Treatments For</h2>
              <div className="pain-types-grid">
                {painTypes.map((pain, index) => (
                  <div 
                    key={index} 
                    className={`pain-type-card ${pain.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className="pain-icon">{pain.icon}</div>
                    <h3>{pain.name}</h3>
                    <p>Specialized treatment and rehabilitation programs tailored to your needs</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Booking Section */}
      <div className="booking-section">
        <div className="booking-card">
          <h2 className="booking-title">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {user ? 'Book Your Appointment' : 'View Available Slots'}
          </h2>

          <div className="date-selector">
            <label>Select Date:</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
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
            <>
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
                      style={{ 
                        cursor: (!slot.isBooked && !isLunch) ? 'pointer' : 'not-allowed' 
                      }}
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

              {!user && (
                <div className="login-prompt">
                  <div className="login-prompt-note">
                    📱 Indian mobile numbers only • OTP verification required • Min 8 char password
                  </div>
                  <p style={{ marginBottom: '20px' }}>
                    Click on any available slot to book an appointment
                  </p>
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => navigate('/login')} 
                      style={{
                        background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',
                        color: 'white',
                        padding: '14px 35px',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '1.1em',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 5px 15px rgba(230, 126, 34, 0.3)',
                        transition: 'all 0.3s',
                        fontFamily: 'Poppins, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 20px rgba(230, 126, 34, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 5px 15px rgba(230, 126, 34, 0.3)';
                      }}
                    >
                      Login to Book
                    </button>
                    <button 
                      onClick={() => navigate('/register')} 
                      style={{
                        background: 'transparent',
                        color: '#e67e22',
                        padding: '14px 35px',
                        border: '2px solid #e67e22',
                        borderRadius: '10px',
                        fontSize: '1.1em',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        fontFamily: 'Poppins, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#e67e22';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#e67e22';
                      }}
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="footer-content">
          <h3>Eswari Physiotherapy Clinic</h3>
          <div className="footer-info">
            <strong>Eswari</strong> - Bachelor of Physiotherapy (BPT)
          </div>
          <div className="footer-contact">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {process.env.REACT_APP_ADMIN_PHONE || '+919524350214'}
            </span>
            <span>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              eswaripalani2002@gmail.com
            </span>
          </div>

          <div className="footer-hours">
            <p style={{ fontSize: '1.2em', marginBottom: '15px' }}>
              <strong>Working Hours:</strong> Monday - Saturday
            </p>
            <p style={{ marginBottom: '15px' }}>
              Morning: 10:00 AM - 1:00 PM | Afternoon: 2:00 PM - 5:00 PM
            </p>
            <p>Each session: 50 minutes | Bookings available for next 7 days</p>
          </div>

          <div className="footer-note">
            <p>Specialized in treating Back Pain, Neck Pain, Knee Pain, Shoulder Pain, and Sports Injuries</p>
          </div>

          <div className="footer-security">
            <p>📱 Indian Mobile Numbers Only • OTP Verified Accounts • Min 8 Char Password • Secure Booking System</p>
          </div>

          <p className="footer-copyright">
            © 2024 Eswari Physiotherapy Clinic. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
};

export default Home;