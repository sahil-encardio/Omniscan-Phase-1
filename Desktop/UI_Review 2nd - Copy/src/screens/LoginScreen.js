import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// --- Component Definition ---
const LoginScreen = ({ navigation }) => {
  const { login, isLoading } = useAuth();
  
  // --- State for input focus ---
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // --- State for input values ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // --- Animation Hooks ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Enhanced entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, logoScaleAnim]);

  // --- Button Animation Handlers ---
  const handlePressIn = () => {
    // Scale down animation on button press
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    // Scale back animation on button release
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
  };

  const slideAnimatedStyle = {
    transform: [{ translateY: slideAnim }],
  };

  const logoAnimatedStyle = {
    transform: [{ scale: logoScaleAnim }],
  };

  // --- Render Method ---
  return (
    <ImageBackground
      source={require('../assets/background2.png')} // NOTE: Update with your background image path
      style={styles.background}
      // --- MODIFICATION START ---
      // The imageStyle prop applies styles directly to the background image.
      // We make the image wider than the screen and use a negative 'left'
      // value to pull it left, which makes its content appear shifted to the right.
      imageStyle={styles.backgroundImageStyle}
      // --- MODIFICATION END ---
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Logo Container: Positioned at the top-left */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          {/* NOTE: Make sure the path to your logo is correct.
            I'm using './assets/logo.png' as a placeholder.
            You should replace this with the actual path to your 'image_f90699.jpg' file.
          */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/logo1.png')}
              style={styles.logo}
            />
            <View style={styles.logoGlow} />
          </View>
          <Text style={styles.tagline}>Monitor. Analyze. Protect.</Text>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'position' : undefined}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[{ opacity: fadeAnim }, slideAnimatedStyle]}>
              {/* Glassmorphism Card */}
              <BlurView intensity={70} tint="dark" style={styles.glassmorphism}>
                <View style={styles.gradientOverlay} />
               <Text style={styles.title}>Welcome To</Text> 
              <Text style={styles.title2}>NexaWave Omniscan</Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <FontAwesome name="envelope" size={14} color="rgba(255, 255, 255, 0.8)" /> Email
                </Text>
                <TextInput
                  style={[styles.input, emailFocused && styles.inputFocused]}
                  placeholder="name@email.com"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <FontAwesome name="lock" size={14} color="rgba(255, 255, 255, 0.8)" /> Password
                </Text>
                <TextInput
                  style={[styles.input, passwordFocused && styles.inputFocused]}
                  placeholder="••••••"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
              </View>
              {/* Forgot Password */}
              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>


              {/* Login Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={async () => {
                  // Basic validation
                  if (email.trim() && password.trim()) {
                    const result = await login(email, password);
                    if (!result.success) {
                      Alert.alert('Login Failed', result.error);
                    }
                  } else {
                    Alert.alert('Validation Error', 'Please enter both email and password');
                  }
                }}
                disabled={isLoading}
              >
                <Animated.View style={[styles.button, animatedStyle]}>
                  <View style={styles.buttonGradient} />
                  <Text style={styles.buttonText}>
                    <FontAwesome name="sign-in" size={16} color="#fff" /> {isLoading ? 'Signing In...' : 'Login'}
                  </Text>
                  <View style={styles.buttonShine} />
                </Animated.View>
              </TouchableOpacity>
              {/* Social Logins */}
              <View style={styles.socialLoginContainer}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.socialLoginText}>or login with</Text>
                  <View style={styles.dividerLine} />
                </View>
                <View style={styles.socialIconsContainer}>
                  <TouchableOpacity style={styles.socialIcon}>
                    <View style={styles.googleIconContainer}>
                      <Image 
                        source={require('../assets/google_icon.webp')} 
                        style={styles.socialLogo}
                        resizeMode="cover"
                      />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialIcon}>
                    <View style={styles.googleIconContainer}>
                      <Image 
                        source={require('../assets/facebook_icon.png')} 
                        style={styles.socialLogo}
                        resizeMode="cover"
                      />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialIcon}>
                    <View style={styles.googleIconContainer}>
                      <Image 
                        source={require('../assets/twitter_icon.jpg')} 
                        style={styles.socialLogo}
                        resizeMode="cover"
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign Up */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity>
                  <Text style={styles.signUpLink}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  // --- MODIFICATION START ---
  // Added a new style for the background image itself.
  // You can adjust 'width' and 'left' to control the amount of shift.
  backgroundImageStyle: {
    width: width + 100, // Make the image 100px wider than the screen
    left: -50,          // Shift the image 50px to the left (pulling content right)
  },
  // --- MODIFICATION END ---
  safeArea: {
    flex: 1,
  },
  logoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 40,
    left: 20,
    zIndex: 10,
    alignItems: 'flex-start',
  },
  logoWrapper: {
    position: 'relative',
    shadowColor: '#76a6e4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  logo: {
    width: 190,
    height: 180,
    resizeMode: 'contain',
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(118, 166, 228, 0.1)',
    borderRadius: 20,
    zIndex: -1,
  },
  container: {
    flex: 1,
    marginTop: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
   tagline: {
    color: '#3141cbff',
    fontSize: 18,
    fontWeight: 'bold',
    fontWeight: '600',
    marginTop: -60,
    marginLeft: 10,
  },
  glassmorphism: {
    width: width * 0.85,
    padding: 40,
    borderRadius: 25,
    alignItems: 'stretch',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    backgroundColor: 'rgba(240, 248, 255, 0.02)',
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(173, 216, 230, 0.005)',
    borderRadius: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  title2: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#76a6e4ff',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
  },

  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputFocused: {
    borderColor: '#76a6e4ff',
    shadowColor: '#76a6e4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },

  forgotPassword: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007aff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  buttonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(118, 166, 228, 0.2)',
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-25deg' }],
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
    signUpText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  signUpLink: {
    color: '#007aff',
    fontWeight: 'bold',
  },
  socialIcon: {
    marginHorizontal: 15,
  },
  socialIconBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  googleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  socialLogo: {
    width: 28,
    height: 28,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  socialLoginContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  socialLoginText: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 15,
    fontSize: 14,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default LoginScreen;
