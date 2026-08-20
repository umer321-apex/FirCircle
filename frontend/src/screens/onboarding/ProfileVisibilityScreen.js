import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { useOnboardingContext } from '../../context/OnboardingContext';
import { useAuthContext } from '../../context/AuthContext';
import theme from '../../constants/theme';

const VISIBILITY_OPTIONS = [
  {
    key: 'public',
    label: 'Public',
    description: 'Anyone can see your progress, posts, and squad stats',
  },
  {
    key: 'private',
    label: 'Private',
    description: 'Only approved friends can see your activity',
  },
];

export default function ProfileVisibilityScreen() {
  const { onboardingData, resetOnboardingData } = useOnboardingContext();
  const { updateUser } = useAuthContext();

  const [selectedVisibility, setSelectedVisibility] = useState('public');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.patch('/users/me/onboarding', {
        goal: onboardingData.goal,
        age: onboardingData.age,
        sex: onboardingData.sex,
        homeGym: onboardingData.homeGym,
        visibility: selectedVisibility,
      });

      await updateUser(response.data.user);
      resetOnboardingData();
      // RootNavigator automatically switches to MainTabNavigator once
      // AuthContext's isOnboarded becomes true
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(message);
      console.error(`[ProfileVisibilityScreen] Onboarding submit error: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your visibility</Text>
      <Text style={styles.subtitle}>You can change this anytime in Settings</Text>

      <View style={styles.list}>
        {VISIBILITY_OPTIONS.map((option) => {
          const isSelected = selectedVisibility === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelectedVisibility(option.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                {option.label}
              </Text>
              <Text style={styles.cardDescription}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleFinish}
        disabled={isSubmitting}
        activeOpacity={0.85}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.white} />
        ) : (
          <Text style={styles.buttonText}>Finish Setup</Text>
        )}
      </TouchableOpacity>
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
  list: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  cardLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardLabelSelected: {
    color: theme.colors.primary,
  },
  cardDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});