import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthContext } from '../../context/AuthContext';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import theme from '../../constants/theme';

export default function ProfileScreen({ navigation }) {
  const { user } = useAuthContext();
  const { isPremium } = useSubscriptionContext();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarInitial}>
          {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
        </Text>
      </View>

      <Text style={styles.name}>{user?.name || 'FitCircle User'}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {isPremium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>⭐ Premium</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.goal || '—'}</Text>
          <Text style={styles.statLabel}>Goal</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.ageBand || '—'}</Text>
          <Text style={styles.statLabel}>Age Band</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.visibility || '—'}</Text>
          <Text style={styles.statLabel}>Visibility</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Home Gym</Text>
        <Text style={styles.infoValue}>{user?.homeGym?.name || 'Not set'}</Text>
      </View>

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
        activeOpacity={0.85}
      >
        <Text style={styles.settingsButtonText}>Settings</Text>
      </TouchableOpacity>

      {!isPremium && (
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('PremiumPaywall')}
          activeOpacity={0.85}
        >
          <Text style={styles.upgradeButtonText}>⭐ Upgrade to Premium</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.white,
  },
  name: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  email: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
  },
  premiumBadge: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.radius.full,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  premiumBadgeText: {
    color: theme.colors.warning,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  statValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: 2,
  },
  infoCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  infoLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  settingsButton: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  settingsButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  upgradeButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});