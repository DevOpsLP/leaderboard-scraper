# Binance Leaderboard Express API

The main idea of this project is be able to scrape the data from the leaderboard profile you want and return the data. This is meant to be deployed on a VPS so it can later be called to obtain the data for a `Google Sheet via App Scripts` but can serve any other purposes.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Endpoints](#endpoints)
  - [/setHeaders](#setheaders)
  - [/leaderboard-info](#leaderboard-info)
- [Usage Examples](#usage-examples)
  - [Using Curl](#using-curl)
  - [Using Postman](#using-postman)
- [Error Handling](#error-handling)
- [Development Notes](#development-notes)
- [Security Considerations](#security-considerations)
- [Conclusion](#conclusion)

## Introduction

This project provides a REST API using Express.js to set request headers and fetch leaderboard data from the Binance Futures Leaderboard API. The headers are saved locally and are reused for subsequent requests.

The main use case is for interacting with the Binance API, particularly for cases where you need to set custom cookies, tokens, or other headers for authentication.

## Features

- **Set Custom Headers**: Accepts headers as plain text and saves them for future API calls.
- **Fetch Leaderboard Data**: Makes requests to Binance with previously set headers.
- **Error Handling**: Handles missing headers, invalid credentials, and server issues.

## Installation

To run this application locally:

1. **Clone the Repository**:
   ```sh
   git clone <repository-url>
   ```
2. **Install Dependencies**:
   ```sh
   npm install
   ```
3. **Run the Server**:
   ```sh
   npm start
   ```

The server will start by default on [http://localhost:3000](http://localhost:3000). You can configure the port using the `PORT` environment variable.

## Endpoints

### 1. /setHeaders

- **Method**: POST
- **URL**: `/setHeaders`
- **Content Type**: `text/plain`

This endpoint allows the user to set headers that will be used for future requests. It accepts headers in a plain text format and saves them locally in `headers.json`.

**Request Body Format**

Headers should be provided as a plain text string with each header on a new line, in the format:

```
key: value
```

**Example Request**

```
Referer: https://www.binance.com/en/futures-activity/leaderboard/user/um?encryptedUid=...
Cache-Control: no-cache
Cookie: OptanonConsent=...
User-Agent: Mozilla/5.0 ...
```

**Responses**

- `200 OK`: Headers saved successfully.
- `400 Bad Request`: Headers string is required.
- `500 Internal Server Error`: Issue saving headers.

### 2. /leaderboard-info

- **Method**: POST
- **URL**: `/leaderboard-info`
- **Content Type**: `application/json`

This endpoint retrieves leaderboard data from Binance using the headers saved by `/setHeaders`. The URL provided must contain an `encryptedUid`.

**Request Body Format**

```json
{
  "url": "https://www.binance.com/en/futures-activity/leaderboard/user/um?encryptedUid=102B4C19F6F04652B11EA318F28C3778"
}
```

**Responses**

- `200 OK`: Returns the leaderboard data, including:
  ```json
  {
    "dailyROI": "<value>",
    "dailyPNL": "<value>",
    "weeklyROI": "<value>",
    "weeklyPNL": "<value>",
    "monthlyROI": "<value>",
    "monthlyPNL": "<value>",
    "totalPNL": "<value>",
    "openPositions": <number>,
    "openLongPositions": <number>,
    "openShortPositions": <number>
  }
  ```
- `400 Bad Request`: URL is required or `encryptedUid` not found.
- `403 Forbidden`: Please update your credentials.
- `404 Not Found`: Headers have not been set.
- `500 Internal Server Error`: Internal server error.

## Usage Examples

### Using Curl

**Setting Headers**:
```sh
curl -X POST http://localhost:3000/setHeaders \
     -H "Content-Type: text/plain" \
     --data 'Referer: https://www.binance.com 
     device-info: eyJzY3JlZW5fcm
     bnc-uuid: 90477ad1-9
     Cache-Control: no-cache
     Cookie: OptanonConsent=isGpcEnabled=0'
```

Where `headers.txt` contains:
```
Referer: https://www.binance.com/en/futures-activity/leaderboard/user/um?encryptedUid=...
Cache-Control: no-cache
Cookie: OptanonConsent=...
User-Agent: Mozilla/5.0 ...
```

**Fetching Leaderboard Info**:
```sh
curl -X POST http://localhost:3000/leaderboard-info \
     -H "Content-Type: application/json" \
     -d '{
           "url": "https://www.binance.com/en/futures-activity/leaderboard/user/um?encryptedUid=102B4C19F6F04652B11EA318F28C3778"
         }'
```

### Using Postman

**Set Headers**:
1. Set the method to `POST`.
2. URL: `http://localhost:3000/setHeaders`.
3. Headers: Set `Content-Type` to `text/plain`.
4. Body: Select `raw` and paste your headers in plain text.

**Fetch Leaderboard Info**:
1. Set the method to `POST`.
2. URL: `http://localhost:3000/leaderboard-info`.
3. Headers: Set `Content-Type` to `application/json`.
4. Body: Select `raw` and enter:
   ```json
   {
     "url": "https://www.binance.com/en/futures-activity/leaderboard/user/um?encryptedUid=102B4C19F6F04652B11EA318F28C3778"
   }
   ```

## Error Handling

- **Missing Headers**: `/leaderboard-info` will return `404 Not Found` if headers were not previously set via `/setHeaders`.
- **Invalid Credentials**: If Binance returns `403 Forbidden`, a `403` status with the message "Please update your credentials" is returned.
- **Malformed Request**: Missing `encryptedUid` or invalid URLs will return `400 Bad Request`.
- **Server Issues**: Any unexpected errors will return a `500 Internal Server Error`.

## Development Notes

- **Headers File (`headers.json`)**: This file stores headers set via `/setHeaders`. It is important to secure this file as it may contain sensitive information.

- **Environment Setup**:
  - The server listens on `PORT 3000` by default. To configure a different port, use the `PORT` environment variable.
  - Make sure Node.js and npm are installed on your system.

**Usage Flow**:

1. Set your headers using `/setHeaders`.
2. Fetch leaderboard information using `/leaderboard-info`.


