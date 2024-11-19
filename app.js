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
  let encryptedUid;
  try {
    const urlObj = new URL(url);
    encryptedUid = urlObj.searchParams.get('encryptedUid');
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

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

    // Prepare the request options
    const options = {
      method: 'POST',
      headers: headers,
      data: {
        encryptedUid: encryptedUid,
        tradeType: 'PERPETUAL',
      },
    };

    try {
      // Make the first API call to get positions
      const positionResponse = await axios.request({
        ...options,
        url: 'https://www.binance.com/bapi/futures/v2/private/future/leaderboard/getOtherPosition',
      });

      // Make the second API call to get performance
      const performanceResponse = await axios.request({
        ...options,
        url: 'https://www.binance.com/bapi/futures/v2/public/future/leaderboard/getOtherPerformance',
      });

      // Make the third API call to get nickName
      const baseInfoOptions = {
        method: 'POST',
        headers: headers,
        data: {
          encryptedUid: encryptedUid,
        },
      };

      const baseInfoResponse = await axios.request({
        ...baseInfoOptions,
        url: 'https://www.binance.com/bapi/futures/v2/public/future/leaderboard/getOtherLeaderboardBaseInfo',
      });

      // Extract nickName from baseInfoResponse
      const baseInfoData = baseInfoResponse.data.data;
      const nickName = baseInfoData.nickName || null;

      // Process position data
      const positionsData = positionResponse.data.data;
      const otherPositionRetList = positionsData.otherPositionRetList || [];

      // Initialize counters
      let openPositions = otherPositionRetList.length;
      let openLongPositions = 0;
      let openShortPositions = 0;

      // Iterate through positions to count longs and shorts
      for (const position of otherPositionRetList) {
        const { entryPrice, markPrice, pnl } = position;
        if (entryPrice && markPrice && pnl !== undefined) {
          if ((entryPrice < markPrice && pnl > 0) || (entryPrice > markPrice && pnl < 0)) {
            openLongPositions++;
          } else if ((entryPrice > markPrice && pnl > 0) || (entryPrice < markPrice && pnl < 0)) {
            openShortPositions++;
          }
        }
      }

      // Process performance data
      const performanceData = performanceResponse.data.data;
      const performanceRetList = performanceData.performanceRetList || [];

      // Extract required performance metrics
      let dailyROI = null;
      let dailyPNL = null;
      let weeklyROI = null;
      let weeklyPNL = null;
      let monthlyROI = null;
      let monthlyPNL = null;
      let totalPNL = null;

      for (const perf of performanceRetList) {
        const { periodType, statisticsType, value } = perf;
        if (periodType === 'DAILY') {
          if (statisticsType === 'ROI') {
            dailyROI = value;
          } else if (statisticsType === 'PNL') {
            dailyPNL = value;
          }
        } else if (periodType === 'WEEKLY') {
          if (statisticsType === 'ROI') {
            weeklyROI = value;
          } else if (statisticsType === 'PNL') {
            weeklyPNL = value;
          }
        } else if (periodType === 'MONTHLY') {
          if (statisticsType === 'ROI') {
            monthlyROI = value;
          } else if (statisticsType === 'PNL') {
            monthlyPNL = value;
          }
        } else if (periodType === 'ALL' && statisticsType === 'PNL') {
          totalPNL = value;
        }
      }

      // Prepare the response data, including the Positions array and username
      const responseData = {
        username: nickName, // Include the nickName as username
        dailyROI,
        dailyPNL,
        weeklyROI,
        weeklyPNL,
        monthlyROI,
        monthlyPNL,
        totalPNL,
        openPositions,
        openLongPositions,
        openShortPositions,
        Positions: otherPositionRetList, // Include the Positions array
      };

      return res.status(200).json(responseData);
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
