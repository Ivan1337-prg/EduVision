import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const logoImage = require('../assets/EduVisionLogo.png');

function formatConfidence(confidenceScore) {
  if (typeof confidenceScore !== 'number') {
    return 'N/A';
  }

  return `${Math.round(confidenceScore * 100)}%`;
}

const AttendanceScreen = ({ navigation, route }) => {
  const {
    studentCode,
    studentName,
    sessionId,
    recentScanTimestamp,
    attendanceStatus,
    confidenceScore,
    message,
  } = route.params;

  const normalizedStatus = attendanceStatus === 'confirmed' ? 'Confirmed' : 'Present';

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Image source={logoImage} style={styles.logo} resizeMode="contain" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Step 3</Text>
        </View>
      </View>

      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Attendance Recorded</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>{normalizedStatus}</Text>
        </View>
        <Text style={styles.bigScore}>{formatConfidence(confidenceScore)}</Text>
        <Text style={styles.subtitle}>{message}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Student</Text>
        <Text style={styles.infoValue}>{studentName} ({studentCode})</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Session ID</Text>
        <Text style={styles.infoValue}>{sessionId}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Timestamp</Text>
        <Text style={styles.infoValue}>{recentScanTimestamp}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Attendance Status</Text>
        <Text style={styles.infoValue}>{normalizedStatus}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Back to Login</Text>
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
  headerBar: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: '#14532d',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  statusChip: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 18,
  },
  statusText: {
    color: '#166534',
    fontWeight: '700',
  },
  bigScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#166534',
  },
  subtitle: {
    color: '#475569',
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#166534',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AttendanceScreen;