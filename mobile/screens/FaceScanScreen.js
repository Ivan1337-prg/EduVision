import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { submitFaceValidation } from '../utils/api';

const logoImage = require('../assets/EduVisionLogo.png');

function buildFriendlyStatusMessage(serverResponse) {
  if (serverResponse?.matched === false) {
    return 'We could not confidently verify your face. Move into better light, face the camera directly, and try again.';
  }

  if (serverResponse?.message === 'confirmation too early') {
    return `Your first check-in was saved. Please come back in ${serverResponse.seconds_until_confirmation} seconds to confirm attendance.`;
  }

  return serverResponse?.message || 'We could not verify your face. Please try again.';
}

const FaceScanScreen = ({ navigation, route }) => {
  const { studentCode, studentName, sessionId } = route.params;
  const [hasCameraPermission, requestPermission] = useCameraPermissions();
  const [statusMessage, setStatusMessage] = useState(`Ready to capture ${studentName}'s face.`);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const cameraResult = await requestPermission();

    if (!cameraResult.granted) {
      setStatusMessage('Camera access denied.');
    }
  };

  const handleCapture = async () => {
    try {
      if (isCapturing) {
        return;
      }

      setIsCapturing(true);
      setStatusMessage('Capturing and verifying face...');

      if (!cameraRef.current) {
        setStatusMessage('Camera starting up. Try again.');
        return;
      }

      const photo = await cameraRef.current.takePictureAsync();
      const photoResponse = await fetch(photo.uri);
      const photoBlob = await photoResponse.blob();

      const serverResponse = await submitFaceValidation({
        sessionId,
        studentCode,
        imageBlob: photoBlob,
      });

      if (!Array.isArray(serverResponse.attendance)) {
        setStatusMessage(buildFriendlyStatusMessage(serverResponse));
        return;
      }

      const attendanceMap = Object.fromEntries(
        serverResponse.attendance.map((row) => [row.student_code, row]),
      );
      const studentAttendance = attendanceMap[studentCode];

      if (!studentAttendance) {
        throw new Error('Attendance row not found for this student.');
      }

      const recentAttendanceTimestamp = studentAttendance.fifteen_min_confirm || studentAttendance.first_check_in;
      const recentScanTimestamp = recentAttendanceTimestamp
        ? new Date(recentAttendanceTimestamp).toLocaleString()
        : 'Pending';

      navigation.navigate('Attendance', {
        studentCode,
        studentName: serverResponse.student_name || studentName,
        sessionId,
        recentScanTimestamp,
        attendanceStatus: studentAttendance.status,
        confidenceScore: serverResponse.confidence_score,
        message: serverResponse.message,
      });
    } catch (error) {
      setStatusMessage(error.message || 'We could not verify your face. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!hasCameraPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#166534" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!hasCameraPermission.granted) {
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
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Step 2</Text>
        </View>
      </View>

      <Text style={styles.header}>Attendance Face Scan</Text>

      <View style={styles.infoRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{studentName}</Text>
        </View>
        <View style={styles.chipOutline}>
          <Text style={styles.chipOutlineText}>Session {sessionId}</Text>
        </View>
      </View>

      <View style={styles.scannerWrapper}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front" />
      </View>

      <Text style={styles.scanHint}>Align your face in the frame and capture one clear photo.</Text>

      <TouchableOpacity style={styles.scanButton} onPress={handleCapture} disabled={isCapturing}>
        {isCapturing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.scanButtonText}>Capture Face</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.status}>{statusMessage}</Text>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
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
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
  },
  badgeText: {
    color: '#166534',
    fontWeight: '700',
  },
  header: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    color: '#14532d',
    letterSpacing: 0.2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  chip: {
    flex: 1,
    backgroundColor: '#d1fae5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  chipText: {
    color: '#14532d',
    fontWeight: '700',
    textAlign: 'center',
  },
  chipOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#86efac',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  chipOutlineText: {
    color: '#166534',
    fontWeight: '700',
    textAlign: 'center',
  },
  scannerWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000000',
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
    minWidth: 160,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#166534',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#14532d',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    marginBottom: 14,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  status: {
    color: '#166534',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryText: {
    color: '#166534',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
  },
  loadingText: {
    marginTop: 12,
    color: '#14532d',
    fontSize: 16,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ecfdf5',
  },
  messageText: {
    color: '#14532d',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default FaceScanScreen;