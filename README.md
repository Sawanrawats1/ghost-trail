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
