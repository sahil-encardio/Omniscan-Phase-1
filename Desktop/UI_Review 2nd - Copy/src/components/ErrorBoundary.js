import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.error('ErrorBoundary caught error:', this.state.error);
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text style={styles.details}>
            Please restart the app. If the problem persists, contact support.
          </Text>
          {this.state.error?.stack && (
            <Text style={[styles.details, { fontSize: 10, marginTop: 10 }]}>
              {this.state.error.stack.substring(0, 200)}
            </Text>
          )}
        </View>
      );
    }

    // Ensure children are always rendered
    try {
      return this.props.children || (
        <View style={styles.container}>
          <Text>No content to display</Text>
        </View>
      );
    } catch (error) {
      console.error('Error rendering children in ErrorBoundary:', error);
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Render Error</Text>
          <Text style={styles.message}>{error.message}</Text>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  message: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
    textAlign: 'center',
  },
  details: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default ErrorBoundary;

