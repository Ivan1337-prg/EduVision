# EduVision Mobile Prototype

This is the EduVision student mobile prototype built with Expo and React Native. The project includes a login screen, QR scan flow, and attendance confirmation UI.

## Summary

- Uses Expo SDK 54 and React Native for a mobile-first experience.
- Includes a student login screen with a branded login card.
- Supports QR code scanning with camera permission handling.
- Displays attendance confirmation and location status.
- Can run locally in the browser using Expo web for fast development.

## Run locally (recommended web mode)

1. Open a terminal and install dependencies:

```powershell
cd d:\Code\EduVision\mobile
npm install
```

2. Start the Expo project in web mode:

```powershell
npx expo start --web
```

3. Open the local browser link shown by Expo, such as:

```text
http://localhost:8081
```

4. If web mode is missing dependencies, install `react-native-web`:

```powershell
npx expo install react-native-web
```

5. Reload the browser after installing dependencies.

## Run on mobile (if you want)

1. Start Expo:

```powershell
npx expo start
```

2. Open the QR code in Expo Go on your iOS or Android device.

> Note: Expo Go must support SDK 54 and the app may still work best in browser mode for local development.

## Features

- Student login screen styled for UNT green branding
- QR scanner screen for classroom check-in
- Attendance result screen with status and scan details
- Location permission and current location display

## Notes

- This is a UI prototype; backend integration is not included.
- The web mode is the fastest way to run the app locally while the Expo mobile path is still being stabilized.
