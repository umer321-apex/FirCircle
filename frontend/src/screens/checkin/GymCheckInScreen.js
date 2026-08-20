import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocation } from '../../hooks/useLocation';
import checkInService from '../../services/checkInService';
import theme from '../../constants/theme';

export default function GymCheckInScreen() {
  const { getCurrentLocation, isLoading: isLocating, permissionDenied } = useLocation();

  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'auto' | 'manual' | 'error'
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const attemptCheckIn = useCallback(async () => {
    setStatus('checking');
    setErrorMessage('');

    const location = await getCurrentLocation();

    if (!location) {
      setStatus('error');
      setErrorMessage(
        permissionDenied
          ? 'Location permission denied. Enable it in your device settings, or check in manually below.'
          : 'Could not get your location. Try again or check in manually below.'
      );
      return;
    }

    try {
      const data = await checkInService.createCheckIn(location.lat, location.lng);
      setDistanceMeters(data.checkIn.distanceMeters ?? null);
      setStatus(data.checkIn.autoVerified ? 'auto' : 'manual');
    } catch (err) {
      const message = err.response?.data?.message || 'Check-in failed. Please try again.';
      console.error(`[GymCheckInScreen] Check-in error: ${message}`);
      setErrorMessage(message);
      setStatus('error');
    }
  }, [getCurrentLocation, permissionDenied]);

  // Runs automatically every time this screen comes into focus (FR-2.1)
  useFocusEffect(
    useCallback(() => {
      attemptCheckIn();
    }, [attemptCheckIn])
  );

  const handleManualCheckIn = async () => {
    // Manual fallback still sends whatever location we can get — if outside
    // radius or location fails entirely, backend still records it as unverified
    setStatus('checking');
    setErrorMessage('');

    const location = await getCurrentLocation();

    try {
      const data = location
        ? await checkInService.createCheckIn(location.lat, location.lng)
        : null;

      if (data) {
        setDistanceMeters(data.checkIn.distanceMeters ?? null);
        setStatus(data.checkIn.autoVerified ? 'auto' : 'manual');
      } else {
        setStatus('error');
        setErrorMessage('Could not determine your location for manual check-in.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Manual check-in failed.';
      console.error(`[GymCheckInScreen] Manual check-in error: ${message}`);
      setErrorMessage(message);
      setStatus('error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gym Check-In</Text>
      <Text style={styles.subtitle}>
        We check your location automatically when you open this screen
      </Text>

      <View
        style={[
          styles.statusCard,
          status === 'auto' && styles.statusCardAuto,
          status === 'manual' && styles.statusCardManual,
          status === 'error' && styles.statusCardError,
        ]}
      >
        {(status === 'idle' || status === 'checking' || isLocating) && (
          <>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.statusText}>Checking your location…</Text>
          </>
        )}

        {status === 'auto' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.iconText}>✓</Text>
            </View>
            <Text style={[styles.statusHeadline, { color: theme.colors.success }]}>
              Checked in ✓
            </Text>
            <Text style={styles.statusSubtext}>Auto-verified</Text>
            {distanceMeters !== null && (
              <Text style={styles.distanceText}>{distanceMeters}m from your home gym</Text>
            )}
          </>
        )}

        {status === 'manual' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.warning }]}>
              <Text style={styles.iconText}>✓</Text>
            </View>
            <Text style={[styles.statusHeadline, { color: theme.colors.warning }]}>
              Checked in
            </Text>
            <Text style={styles.statusSubtext}>Manual — not auto-verified</Text>
            {distanceMeters !== null && (
              <Text style={styles.distanceText}>{distanceMeters}m from your home gym</Text>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.danger }]}>
              <Text style={styles.iconText}>!</Text>
            </View>
            <Text style={[styles.statusHeadline, { color: theme.colors.danger }]}>
              Couldn't check in
            </Text>
            <Text style={styles.statusSubtext}>{errorMessage}</Text>
          </>
        )}
      </View>

      {(status === 'error' || status === 'manual') && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleManualCheckIn}
          activeOpacity={0.85}
        >
          <Text style={styles.retryButtonText}>Check in manually</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xl,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  statusCardAuto: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.surfaceLight,
  },
  statusCardManual: {
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.surfaceLight,
  },
  statusCardError: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.surfaceLight,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  iconText: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  statusText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  statusHeadline: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  distanceText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});