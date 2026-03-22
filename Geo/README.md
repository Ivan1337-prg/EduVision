# Geo Module

## Overview
This module is for geolocation-based attendance validation in the EduVision project. Its purpose is to check whether a user is physically close enough to a classroom or approved attendance area before attendance is marked.

## Purpose
The goal of this module is to add location verification as an extra step in the attendance process. This helps confirm not only who the user is, but also whether they are in the correct place.

## Current Functionality
- Retrieves device location from the browser in the demo interface
- Calculates distance between the user's coordinates and a target classroom location
- Uses radius-based validation to determine attendance status
- Displays whether the user is inside or outside the accepted range

## Design Notes
Indoor geolocation can be inconsistent depending on the device, browser, Wi-Fi signal, and GPS accuracy. Because of that, the demo is designed to account for real-world accuracy limitations instead of assuming perfect location precision.

## Integration Plan
This module is intended to connect to the backend once the backend portion of the project is completed.

Planned workflow:
1. The web or mobile client collects the user's location
2. The location is sent to the backend
3. The backend uses geolocation validation logic to compare the user's position to the classroom location
4. The system returns a VALID or INVALID attendance result

## Current Status
This module is currently implemented as a standalone prototype/demo. It is meant to show the geolocation logic and user flow until full backend integration is available.

## Future Improvements
- Connect geolocation validation to backend API routes
- Store validation attempts for attendance records
- Combine location validation with face recognition results
