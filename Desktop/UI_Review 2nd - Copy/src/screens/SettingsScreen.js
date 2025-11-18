import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../styles/DesignSystem';
import ScreenHeader from './components/ScreenHeader';

const SettingsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" navigation={navigation} showLogo={true} />
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
});

export default SettingsScreen;