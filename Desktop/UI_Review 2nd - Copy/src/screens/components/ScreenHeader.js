import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows } from '../../styles/DesignSystem';

const ScreenHeader = ({ 
  title, 
  navigation, 
  showBackButton = true, 
  rightAction,
  leftAction,
  backgroundColor = '#2241DD',
  statusBarStyle = 'light-content',
  subtitle,
  showLogo = false
}) => {
  return (
    <>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      <LinearGradient
        colors={[backgroundColor, '#1E3A8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.leftSection}>
            {leftAction ? (
              leftAction
            ) : (
              <>
                {showBackButton && navigation && (
                  <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                {showLogo && (
                  <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                      <Image 
                        source={require('../../assets/nexa2.png')} 
                        style={styles.logoImage}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
          
          <View style={styles.centerSection}>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>{title}</Text>
              {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
            </View>
          </View>
          
          <View style={styles.rightSection}>
            {rightAction || <View style={styles.placeholder} />}
          </View>
        </View>
        
        {/* Professional bottom border */}
        <View style={styles.headerBottomBorder} />
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 45,
    paddingBottom: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    minHeight: 40,
    paddingVertical: 4,
  },
  leftSection: {
    width: 80,
    alignItems: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rightSection: {
    width: 80,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    marginLeft: 12,
    marginRight: 8,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    overflow: 'hidden',
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'left',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1.5,
    lineHeight: 26,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'left',
    marginLeft: 8,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    lineHeight: 20,
  },
  headerBottomBorder: {
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 6,
    marginHorizontal: Spacing.lg,
    borderRadius: 1,
  },
  placeholder: {
    width: 44,
    height: 44,
  },
});

export default ScreenHeader;



