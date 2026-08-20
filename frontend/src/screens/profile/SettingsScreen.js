import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../../context/AuthContext';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import userService from '../../services/userService';
import theme from '../../constants/theme';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, updateUser, logout } = useAuthContext();
  const { isPremium, setIsPremium } = useSubscriptionContext();

  const [isPrivate, setIsPrivate] = useState(user?.visibility === 'private');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleVisibilityToggle = async (value) => {
    const newVisibility = value ? 'private' : 'public';
    setIsPrivate(value);
    setError('');
    setIsSaving(true);

    try {
      const data = await userService.updateProfile({ visibility: newVisibility });
      await updateUser(data.user);
    } catch (err) {
      console.error(`[SettingsScreen] Visibility update error: ${err.message}`);
      setError('Could not update visibility. Please try again.');
      setIsPrivate(!value); // revert on failure
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Private Profile</Text>
            <Text style={styles.rowHint}>
              Only approved friends can see your activity
            </Text>
          </View>
          {isSaving ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Switch
              value={isPrivate}
              onValueChange={handleVisibilityToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          )}
        </View>
        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gym Schedule</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('GymSchedule')}
          activeOpacity={0.7}
        >
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Reminder Times</Text>
            <Text style={styles.rowHint}>
              Set when you usually go — we'll remind you 5 minutes before
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Dev-only Premium toggle — carried over from Step 14's local testing switch */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription (Dev Testing)</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Premium Access</Text>
            <Text style={styles.rowHint}>Local toggle for testing Premium features</Text>
          </View>
          <Switch
            value={isPremium}
            onValueChange={setIsPremium}
            trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
            thumbColor={theme.colors.white}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.dangerButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  rowLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  rowHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: 2,
  },
  chevron: {
    fontSize: theme.fontSize.title,
    color: theme.colors.muted,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
  },
  dangerButton: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});