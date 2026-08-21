import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { addCustomMeal } from '../../services/dietService';

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function CustomMealEntryScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

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
      <Text style={styles.title}>LOG A CUSTOM MEAL</Text>
      <Text style={styles.subtitle}>Not finding what you ate? Log it manually — it still counts toward your daily totals.</Text>

      <View style={styles.form}>
        <Text style={styles.sectionLabel}>MEAL SLOT</Text>
        <View style={styles.slotRow}>
          {SLOTS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.slotChip, slot === s && styles.slotChipSelected]}
              onPress={() => setSlot(s)}
              activeOpacity={0.85}
            >
              <Text style={[styles.slotChipText, slot === s && styles.slotChipTextSelected]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field theme={theme} label="MEAL NAME" value={name} onChangeText={setName} placeholder="e.g. Homemade chicken wrap" error={errors.name} />
        <Field theme={theme} label="CALORIES" value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="e.g. 450" error={errors.calories} />

        <View style={styles.macroInputRow}>
          <View style={styles.macroInputCol}><Field theme={theme} label="PROTEIN (G)" value={protein} onChangeText={setProtein} keyboardType="numeric" placeholder="0" /></View>
          <View style={styles.macroInputCol}><Field theme={theme} label="CARBS (G)" value={carbs} onChangeText={setCarbs} keyboardType="numeric" placeholder="0" /></View>
          <View style={styles.macroInputCol}><Field theme={theme} label="FAT (G)" value={fat} onChangeText={setFat} keyboardType="numeric" placeholder="0" /></View>
        </View>

        <TouchableOpacity
          style={[styles.button, theme.glow.tertiary, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color={theme.colors.onTertiary} /> : <Text style={styles.buttonText}>LOG MEAL</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Field({ theme, label, error, ...props }) {
  const styles = createStyles(theme);
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={theme.colors.muted} {...props} />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.containerMargin, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xxl },
    title: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.headline, color: theme.colors.text, marginBottom: theme.spacing.xs },
    subtitle: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.sm, color: theme.colors.textVariant, marginBottom: theme.spacing.xl, lineHeight: 20 },
    form: { backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.outlineVariant, padding: theme.spacing.lg },
    sectionLabel: { fontFamily: theme.fontFamily.label, fontSize: 10, color: theme.colors.textVariant, letterSpacing: 1, marginBottom: theme.spacing.sm },
    slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
    slotChip: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceHigh },
    slotChipSelected: { backgroundColor: theme.colors.tertiary, borderColor: theme.colors.tertiary },
    slotChipText: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.sm, color: theme.colors.text },
    slotChipTextSelected: { color: theme.colors.onTertiary, fontFamily: theme.fontFamily.bodyBold },
    fieldGroup: { marginBottom: theme.spacing.md },
    fieldLabel: { fontFamily: theme.fontFamily.label, fontSize: 10, color: theme.colors.textVariant, letterSpacing: 1, marginBottom: theme.spacing.xs },
    input: { backgroundColor: theme.colors.surfaceHigh, borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.lg, padding: theme.spacing.md, fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.md, color: theme.colors.text },
    fieldError: { fontSize: theme.fontSize.xs, color: theme.colors.danger, marginTop: theme.spacing.xs },
    macroInputRow: { flexDirection: 'row', gap: theme.spacing.sm },
    macroInputCol: { flex: 1 },
    button: { backgroundColor: theme.colors.tertiary, borderRadius: theme.radius.lg, paddingVertical: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.sm },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { fontFamily: theme.fontFamily.label, color: theme.colors.onTertiary, fontSize: theme.fontSize.sm, letterSpacing: 1 },
  });