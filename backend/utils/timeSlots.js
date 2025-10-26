const generateTimeSlots = () => {
  const slots = [];
  
  // Morning: 10:00 AM - 1:00 PM
  const morningSlots = [
    '10:00 AM - 10:50 AM',
    '11:00 AM - 11:50 AM',
    '12:00 PM - 12:50 PM'
  ];
  
  // Afternoon: 2:00 PM - 5:00 PM
  const afternoonSlots = [
    '02:00 PM - 02:50 PM',
    '03:00 PM - 03:50 PM',
    '04:00 PM - 04:50 PM'
  ];
  
  return [...morningSlots, ...afternoonSlots];
};

module.exports = { generateTimeSlots };