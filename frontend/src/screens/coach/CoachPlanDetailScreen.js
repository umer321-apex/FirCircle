import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import theme from '../../constants/theme';
import coachService from '../../services/coachService';

export default function CoachPlanDetailScreen({ route }) {
  const { planId } = route.params;

  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [planId])
  );

  const loadPlan = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await coachService.getPlanById(planId);
      setPlan(data);
    } catch (err) {
      console.error(`[CoachPlanDetailScreen] Load error: ${err.message}`);
      setError('Could not load this plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      await coachService.purchasePlan(planId);
      await loadPlan(); // re-fetch full plan so alreadyPurchased reflects the new state
      Alert.alert('Purchased!', 'This plan has been added to your account.');
    } catch (err) {
      const message = err.response?.data?.message || 'Purchase failed. Please try again.';
      console.error(`[CoachPlanDetailScreen] Purchase error: ${message}`);
      Alert.alert('Purchase Failed', message);
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (error || !plan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Plan not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={{
            uri: plan.coverImageUrl || 'https://via.placeholder.com/600x300.png?text=Plan',
          }}
          style={styles.coverImage}
        />

        <View style={styles.body}>
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>
              {plan.type === 'workout' ? '💪 Workout Plan' : '🍽️ Meal Plan'}
            </Text>
          </View>

          <Text style={styles.title}>{plan.title}</Text>

          <View style={styles.coachRow}>
            <Image
              source={{
                uri: plan.coachUserId?.profilePhotoUrl || 'https://via.placeholder.com/44.png',
              }}
              style={styles.coachAvatar}
            />
            <View>
              <Text style={styles.coachName}>{plan.coachUserId?.name || 'Coach'}</Text>
              <Text style={styles.coachSubtext}>Verified trainer</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>About this plan</Text>
          <Text style={styles.description}>{plan.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPriceLabel}>Price</Text>
          <Text style={styles.footerPrice}>${plan.priceUSD.toFixed(2)}</Text>
        </View>

        {plan.alreadyPurchased ? (
          <View style={styles.ownedButton}>
            <Text style={styles.ownedButtonText}>✓ Owned</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePurchase}
            disabled={isPurchasing}
            activeOpacity={0.85}
          >
            {isPurchasing ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.purchaseButtonText}>Purchase</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  content: { paddingBottom: 120 },
  coverImage: { width: '100%', height: 220, backgroundColor: theme.colors.border },
  body: { padding: theme.spacing.lg },
  typeTag: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: theme.spacing.sm,
  },
  typeTagText: { fontSize: theme.fontSize.xs, color: theme.colors.muted, fontWeight: theme.fontWeight.semibold },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.md },
  coachRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  coachAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: theme.spacing.sm, backgroundColor: theme.colors.border },
  coachName: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  coachSubtext: { fontSize: theme.fontSize.xs, color: theme.colors.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.md },
  sectionLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  description: { fontSize: theme.fontSize.sm, color: theme.colors.text, lineHeight: 22 },
  errorText: { fontSize: theme.fontSize.sm, color: theme.colors.danger, textAlign: 'center', paddingHorizontal: theme.spacing.lg },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerPriceLabel: { fontSize: theme.fontSize.xs, color: theme.colors.muted },
  footerPrice: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.primary },
  purchaseButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: { color: theme.colors.white, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.md },
  ownedButton: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  ownedButtonText: { color: theme.colors.muted, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.md },
});