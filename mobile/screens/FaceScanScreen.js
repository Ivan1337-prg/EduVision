import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getAttendanceErrorMessage, submitFaceValidation } from '../utils/api';
import { getCurrentAttendanceLocation } from '../utils/location';

const logoImage = require('../assets/EduVisionLogo.png');
const LIVENESS_PROMPT_DELAY_MS = 2500;
const LIVENESS_PROMPTS = ['Turn your head left.', 'Turn your head right.'];

function buildFriendlyStatusMessage(serverResponse) {
  if (serverResponse?.reason === 'student_id_face_mismatch') {
    return 'The face in the camera does not match the student ID you entered. Check the student ID and try again.';
  }

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
  const [permission, requestPermission] = useCameraPermissions();
  const [statusMessage, setStatusMessage] = useState('');
  const [livenessPromptIndex, setLivenessPromptIndex] = useState(0);
  const [livenessComplete, setLivenessComplete] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain !== false) {
      requestPermission();
    }
  }, [permission?.canAskAgain, permission?.granted, requestPermission]);

  useEffect(() => {
    if (!permission?.granted || livenessComplete) {
      return undefined;
    }

    const timer = setTimeout(() => {
      if (livenessPromptIndex >= LIVENESS_PROMPTS.length - 1) {
        setLivenessComplete(true);
        return;
      }

      setLivenessPromptIndex((currentIndex) => currentIndex + 1);
    }, LIVENESS_PROMPT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [livenessComplete, livenessPromptIndex, permission?.granted]);

  const livenessMessage = livenessComplete
    ? 'Face the camera in good lighting, then capture your photo.'
    : LIVENESS_PROMPTS[livenessPromptIndex];

  const handleCapture = async () => {
    try {
      if (isCapturing) {
        return;
      }

      if (!livenessComplete) {
        setStatusMessage('Complete the live face check before capturing.');
        return;
      }

      setIsCapturing(true);
      setStatusMessage('Checking your current location...');

      const location = await getCurrentAttendanceLocation();
      const accuracyMessage = location.accuracy === null
        ? 'Location found.'
        : `Location found with ±${Math.round(location.accuracy)} meter accuracy.`;
      setStatusMessage(`${accuracyMessage} Capturing face...`);

      if (!cameraRef.current) {
        setStatusMessage('Camera starting up. Try again.');
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      const photoResponse = await fetch(photo.uri);
      const photoBlob = await photoResponse.blob();

      const serverResponse = await submitFaceValidation({
        sessionId,
        studentCode,
        imageBlob: photoBlob,
        latitude: location.latitude,
        longitude: location.longitude,
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
      setStatusMessage(getAttendanceErrorMessage(error));
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#166534" />
        <Text style={styles.loadingText}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>Camera permission is required to capture your face.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" accessibilityLabel="EduVision" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Step 2</Text>
          </View>
        </View>

        <Text style={styles.header}>Attendance Face Scan</Text>

        <View style={styles.infoRow}>
          <View style={styles.chip}>
            <Text style={styles.infoLabel}>Student Name</Text>
            <Text style={styles.chipText}>{studentName}</Text>
          </View>
          <View style={styles.chipOutline}>
            <Text style={styles.infoLabel}>Session</Text>
            <Text selectable style={styles.chipOutlineText}>{sessionId}</Text>
          </View>
        </View>

        <View style={styles.scannerWrapper}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="front"
            mode="picture"
            onMountError={(error) => setStatusMessage(error?.message || 'Camera error. Try again.')}
          />
        </View>

        <Text accessibilityLiveRegion="polite" style={styles.scanHint}>
          {livenessMessage}
        </Text>

        <TouchableOpacity
          style={[styles.scanButton, (!livenessComplete || isCapturing) && styles.scanButtonDisabled]}
          onPress={handleCapture}
          disabled={isCapturing || !livenessComplete}
          accessibilityRole="button"
          accessibilityState={{ disabled: isCapturing || !livenessComplete, busy: isCapturing }}
        >
          {isCapturing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.scanButtonText}>Capture Face</Text>
          )}
        </TouchableOpacity>

        <Text accessibilityLiveRegion="polite" style={styles.status}>
          {statusMessage || (livenessComplete
            ? 'Ready to capture. Your location will be checked next.'
            : 'Follow the head-movement prompts to get ready.')}
        </Text>

        <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.secondaryText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecfdf5',
  },
  content: {
    padding: 20,
    paddingBottom: 12,
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
    width: 140,
    height: 88,
    flexShrink: 1,
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
    marginTop: 4,
    marginBottom: 18,
    color: '#14532d',
    letterSpacing: 0.2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  chip: {
    flex: 1,
    backgroundColor: '#dff6e9',
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipText: {
    color: '#14532d',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  chipOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1efdd',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipOutlineText: {
    color: '#3f6650',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  infoLabel: {
    color: '#526b5c',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  scannerWrapper: {
    width: '100%',
    aspectRatio: 1.03,
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
    lineHeight: 21,
    textAlign: 'center',
    minHeight: 42,
    marginBottom: 22,
  },
  scanButton: {
    alignSelf: 'center',
    width: '60%',
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#166534',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#14532d',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 20,
  },
  scanButtonDisabled: {
    backgroundColor: '#577565',
    shadowOpacity: 0,
    elevation: 0,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  status: {
    color: '#166534',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    minHeight: 42,
    marginBottom: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 12,
    minHeight: 48,
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
