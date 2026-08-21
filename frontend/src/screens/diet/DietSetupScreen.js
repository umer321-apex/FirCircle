import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { generateDietPlan } from '../../services/dietService';

const CONDITIONS = [
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'highCholesterol', label: 'High Cholesterol' },
];

export default function DietSetupScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const toggleCondition = (key) => {
    setConditions((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  };

  const validate = () => {
    const e = {};
    if (!weightKg || isNaN(weightKg) || Number(weightKg) <= 0) e.weightKg = 'Enter a valid weight in kg';
    if (!heightCm || isNaN(heightCm) || Number(heightCm) <= 0) e.heightCm = 'Enter a valid height in cm';
    if (!age || isNaN(age) || Number(age) < 13 || Number(age) > 100) e.age = 'Enter an age between 13-100';
    if (!country.trim()) e.country = 'Enter your country (e.g. PK, US)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await generateDietPlan({
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        age: Number(age),
        country: country.trim().toUpperCase(),
        healthConditions: conditions,
      });
      navigation.replace('DailyMealPlan');
    } catch (err) {
      if (err?.response?.status === 403) {
        Alert.alert('Premium Feature', 'Personalized plan generation is a Premium feature. Upgrade to unlock it, or log meals manually for free.');
      } else {
        Alert.alert('Something went wrong', 'Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>DIET SETUP</Text>
      <Text style={styles.subtitle}>We'll calculate your daily calorie and macro targets and suggest meals that fit your goal.</Text>

      <View style={styles.form}>
        <Field theme={theme} label="WEIGHT (KG)" value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" placeholder="e.g. 72" error={errors.weightKg} />
        <Field theme={theme} label="HEIGHT (CM)" value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" placeholder="e.g. 175" error={errors.heightCm} />
        <Field theme={theme} label="AGE" value={age} onChangeText={setAge} keyboardType="numeric" placeholder="e.g. 27" error={errors.age} />
        <Field theme={theme} label="COUNTRY" value={country} onChangeText={setCountry} placeholder="e.g. PK or US" error={errors.country} />

        <Text style={styles.sectionLabel}>HEALTH CONDITIONS (OPTIONAL)</Text>
        <View style={styles.conditionsRow}>
          {CONDITIONS.map((c) => {
            const selected = conditions.includes(c.key);
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.conditionChip, selected && styles.conditionChipSelected]}
                onPress={() => toggleCondition(c.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.conditionChipText, selected && styles.conditionChipTextSelected]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.button, theme.glow.tertiary, loading && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color={theme.colors.onTertiary} /> : <Text style={styles.buttonText}>GENERATE MY PLAN</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        This is general dietary guidance, not medical nutrition therapy. Please confirm your plan with a doctor or registered dietitian, especially if you have a diagnosed health condition.
      </Text>
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
    form: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.lg,
    },
    fieldGroup: { marginBottom: theme.spacing.md },
    fieldLabel: { fontFamily: theme.fontFamily.label, fontSize: 10, color: theme.colors.textVariant, letterSpacing: 1, marginBottom: theme.spacing.xs },
    input: {
      backgroundColor: theme.colors.surfaceHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
    },
    fieldError: { fontSize: theme.fontSize.xs, color: theme.colors.danger, marginTop: theme.spacing.xs },
    sectionLabel: { fontFamily: theme.fontFamily.label, fontSize: 10, color: theme.colors.textVariant, letterSpacing: 1, marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm },
    conditionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
    conditionChip: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceHigh,
    },
    conditionChipSelected: { backgroundColor: theme.colors.tertiary, borderColor: theme.colors.tertiary },
    conditionChipText: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.sm, color: theme.colors.text },
    conditionChipTextSelected: { color: theme.colors.onTertiary, fontFamily: theme.fontFamily.bodyBold },
    button: { backgroundColor: theme.colors.tertiary, borderRadius: theme.radius.lg, paddingVertical: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.sm },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { fontFamily: theme.fontFamily.label, color: theme.colors.onTertiary, fontSize: theme.fontSize.sm, letterSpacing: 1 },
    disclaimer: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.xs, color: theme.colors.muted, marginTop: theme.spacing.lg, lineHeight: 16, textAlign: 'center' },
  });