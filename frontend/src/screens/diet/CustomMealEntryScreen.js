import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import theme  from '../../constants/theme';
import { addCustomMeal } from '../../services/dietService';

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function CustomMealEntryScreen({ navigation }) {
  const [slot, setSlot] = useState('breakfast');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Enter a meal name';
    if (!calories || isNaN(calories) || Number(calories) <= 0) e.calories = 'Enter valid calories';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await addCustomMeal({
        slot,
        customEntry: {
          name: name.trim(),
          calories: Number(calories),
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
        },
        servings: 1,
      });
      Alert.alert('Logged!', `${name} added to today's ${slot}.`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Something went wrong', 'Could not log this meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Log a Custom Meal</Text>
      <Text style={styles.subtitle}>
        Not finding what you ate? Log it manually — it still counts toward your daily totals.
      </Text>

      <Text style={styles.sectionLabel}>Meal Slot</Text>
      <View style={styles.slotRow}>
        {SLOTS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.slotChip, slot === s && styles.slotChipSelected]}
            onPress={() => setSlot(s)}
          >
            <Text style={[styles.slotChipText, slot === s && styles.slotChipTextSelected]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Field label="Meal name" value={name} onChangeText={setName} placeholder="e.g. Homemade chicken wrap" error={errors.name} />
      <Field label="Calories" value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="e.g. 450" error={errors.calories} />

      <View style={styles.macroInputRow}>
        <View style={styles.macroInputCol}>
          <Field label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="numeric" placeholder="0" />
        </View>
        <View style={styles.macroInputCol}>
          <Field label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="numeric" placeholder="0" />
        </View>
        <View style={styles.macroInputCol}>
          <Field label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="numeric" placeholder="0" />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.buttonText}>Log Meal</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, error, ...props }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={theme.colors.muted} {...props} />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.muted, marginBottom: theme.spacing.lg, lineHeight: 20 },
  sectionLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  slotChip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill ?? 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  slotChipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  slotChipText: { fontSize: theme.fontSize.sm, color: theme.colors.text },
  slotChipTextSelected: { color: theme.colors.background, fontWeight: theme.fontWeight.semibold },
  fieldGroup: { marginBottom: theme.spacing.md },
  fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.text, marginBottom: theme.spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  fieldError: { fontSize: theme.fontSize.xs, color: theme.colors.danger, marginTop: theme.spacing.xs },
  macroInputRow: { flexDirection: 'row', gap: theme.spacing.sm },
  macroInputCol: { flex: 1 },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: theme.colors.background, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold },
});