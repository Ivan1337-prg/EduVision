import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
 
const logoImage = require('../assets/EduVisionLogo.png');
 
const QRCodeScreen = ({ navigation, route }) => {
  const { studentId, studentName } = route.params;
  const [hasCameraPermission, setHasCameraPermission] = useCameraPermissions();
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Ready for facial capture.');
  const [locationText, setLocationText] = useState('Checking location...');
 
  useEffect(() => {
    requestPermissions();
  }, []);
 
  const requestPermissions = async () => {
    const cameraResult = await requestPermission();
    setHasCameraPermission(cameraResult.status === 'granted');
 
    const locationResult = await Location.requestForegroundPermissionsAsync();
    setHasLocationPermission(locationResult.status === 'granted');
 
    if (locationResult.status === 'granted') {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const formatted = `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}`;
      setLocationText(`Current location: ${formatted}`);
    } else {
      setLocationText('Location permission is required to verify presence in class.');
    }
  };
 
  const handleCapture = async () => {
    setStatusMessage('Capturing face...');
 
    let locationStatus = 'Unknown';
    let locationTextCopy = locationText;
 
    if (hasLocationPermission) {
      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        const current = `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}`;
        locationTextCopy = `Current location: ${current}`;
        locationStatus = isInClassroom(location.coords.latitude, location.coords.longitude)
          ? 'In Class'
          : 'Outside Class';
      } catch (error) {
        locationStatus = 'Location unavailable';
      }
    }
 
    navigation.navigate('Attendance', {
      studentId,
      studentName,
      scanData: 'Face image captured',
      scannedAt: new Date().toLocaleTimeString(),
      locationStatus,
      locationText: locationTextCopy,
    });
  };
 
  const isInClassroom = (latitude, longitude) => {
    const classLat = 37.4220;
    const classLon = -122.0841;
    const distanceMeters = getDistanceFromLatLonInMeters(latitude, longitude, classLat, classLon);
    return distanceMeters < 300;
  };
 
  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };
 
  if (hasCameraPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#166534" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }
 
  if (hasCameraPermission === false) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>Camera permission is required to capture your face.</Text>
      </View>
    );
  }
 
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Image source={logoImage} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.7} onPress={() => navigation.navigate('Audit')}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
      </View>
      <Text style={styles.header}>Attendance Scan</Text>
      <View style={styles.infoRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Session Active</Text>
        </View>
        <View style={styles.chipOutline}>
          <Text style={styles.chipOutlineText}>Location Required</Text>
        </View>
      </View>
      <View style={styles.scannerWrapper}>
        <CameraView style={StyleSheet.absoluteFillObject} facing="front" />
      </View>
      <Text style={styles.scanHint}>Scan manually or press the camera button to capture.</Text>
      <TouchableOpacity style={styles.scanButton} onPress={handleCapture}>
        <Text style={styles.scanButtonIcon}>📷</Text>
      </TouchableOpacity>
      <Text style={styles.status}>{statusMessage}</Text>
      <Text style={styles.location}>{locationText}</Text>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    color: '#14532d',
    letterSpacing: 0.2,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 4,
  },
  logo: {
    width: 72,
    height: 72,
  },
  menuButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: '#14532d',
    marginVertical: 2,
  },
  scannerWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#d1fae5',
  },
  scanHint: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 14,
  },
  scanButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#14532d',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    marginBottom: 14,
  },
  scanButtonIcon: {
    fontSize: 32,
  },
  status: {
    color: '#166534',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  location: {
    color: '#334155',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 18,
  },
  captureButton: {
    backgroundColor: '#166534',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  captureText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryText: {
    color: '#166534',
    fontSize: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chip: {
    backgroundColor: '#d1fae5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  chipText: {
    color: '#14532d',
    fontWeight: '700',
  },
  chipOutline: {
    borderWidth: 1,
    borderColor: '#14532d',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  chipOutlineText: {
    color: '#14532d',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#14532d',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ecfdf5',
  },
  messageText: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'center',
  },
});
 
export default QRCodeScreen;
