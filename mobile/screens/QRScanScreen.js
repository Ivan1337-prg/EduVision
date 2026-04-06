import React, { useState } from 'react';

import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const logoImage = require('../assets/EduVisionLogo.png');

const QRScanScreen = ({ navigation, route }) => {
    const { studentId, studentName } = route.params;
    const [hasCameraPermission, setHasCameraPermission] = useCameraPermissions();

    const requestPermissions = async () => {
        const cameraResult = await requestPermission();
        setHasCameraPermission(cameraResult.status === 'granted');
    }

    const handleCapture = () => {
        navigation.navigate('FaceScan', {
            studentId: studentId,
            studentName: studentName,
        });
    };

    return(
        <View style={styles.container}>
            <View style={styles.topBar}>
                <Image source={logoImage} style={styles.logo} resizeMode="contain" />
                <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
                    <View style={styles.menuLine} />
                    <View style={styles.menuLine} />
                    <View style={styles.menuLine} />
                </TouchableOpacity>
            </View>
            <Text style={styles.header}>Session QR Scan</Text>
            <View style={styles.scannerWrapper}>
                <CameraView style={StyleSheet.absoluteFillObject} facing="back" /* TODO: Add QR Code Scanning Feature *//>
            </View>
            <Text style={styles.scanHint}>Scan manually or press the camera button to capture.</Text>
            <TouchableOpacity style={styles.scanButton} onPress={handleCapture}>
                <Text style={styles.scanButtonIcon}>📷</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    padding: 20
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
    marginBottom: 120,
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
});

export default QRScanScreen;