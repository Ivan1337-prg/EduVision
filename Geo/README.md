# Geo Module - Attendance Validation

## Overview

This module is responsible for handling geolocation-based validation in the attendance system. It checks whether a user is physically within a certain distance of a classroom location before allowing attendance to be marked.

## Purpose

The goal of this module is to add an extra layer of verification by confirming the user's physical presence, not just their identity.

## Functionality

* Calculates distance between two GPS coordinates using a standard formula
* Compares the user's location to a predefined classroom location
* Determines if the user is within an allowed radius
* Returns a result indicating whether attendance is valid or not

## Design Notes

A radius of **15 meters** is used to account for indoor GPS inaccuracies. This helps prevent false negatives caused by weak or inconsistent location signals inside buildings.

## Integration Plan

This module is designed to be integrated into the backend service.

Planned workflow:

1. The frontend (mobile or web app) collects the user's GPS coordinates
2. The coordinates are sent to the backend
3. This module processes the data and checks the distance
4. A response is returned indicating VALID or INVALID attendance

## Current Status

This module is currently implemented and tested as a standalone component.
It is ready to be connected to the backend once the API layer is completed.

## Future Improvements

* Connect to backend API endpoints
* Accept real-time GPS data from frontend applications
* Support multiple classroom locations
* Log attendance validation attempts
