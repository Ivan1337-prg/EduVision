import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { getAttendanceErrorMessage, validateStudentSession } from '../utils/api';
import { getCurrentAttendanceLocation } from '../utils/location';

const logoImage = require('../assets/EduVisionLogo.png');

const LoginScreen = ({ navigation }) => {
  const [studentCode, setStudentCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      const normalizedStudentCode = studentCode.trim();
      const normalizedSessionId = sessionId.trim();

      if (!normalizedStudentCode || !normalizedSessionId) {
        setError('Please enter your student code and class session Id.');
        return;
      }

      setIsLoading(true);
      setError('');
      const location = await getCurrentAttendanceLocation();
      const response = await validateStudentSession({
        studentCode: normalizedStudentCode,
        sessionId: normalizedSessionId,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      navigation.navigate('FaceScan', {
        studentCode: response.student.student_code,
        studentName: response.student.student_name,
        sessionId: response.session_id,
      });
    } catch (error) {
      setError(getAttendanceErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <Image source={logoImage} style={styles.logo} resizeMode="contain" accessibilityLabel="EduVision" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Check-In</Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.title}>Student Login</Text>
              <View style={styles.welcomeCard}>
                <View pointerEvents="none" accessible={false} style={styles.welcomeCircleTop} />
                <View pointerEvents="none" accessible={false} style={styles.welcomeCircleBottom} />
                <Text style={styles.welcomeTitle}>Ready to check in?</Text>
                <Text style={styles.welcomeText}>Enter your student code and session ID below.</Text>
              </View>
              <Text style={styles.label}>Student Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your student code"
                placeholderTextColor="#94a3b8"
                value={studentCode}
                onChangeText={(value) => {
                  setStudentCode(value);
                  if (error) setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <Text style={styles.label}>Session ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your class session id"
                placeholderTextColor="#94a3b8"
                value={sessionId}
                onChangeText={(value) => {
                  setSessionId(value);
                  if (error) setError('');
                }}
                autoCorrect={false}
                returnKeyType="done"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Continue To Face Scan</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecfdf5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 26,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    color: '#115e30',
    letterSpacing: 0.15,
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
  welcomeCard: {
    minHeight: 128,
    borderRadius: 22,
    backgroundColor: '#e6f8ed',
    borderWidth: 1,
    borderColor: '#d1efdd',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  welcomeCircleTop: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#d5f0df',
    top: -65,
    right: -40,
  },
  welcomeCircleBottom: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 16,
    borderColor: '#d5f0df',
    bottom: -64,
    left: -35,
  },
  welcomeTitle: {
    color: '#115e30',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    color: '#3f6650',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 240,
  },
  label: {
    color: '#243e2e',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#166534',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#14532d',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 12,
  },
});

export default LoginScreen;
