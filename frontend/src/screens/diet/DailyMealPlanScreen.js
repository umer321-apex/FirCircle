import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import  theme  from '../../constants/theme';
import { fetchTodayPlan } from '../../services/dietService';
import ShareToFeedModal from '../../components/feed/ShareToFeedModal';

const SLOTS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
];

export default function DailyMealPlanScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await fetchTodayPlan();
      setData(result);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!data?.exists) {
    return (
      <ScrollView
        contentContainerStyle={styles.centered}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.emptyTitle}>No plan generated yet</Text>
        <Text style={styles.emptyText}>
          Generate a personalized plan (Premium) or log a custom meal to start tracking today.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('DietSetup')}>
          <Text style={styles.primaryButtonText}>Set Up Diet Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('CustomMealEntry')}
        >
          <Text style={styles.secondaryButtonText}>Log a Custom Meal Instead</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const { plan, totals } = data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      {/* FR-6.8: medical disclaimer banner — always visible on this screen */}
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText}>
          ⓘ General dietary guidance only, not medical nutrition therapy. Confirm with a doctor or dietitian if
          you have a diagnosed condition.
        </Text>
      </View>

      <View style={styles.totalsCard}>
        <View style={styles.totalsHeaderRow}>
          <Text style={styles.totalsTitle}>Today's Progress</Text>
          <TouchableOpacity onPress={() => setShowShareModal(true)} activeOpacity={0.7}>
            <Text style={styles.shareText}>Share →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.totalsRow}>
          <MacroStat label="Calories" value={totals.calories} target={plan.targetCalories} unit="kcal" />
        </View>
        <View style={styles.totalsRow}>
          <MacroStat label="Protein" value={totals.protein} target={plan.targetMacros.protein} unit="g" />
          <MacroStat label="Carbs" value={totals.carbs} target={plan.targetMacros.carbs} unit="g" />
          <MacroStat label="Fat" value={totals.fat} target={plan.targetMacros.fat} unit="g" />
        </View>
      </View>

      {SLOTS.map((slot) => {
        const options = plan.suggestedOptions?.[slot.key] || [];
        return (
          <View key={slot.key} style={styles.slotSection}>
            <Text style={styles.slotTitle}>{slot.label}</Text>
            {options.length === 0 ? (
              <Text style={styles.slotEmptyText}>No suggestions available — try logging a custom meal.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
                {options.map((food) => (
                  <TouchableOpacity
                    key={food._id}
                    style={styles.mealCard}
                    onPress={() => navigation.navigate('MealOptionDetail', { foodItemId: food._id, slot: slot.key })}
                  >
                    <Text style={styles.mealCardName} numberOfLines={2}>{food.name}</Text>
                    <Text style={styles.mealCardCals}>{food.caloriesPer100g} kcal / 100g</Text>
                    <View style={styles.mealCardMacros}>
                      <Text style={styles.mealCardMacroText}>P {food.protein}g</Text>
                      <Text style={styles.mealCardMacroText}>C {food.carbs}g</Text>
                      <Text style={styles.mealCardMacroText}>F {food.fat}g</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        );
      })}

      <TouchableOpacity
        style={styles.customButton}
        onPress={() => navigation.navigate('CustomMealEntry')}
      >
        <Text style={styles.customButtonText}>+ Log a Custom Meal</Text>
      </TouchableOpacity>

      <ShareToFeedModal
        visible={showShareModal}
        type="mealPlan"
        contentRefId={plan._id}
        onClose={() => setShowShareModal(false)}
      />
    </ScrollView>
  );
}

function MacroStat({ label, value, target, unit }) {
  const pct = target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0;
  return (
    <View style={styles.macroStat}>
      <Text style={styles.macroStatLabel}>{label}</Text>
      <Text style={styles.macroStatValue}>
        {value}{unit} <Text style={styles.macroStatTarget}>/ {target}{unit}</Text>
      </Text>
      <View style={styles.macroBarTrack}>
        <View style={[styles.macroBarFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  primaryButtonText: { color: theme.colors.background, fontWeight: theme.fontWeight.bold },
  secondaryButton: { paddingVertical: theme.spacing.sm },
  secondaryButtonText: { color: theme.colors.primary, fontWeight: theme.fontWeight.medium },

  disclaimerBanner: {
    backgroundColor: theme.colors.accent + '15',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  disclaimerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    lineHeight: 16,
  },

  totalsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  totalsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  totalsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  macroStat: { flex: 1, marginRight: theme.spacing.sm },
  macroStatLabel: { fontSize: theme.fontSize.xs, color: theme.colors.muted, marginBottom: 2 },
  macroStatValue: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  macroStatTarget: { fontSize: theme.fontSize.xs, color: theme.colors.muted, fontWeight: theme.fontWeight.regular },
  macroBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
    marginTop: 4,
  },
  macroBarFill: { height: '100%', borderRadius: 3, backgroundColor: theme.colors.primary },

  slotSection: { marginBottom: theme.spacing.lg },
  slotTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  slotEmptyText: { fontSize: theme.fontSize.sm, color: theme.colors.muted },
  cardRow: { gap: theme.spacing.sm },
  mealCard: {
    width: 160,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginRight: theme.spacing.sm,
  },
  mealCardName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    minHeight: 34,
  },
  mealCardCals: { fontSize: theme.fontSize.xs, color: theme.colors.muted, marginBottom: theme.spacing.xs },
  mealCardMacros: { flexDirection: 'row', gap: theme.spacing.sm },
  mealCardMacroText: { fontSize: theme.fontSize.xs, color: theme.colors.text },

  customButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  customButtonText: { color: theme.colors.primary, fontWeight: theme.fontWeight.bold },
});