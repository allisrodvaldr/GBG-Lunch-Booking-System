import React, { useState, useEffect } from 'react';
import '/src/LunchSpecial.css';

const App = () => {
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const todaysDate = today.toLocaleDateString('en-EN', options);
  const [bookingStep, setBookingStep] = useState('initial'); // 'initial', 'selected', 'confirmed'
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [customerName, setCustomerName] = useState();
  const [totalBooked, setTotalBooked] = useState(0);
  const maxCapacity = 50; 
  const [availableSlots, setAvailableSlots] = useState(maxCapacity); //initial is maxcapacity
  const [lunchInfo, setLunchInfo] = useState({ description: '', imageUrl: '' });
  const now = new Date();
  const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0); 
  const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 0); 
  const isBookingAllowed = now >= startTime && now <= endTime;

  const fetchLunchInfo = () => {
    fetch('http://localhost:3001/api/lunchInfo')
        .then(response => response.json())
        .then(data => {
            setLunchInfo({ description: data.description, imageUrl: data.imageUrl });
        })
        .catch(error => {
            console.error('Failed to fetch lunch information:', error);
        });
  };

  useEffect(() => {
    fetchLunchInfo();
  }, []);

const handleBookTable = () => {
    if (!isBookingAllowed) {
      alert("Booking is only allowed between 10:00 and 12:00");
      return;
    } 
    if (numberOfPeople <= availableSlots) {
        fetch('http://localhost:3001/api/reserve', { //fetch the node.js server (backend)
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: customerName, number: numberOfPeople, date: todaysDate})
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            setTotalBooked(prev => prev + numberOfPeople);
            setBookingStep('confirmed');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to book the table. Please try again.');
        });
    } else {
        alert(`Cannot book for ${numberOfPeople}. Only ${availableSlots} slots left.`);
    }
};

const fetchTotalBooked = () => {
  fetch('http://localhost:3001/api/totalBooked')
      .then(response => response.json())
      .then(data => {
          console.log("Data from server:", data); // Check what you receive
          const totalBooked = data.totalBooked;
          setAvailableSlots(maxCapacity - totalBooked);
      })
      .catch(error => {
          console.error('Failed to fetch total booked:', error);
      });
};

    useEffect(() => {
      fetchTotalBooked();
      const intervalId = setInterval(fetchTotalBooked, 30000); // Refresh every 30 seconds
      return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  const handleReserveClick = () => {
    if (availableSlots > 0) {
      setBookingStep('selected');
    } else {
      alert('Sorry, no slots available today.');
    }
  };

  const handleHomepageClick = () => {
    setBookingStep('initial');
  };

  const handlePeopleChange = (event) => {
    const numPeople = parseInt(event.target.value, 10); // From string to int 
    if (numPeople <= availableSlots) {
      setNumberOfPeople(numPeople);
    } else {
      alert(`Only ${availableSlots} slots available.`);
      setNumberOfPeople(availableSlots);
    }
  };

  const handleNameChange = (event) => {
    setCustomerName(event.target.value);
  };

  return (
    <div className="lunch-special-container">
      <header className="lunch-header">
        GÖTEBORGS NATION
      </header>
      <div className="lunch-body">

        {bookingStep === 'initial' && (
          <>
            <h2 className="lunch-title">TODAY'S LUNCH</h2>
            <h3 className="lunch-date">{todaysDate}</h3>
            <p className="lunch-description"> {lunchInfo.description} </p>
            <img src={lunchInfo.imageUrl} alt="Lunch Special" className="lunch-image" />
            
            <button className="reserve-button" onClick={handleReserveClick}>  RESERVE TABLE </button>
            <p className="slots-left"> {availableSlots} SLOTS LEFT TODAY </p>
          </>
        )}

        {bookingStep === 'selected' && (
          <>

          <div className="booking-page">
            <label>Enter your name:</label>
            <input
              type="text"
              id="customer-name"
              value={customerName}
              onChange={handleNameChange}
              className="customer-name-input"
              placeholder="Enter your name"
            /><p></p>
            <label htmlFor="number-of-people"> Select number of people:
            
            </label>
            <select
              id="number-of-people"
              value={numberOfPeople}
              onChange={handlePeopleChange}
              className="people-select"
            >
              {[...Array(15)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <button className="book-button" onClick={handleBookTable}> Book </button>
            <div className="booking-information"> <label> Booking is only possible between 10:00-12:00 AM. </label> </div>
            <button className="homepage-button" onClick={handleHomepageClick}> Homepage </button>
            </div>
          </>
        )}
        {bookingStep === 'confirmed' && (
          <div className="confirmation">
            {customerName}, you have booked a table for {numberOfPeople} people for {todaysDate}. Welcome!
            <button className="homepage-button" onClick={handleHomepageClick}> Homepage </button>
          </div>
        )}
        
          <div className="lunch-time">
            Time: 12:15 to 13:15.
          </div>
          <div className="lunch-price">
            Price: 45 kr.
          </div>
          <div className="lunch-place">
             Place: Östra vallgatan 47, 22 361 Lund
          </div>

      </div>
    </div>
  );
};

export default App;
