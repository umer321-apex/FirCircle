import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import theme from '../../constants/theme';
import { useSubscription } from '../../context/SubscriptionContext';

const BENEFITS = [
  { icon: '🎯', title: 'Goal-based exercise plans', desc: 'Cutting/bulking-specific rep ranges, rest times, and variations.' },
  { icon: '👥', title: 'Full Start Date Squad breakdown', desc: 'See exactly where you stand vs. peers who started the same week.' },
  { icon: '📊', title: 'Weekly Root-Cause Insight', desc: 'A plain-English report on what actually drove your progress.' },
  { icon: '🍽️', title: 'Personalized Diet Plan Generator', desc: 'Calorie/macro targets, country-based meals, health-condition filtering.' },
  { icon: '🔒', title: 'Private profile option', desc: 'Control exactly who sees your progress.' },
  { icon: '💬', title: 'Unlimited chat pods', desc: 'No cap on group training chats.' },
  { icon: '🚫', title: 'Ad-free', desc: 'No interruptions, ever.' },
];

export default function PremiumPaywallScreen({ navigation }) {
  const { isPremium, toggleDevPremium } = useSubscription();
  const [toggling, setToggling] = useState(false);

  const handleDevToggle = async () => {
    try {
      setToggling(true);
      const newState = await toggleDevPremium();
      Alert.alert(
        'Dev Toggle',
        newState ? 'Premium enabled for this test account.' : 'Premium disabled for this test account.'
      );
    } catch {
      Alert.alert('Error', 'Could not toggle premium status.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>FITCIRCLE PREMIUM</Text>
        <Text style={styles.title}>Train smarter. See more. Miss nothing.</Text>
        <Text style={styles.subtitle}>
          Everything you need to actually understand your progress — not just log it.
        </Text>
      </View>

      <View style={styles.benefitsList}>
        {BENEFITS.map((b) => (
          <View key={b.title} style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>{b.icon}</Text>
            <View style={styles.benefitTextWrap}>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitDesc}>{b.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.priceCard}>
        <Text style={styles.priceText}>$6.99–$9.99 / month</Text>
        <Text style={styles.priceSubtext}>Cancel anytime. No hidden fees.</Text>
      </View>

      <TouchableOpacity style={styles.ctaButton} disabled>
        <Text style={styles.ctaButtonText}>Subscribe (coming soon)</Text>
      </TouchableOpacity>
      <Text style={styles.ctaNote}>
        Real subscriptions aren't wired up yet — use the dev toggle below to test Premium features
        for free during development.
      </Text>

      <View style={styles.devCard}>
        <View style={styles.devRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.devLabel}>Developer test toggle</Text>
            <Text style={styles.devSublabel}>
              Currently: {isPremium ? 'Premium (ON)' : 'Free (OFF)'}
            </Text>
          </View>
          <Switch
            value={isPremium}
            onValueChange={handleDevToggle}
            disabled={toggling}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.white}
          />
        </View>
        <Text style={styles.devNote}>
          This switch only exists for local testing and will be removed once RevenueCat is connected.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  header: { marginBottom: theme.spacing.lg },
  eyebrow: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    lineHeight: 32,
  },
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.muted, lineHeight: 20 },
  benefitsList: { marginBottom: theme.spacing.lg },
  benefitRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  benefitIcon: { fontSize: 22, marginRight: theme.spacing.sm },
  benefitTextWrap: { flex: 1 },
  benefitTitle: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginBottom: 2 },
  benefitDesc: { fontSize: theme.fontSize.xs, color: theme.colors.muted, lineHeight: 18 },
  priceCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  priceText: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.white },
  priceSubtext: { fontSize: theme.fontSize.xs, color: theme.colors.white, opacity: 0.85, marginTop: 4 },
  ctaButton: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ctaButtonText: { color: theme.colors.muted, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.md },
  ctaNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 16,
  },
  devCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  devRow: { flexDirection: 'row', alignItems: 'center' },
  devLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  devSublabel: { fontSize: theme.fontSize.xs, color: theme.colors.muted, marginTop: 2 },
  devNote: { fontSize: theme.fontSize.xs, color: theme.colors.muted, marginTop: theme.spacing.sm, lineHeight: 16 },
});