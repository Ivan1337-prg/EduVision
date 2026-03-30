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
} from 'react-native';

const logoImage = require('../assets/EduVisionLogo.png');

const LoginScreen = ({ navigation }) => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!studentId.trim() || !password.trim()) {
      setError('Please enter your student ID and password.');
      return;
    }

    navigation.navigate('QRScan', {
      studentId: studentId.trim(),
      studentName: 'Student',
    });
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
              <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <Text style={styles.title}>Student Login</Text>
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imageText}>Login Illustration</Text>
              </View>
              <Text style={styles.label}>Student ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your university ID"
                placeholderTextColor="#94a3b8"
                value={studentId}
                onChangeText={(value) => {
                  setStudentId(value);
                  if (error) setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (error) setError('');
                }}
                secureTextEntry
                autoCorrect={false}
                returnKeyType="done"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Go To Scan</Text>
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
  linkText: {
    color: '#166534',
    textAlign: 'right',
    marginBottom: 20,
    fontWeight: '600',
    letterSpacing: 0.25,
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
