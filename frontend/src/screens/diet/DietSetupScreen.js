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
import  theme  from '../../constants/theme';
import { generateDietPlan } from '../../services/dietService';

const CONDITIONS = [
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'highCholesterol', label: 'High Cholesterol' },
];

export default function DietSetupScreen({ navigation }) {
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const toggleCondition = (key) => {
    setConditions((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
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
        Alert.alert(
          'Premium Feature',
          'Personalized plan generation is a Premium feature. Upgrade to unlock it, or log meals manually for free.'
        );
      } else {
        Alert.alert('Something went wrong', 'Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Set Up Your Diet Plan</Text>
      <Text style={styles.subtitle}>
        We'll calculate your daily calorie and macro targets and suggest meals that fit your goal.
      </Text>

      <Field
        label="Weight (kg)"
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="numeric"
        placeholder="e.g. 72"
        error={errors.weightKg}
      />
      <Field
        label="Height (cm)"
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="numeric"
        placeholder="e.g. 175"
        error={errors.heightCm}
      />
      <Field
        label="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        placeholder="e.g. 27"
        error={errors.age}
      />
      <Field
        label="Country"
        value={country}
        onChangeText={setCountry}
        placeholder="e.g. PK or US"
        error={errors.country}
      />

      <Text style={styles.sectionLabel}>Health Conditions (optional)</Text>
      <View style={styles.conditionsRow}>
        {CONDITIONS.map((c) => {
          const selected = conditions.includes(c.key);
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.conditionChip, selected && styles.conditionChipSelected]}
              onPress={() => toggleCondition(c.key)}
            >
              <Text style={[styles.conditionChipText, selected && styles.conditionChipTextSelected]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={styles.buttonText}>Generate My Plan</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        This is general dietary guidance, not medical nutrition therapy. Please confirm your plan with a
        doctor or registered dietitian, especially if you have a diagnosed health condition.
      </Text>
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
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  fieldGroup: { marginBottom: theme.spacing.md },
  fieldLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  fieldError: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
  },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  conditionChip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill ?? 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  conditionChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  conditionChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  conditionChipTextSelected: {
    color: theme.colors.background,
    fontWeight: theme.fontWeight.semibold,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: theme.colors.background,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  disclaimer: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: theme.spacing.lg,
    lineHeight: 16,
    textAlign: 'center',
  },
});