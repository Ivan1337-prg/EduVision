import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const logoImage = require('../assets/EduVisionLogo.png');

const AttendanceScreen = ({ navigation, route }) => {
  const { studentCode, sessionId, locationStatus, locationText, recentScanTimestamp, attendanceStatus } = route.params;

  const faceScanRoute = () => {
    if (attendanceStatus != 'confirmed') { 
      navigation.navigate('FaceScan', { studentCode, sessionId })
    }
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
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Attendance Record</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>Checked In</Text>
        </View>
        <Text style={styles.bigScore}>{attendanceStatus === 'confirmed' ? '100%' : '50%'}</Text>
        <Text style={styles.subtitle}>{attendanceStatus === 'confirmed' ? 'Attendance Confirmed' : 'First Scan Received'}</Text>
      </View>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>Verification image</Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Check-In Timestamp</Text>
        <Text style={styles.infoValue}>{recentScanTimestamp}</Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Attendance Status</Text>
        <Text style={styles.infoValue}>{attendanceStatus === 'confirmed' ? 'Confirmed' : 'Present'}</Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Location Status</Text>
        <Text style={styles.infoValue}>{locationStatus}</Text>
      </View>
      <View style={styles.footerCard}>
        <Text style={styles.footerLabel}>{locationText}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={faceScanRoute}>
        <Text style={styles.buttonText}>Scan Again</Text>
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
    fontSize: 62,
    fontWeight: '800',
    color: '#166534',
  },
  subtitle: {
    color: '#475569',
    marginTop: 8,
    fontSize: 16,
  },
  imagePlaceholder: {
    backgroundColor: '#d1fae5',
    borderRadius: 24,
    height: 220,
    marginBottom: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#14532d',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#fff',
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
  footerCard: {
    marginTop: 8,
    marginBottom: 22,
    backgroundColor: '#e2e8f0',
    borderRadius: 18,
    padding: 16,
  },
  footerLabel: {
    color: '#334155',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#166534',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AttendanceScreen;
