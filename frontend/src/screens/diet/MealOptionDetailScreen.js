import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { addCustomMeal } from '../../services/dietService';

export default function MealOptionDetailScreen({ route, navigation }) {
  const { foodItemId, slot } = route.params;
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [food, setFood] = useState(route.params.food || null);
  const [loading, setLoading] = useState(!route.params.food);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    if (food) return; // already have it via route params — skip refetch
    (async () => {
      try {
        const res = await api.get(`/diet/food-items/${foodItemId}`);
        setFood(res.data);
      } catch {
        // no dedicated endpoint / fetch failed — food stays null, error state shown below
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
      {!!food.description && <Text style={styles.description}>{food.description}</Text>}

      <View style={styles.macroCard}>
        <MacroRow theme={theme} label="CALORIES" value={`${food.caloriesPer100g} kcal`} sub="per 100g" highlight />
        <MacroRow theme={theme} label="PROTEIN" value={`${food.protein}g`} />
        <MacroRow theme={theme} label="CARBS" value={`${food.carbs}g`} />
        <MacroRow theme={theme} label="FAT" value={`${food.fat}g`} />
        {food.glycemicIndex != null && <MacroRow theme={theme} label="GLYCEMIC INDEX" value={food.glycemicIndex} />}
        {food.saturatedFatHigh && <Text style={styles.badgeWarning}>⚠ Higher in saturated fat</Text>}
      </View>

      <TouchableOpacity
        style={[styles.logButton, theme.glow.tertiary, logging && styles.logButtonDisabled]}
        onPress={handleLogMeal}
        disabled={logging}
        activeOpacity={0.85}
      >
        {logging ? <ActivityIndicator color={theme.colors.onTertiary} /> : <Text style={styles.logButtonText}>ADD TO TODAY'S {slot.toUpperCase()}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function MacroRow({ theme, label, value, sub, highlight }) {
  const styles = createStyles(theme);
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroValue, highlight && { color: theme.colors.tertiary }]}>
        {value} {sub ? <Text style={styles.macroSub}>{sub}</Text> : null}
      </Text>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.containerMargin, paddingTop: theme.spacing.xl },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
    emptyText: { fontFamily: theme.fontFamily.body, color: theme.colors.muted },
    name: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.headline, color: theme.colors.text, marginBottom: theme.spacing.xs },
    description: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.sm, color: theme.colors.textVariant, marginBottom: theme.spacing.lg, lineHeight: 20 },
    macroCard: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    macroRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant },
    macroLabel: { fontFamily: theme.fontFamily.label, fontSize: 10, color: theme.colors.textVariant, letterSpacing: 0.5 },
    macroValue: { fontFamily: theme.fontFamily.bodyBold, fontSize: theme.fontSize.sm, color: theme.colors.text },
    macroSub: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.xs, color: theme.colors.textVariant },
    badgeWarning: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.xs, color: theme.colors.danger, marginTop: theme.spacing.sm },
    logButton: { backgroundColor: theme.colors.tertiary, borderRadius: theme.radius.lg, paddingVertical: theme.spacing.md, alignItems: 'center' },
    logButtonDisabled: { opacity: 0.6 },
    logButtonText: { fontFamily: theme.fontFamily.label, color: theme.colors.onTertiary, fontSize: theme.fontSize.xs, letterSpacing: 1 },
  });