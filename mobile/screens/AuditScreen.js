import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';

const logoImage = require('../assets/EduVisionLogo.png');

const AuditScreen = ({ navigation }) => {
  const items = [
    {
      title: 'Attendance Records',
      subtitle: 'View student attendance logs',
    },
    {
      title: 'Facial Data Records',
      subtitle: 'View student face scan logs',
    },
    {
      title: 'Student User Actions',
      subtitle: 'View student app activity',
    },
    {
      title: 'Admin User Actions',
      subtitle: 'View admin activity logs',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Image source={logoImage} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Audit</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {items.map((item) => (
          <TouchableOpacity key={item.title} style={styles.card} activeOpacity={0.85}>
            <View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.cardArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  backText: {
    fontSize: 22,
    color: '#14532d',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: '#14532d',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  cardArrow: {
    fontSize: 22,
    color: '#14532d',
  },
});

export default AuditScreen;
