import express from 'express';
import { google } from 'googleapis';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001; // You can specify a different port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const spreadsheetId = 'SPREADSHEET_ID';
const sheetName = 'GBG Lunch Bookings'; 
const auth = new google.auth.GoogleAuth({
  keyFile: '/Users/allisrodvaldr/Desktop/my-react-app/server/spry-connection-421011-590e44f8c6e7.json', 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

app.use(cors()); // Enable CORS if client is served from a different port during development
app.use(express.json()); // For parsing application/json

app.get('/api/totalBooked', async (req, res) => {
    try {
        const totalBooked = await readTotalBooked();
        res.json({ totalBooked });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error fetching total booked');
    }
});

app.get('/api/lunchInfo', async (req, res) => {
    try {
        const lunchInfo = await getLunchInfo();
        res.json(lunchInfo);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Failed to fetch lunch information');
    }
});

app.post('/api/reserve', async (req, res) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0); // 10:00 AM
    const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 0); // 2:00 PM

    if (now < startTime || now > endTime) {
        res.status(400).send("Reservations are only accepted between 10:00 AM and 2:00 PM.");
        return;
    }

    try {
        const { name, number, date } = req.body;
        await writeReservation(name, number, date);
        res.status(200).json({ message: "Reservation successful" });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Error processing reservation" });
    }
});


async function getSheetsClient() {
  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: 'v4', auth: client });
  return googleSheets;
}

async function readReservations() {
  const googleSheets = await getSheetsClient();
  const response = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: `${sheetName}!A:B`, // Assuming names are in column A and reservations in column B
  });

  return response.data.values;
}

async function readTotalBooked() {
    const googleSheets = await getSheetsClient();
    const range = `${sheetName}!B2:B`; // Assuming bookings start at B2
    const response = await googleSheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      auth,
    });
  
    const values = response.data.values || [];
    const totalBooked = values.reduce((sum, row) => sum + parseInt(row[0] || '0', 10), 0);
    return totalBooked;
  }

async function writeReservation(name, number, date) {
  const googleSheets = await getSheetsClient();
  await googleSheets.spreadsheets.values.append({
    auth,
    spreadsheetId,
    range: `${sheetName}!A:C`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[name, number, date]],
    },
  });
}

async function getLunchInfo() {
    const googleSheets = await getSheetsClient();
    const range = 'Lunchinfo!A2:B2'; // Assuming you store data in the second row
    const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId,
        range,
        auth,
    });
    const values = response.data.values;
    if (values && values.length > 0) {
        const [description, imageUrl] = values[0];
        return { description, imageUrl };
    }
    return { description: 'No description available', imageUrl: 'default-image-url' };
}

// Export the functions you want to use in other files
export { readReservations, writeReservation };
