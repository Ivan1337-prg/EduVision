import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" accessibilityLabel="EduVision" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Step 3</Text>
          </View>
        </View>

        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Attendance Recorded</Text>
        </View>

        <View style={styles.card}>
          <View pointerEvents="none" accessible={false} style={styles.accentCircleTop} />
          <View pointerEvents="none" accessible={false} style={styles.accentCircleBottom} />
          <View style={styles.statusChip}>
            <Text accessible={false} style={styles.statusCheck}>✓</Text>
            <Text style={styles.statusText}>{normalizedStatus}</Text>
          </View>
          <Text style={styles.bigScore}>{formatConfidence(confidenceScore)}</Text>
          <Text style={styles.scoreLabel}>Embedding similarity score</Text>
          <View style={styles.cardDivider} />
          <Text style={styles.subtitle}>{message || 'Check-in successful'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Student</Text>
          <Text style={styles.infoValue}>{studentName} ({studentCode})</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Session ID</Text>
          <Text selectable style={[styles.infoValue, styles.sessionValue]}>{sessionId}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Timestamp</Text>
          <Text style={styles.infoValue}>{recentScanTimestamp}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Attendance Status</Text>
          <View style={styles.attendanceStatus}>
            <View accessible={false} style={styles.statusDot} />
            <Text style={[styles.infoValue, styles.attendanceStatusText]}>{normalizedStatus}</Text>
          </View>
        </View>

        <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Back to Login</Text>
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
    paddingBottom: 24,
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
  headerBar: {
    marginTop: 4,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#14532d',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#e6f8ed',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#ccebd8',
    paddingVertical: 26,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  accentCircleTop: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#d8f1e2',
    top: -80,
    right: -70,
  },
  accentCircleBottom: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 20,
    borderColor: '#d8f1e2',
    bottom: -85,
    left: -65,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
  },
  statusCheck: {
    color: '#166534',
    fontSize: 16,
    fontWeight: '700',
  },
  statusText: {
    color: '#166534',
    fontWeight: '700',
  },
  bigScore: {
    fontSize: 56,
    fontWeight: '800',
    color: '#166534',
    textAlign: 'center',
  },
  scoreLabel: {
    color: '#526b5c',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 2,
  },
  cardDivider: {
    width: 48,
    height: 2,
    backgroundColor: '#b7dec5',
    borderRadius: 1,
    marginTop: 18,
    marginBottom: 14,
  },
  subtitle: {
    color: '#166534',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0f0e6',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#526b5c',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#243e2e',
  },
  sessionValue: {
    fontSize: 14,
    lineHeight: 22,
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16834a',
  },
  attendanceStatusText: {
    color: '#166534',
    flexShrink: 1,
  },
  button: {
    backgroundColor: '#166534',
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#14532d',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default AttendanceScreen;
