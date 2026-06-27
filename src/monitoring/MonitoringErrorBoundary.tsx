import { type ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { captureSentryException } from '@/src/monitoring/sentry';
import { recordError } from '@/src/monitoring/crashlytics';

export function MonitoringErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    recordError(error, 'react-error-boundary');
    captureSentryException(error, 'react-error-boundary');
  }, [error]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>An unexpected error occurred. You can try again.</Text>
      <Pressable onPress={retry} style={styles.button}>
        <Text style={styles.buttonLabel}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
