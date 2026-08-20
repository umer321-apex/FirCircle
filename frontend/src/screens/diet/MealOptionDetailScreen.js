import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import  theme  from '../../constants/theme';
import api from '../../services/api';
import { addCustomMeal } from '../../services/dietService';

export default function MealOptionDetailScreen({ route, navigation }) {
  const { foodItemId, slot } = route.params;
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/diet/food-items/${foodItemId}`).catch(async () => {
          // Fallback: some setups may not expose a dedicated GET-by-id route yet;
          // in that case this screen still works fine if navigated to with the
          // full food object passed via route.params.food instead.
          return { data: route.params.food };
        });
        setFood(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [foodItemId]);

  const handleLogMeal = async () => {
    setLogging(true);
    try {
      await addCustomMeal({ slot, foodItemId, servings: 1 });
      Alert.alert('Logged!', `${food.name} added to today's ${slot}.`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Something went wrong', 'Could not log this meal. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!food) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Couldn't load this meal.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{food.name}</Text>
      <Text style={styles.description}>{food.description}</Text>

      <View style={styles.macroCard}>
        <MacroRow label="Calories" value={`${food.caloriesPer100g} kcal`} sub="per 100g" />
        <MacroRow label="Protein" value={`${food.protein}g`} />
        <MacroRow label="Carbs" value={`${food.carbs}g`} />
        <MacroRow label="Fat" value={`${food.fat}g`} />
        {food.glycemicIndex != null && <MacroRow label="Glycemic Index" value={food.glycemicIndex} />}
        {food.saturatedFatHigh && (
          <Text style={styles.badgeWarning}>⚠ Higher in saturated fat</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.logButton, logging && styles.logButtonDisabled]}
        onPress={handleLogMeal}
        disabled={logging}
      >
        {logging ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={styles.logButtonText}>Add to Today's {capitalize(slot)}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function MacroRow({ label, value, sub }) {
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {value} {sub ? <Text style={styles.macroSub}>{sub}</Text> : null}
      </Text>
    </View>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: theme.colors.muted },
  name: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  macroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  macroLabel: { fontSize: theme.fontSize.sm, color: theme.colors.muted },
  macroValue: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  macroSub: { fontSize: theme.fontSize.xs, color: theme.colors.muted, fontWeight: theme.fontWeight.regular },
  badgeWarning: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
  },
  logButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  logButtonDisabled: { opacity: 0.6 },
  logButtonText: { color: theme.colors.background, fontWeight: theme.fontWeight.bold },
});