# Ghost Trail 🌿

**NLP-Based Crowdsourced Navigation and Safety System for Hidden Outdoor Locations**

A full-stack web application that lets visitors to unnamed, off-grid natural locations leave behind step-by-step, landmark-based trail paths for future visitors — combined with an AI/ML component that automatically detects hazard language in comments to flag when a trail may have changed.

---

## The Problem

Standard map platforms (Google Maps, AllTrails) cannot represent unofficial, unnamed natural spots in any navigable way. People who find hidden waterfalls, secret lakes, and remote forest spots share directions informally through WhatsApp and social media — where the information gets lost, becomes stale, and can lead later visitors astray or into danger.

## The Solution

Ghost Trail captures and structures this informal knowledge:
- Visitors who find a hidden spot record a step-by-step, landmark-based path
- Later visitors follow the same path waypoint by waypoint
- An NLP microservice reads follower comments and auto-detects hazard language
- Trail freshness decays over time and is upgraded by community confirmation

---

## Features

| Feature | Description |
|---|---|
| **Breadcrumb trail paths** | Step-by-step human-written waypoints with GPS coordinates |
| **Story mode** | Each trail presented as a narrative, not just a list |
| **Trail decay scoring** | Freshness degrades over time; NLP accelerates flagging |
| **NLP hazard detection** | Python keyword-lexicon classifier detects hazard language in comments |
| **GPS waypoint capture** | Browser Geolocation API captures coordinates at each waypoint |
| **Leaflet map** | OpenStreetMap-powered map shows waypoint markers |
| **SOS screen** | Live GPS coordinates, emergency call, location sharing |
| **Offline-ready** | Trail data cached for no-signal environments |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Leaflet, react-leaflet, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (AWS Mumbai) |
| NLP Microservice | Python, Flask, keyword-lexicon classifier |
| Maps | Leaflet.js + OpenStreetMap (free, no API key) |
| Version Control | Git + GitHub |

---

## Project Structure

---

## NLP Component

The trail freshness signal uses a two-layer approach:

**Layer 1 — Date-based decay:**
- Fresh: confirmed within 90 days
- Caution: 90–180 days since last confirmation
- Needs review: 180+ days

**Layer 2 — NLP comment analysis:**
When a visitor submits a comment, the backend calls the Python NLP microservice at `POST /analyze`. The classifier checks for hazard keywords (overgrown, washed out, landslide, flooded, blocked, etc.) and returns:
- Risk label: `clear` / `caution` / `needs_review`
- Confidence score (0–1)
- List of hazard keywords detected

A comment flagged as `needs_review` immediately escalates the trail's freshness status, regardless of the date threshold.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trails` | Get all trails |
| GET | `/api/trails/:id` | Get single trail |
| POST | `/api/trails` | Create new trail |
| PUT | `/api/trails/:id/confirm` | Reset freshness date |
| POST | `/api/trails/:id/comments` | Add comment + auto NLP analysis |

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- Python 3.10+
- MongoDB Atlas account (free tier)

### 1. Clone the repo
```bash
git clone https://github.com/Sawanrawats1/ghost-trail.git
cd ghost-trail
```

### 2. Backend setup
```bash
cd backend
npm install
```
Create `.env` file:

```bash
node server.js
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm start
```

### 4. NLP microservice setup
```bash
cd nlp
pip install flask flask-cors
python freshness.py
```

### Running all three together
- Backend: `localhost:5000`
- Frontend: `localhost:3000`
- NLP service: `localhost:5001`

---

## Domain and Application Area

- **Domain:** Artificial Intelligence and Machine Learning
- **Application area:** Outdoor Safety and Navigation
- **College:** MCA Final Year Project, Batch 2026–27

---

## What Makes It Different

| Platform | Gap |
|---|---|
| Google Maps | Cannot represent unnamed, unofficial locations |
| AllTrails | Only covers registered park trails; no human-written waypoints |
| WhatsApp/social media | Trail info scattered, unsearchable, gets buried and lost |
| **Ghost Trail** | Structured, community-verified paths for officially non-existent spots |