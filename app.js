const express = require('express');
const fs = require('fs');
const axios = require('axios');
const app = express();

app.use(express.json());

// Endpoint to set headers
app.use(express.text()); // Middleware to parse plain text

app.post('/setHeaders', (req, res) => {
  const headersString = req.body; // Plain text input

  if (!headersString) {
    return res.status(400).json({ error: 'Headers string is required' });
  }

  // Parse the headers string into an object
  const headers = {};
  const lines = headersString.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line) {
      const index = line.indexOf(':');
      if (index > -1) {
        const key = line.substring(0, index).trim();
        const value = line.substring(index + 1).trim();
        headers[key] = value;
      }
    }
  }

  // Save the parsed headers to a file
  fs.writeFile('headers.json', JSON.stringify(headers), (err) => {
    if (err) {
      console.error('Error saving headers:', err);
      return res.status(500).json({ error: 'Failed to save headers' });
    }
    res.status(200).json({ message: 'Headers saved successfully' });
  });
});

// Endpoint to get leaderboard info
app.post('/leaderboard-info', (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Extract encryptedUid from the URL
  const urlObj = new URL(url);
  const encryptedUid = urlObj.searchParams.get('encryptedUid');

  if (!encryptedUid) {
    return res.status(400).json({ error: 'Invalid URL: encryptedUid not found' });
  }

  // Read the headers from the file
  fs.readFile('headers.json', 'utf8', async (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Please set your headers' });
      } else {
        console.error('Error reading headers file:', err);
        return res.status(500).json({ error: 'Failed to read headers' });
      }
    }

    let headers;
    try {
      headers = JSON.parse(data);
    } catch (parseError) {
      console.error('Error parsing headers file:', parseError);
      return res.status(500).json({ error: 'Failed to parse headers' });
    }

    // Set up the Axios request options
    const options = {
      method: 'POST',
      url: 'https://www.binance.com/bapi/futures/v2/private/future/leaderboard/getOtherPosition',
      headers: headers,
      data: {
        encryptedUid: encryptedUid,
        tradeType: 'PERPETUAL',
      },
    };

    try {
      const response = await axios.request(options);
      return res.status(200).json(response.data);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return res.status(403).json({ error: 'Please update your credentials' });
      } else {
        console.error('Error making Axios request:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
