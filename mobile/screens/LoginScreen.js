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
import { validateStudentSession } from '../utils/api';

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
      const response = await validateStudentSession({
        studentCode: normalizedStudentCode,
        sessionId: normalizedSessionId,
      });

      navigation.navigate('FaceScan', {
        studentCode: response.student.student_code,
        studentName: response.student.student_name,
        sessionId: response.session_id,
      });
    } catch (e) {
      setError(e.message || 'Unable to validate your session.');
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
              <Image source={logoImage} style={styles.logo} resizeMode="contain" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Check-In</Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.title}>Student Login</Text>
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imageText}>Use your student ID and session ID</Text>
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
              <Text style={styles.helperText}>Student IDs: 55 Bryce, 56 Eneojo, 57 Roman, 58 Taras, 59 Taron</Text>
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
    width: 76,
    height: 76,
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
  imagePlaceholder: {
    height: 160,
    borderRadius: 22,
    backgroundColor: '#d1fae5',
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    color: '#115e30',
    fontSize: 18,
    fontWeight: '700',
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
  helperText: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
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
