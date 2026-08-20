import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useOnboardingContext } from '../../context/OnboardingContext';
import theme from '../../constants/theme';

const GOALS = [
  { key: 'cutting', label: 'Cutting', description: 'Lose fat, stay lean and defined' },
  { key: 'bulking', label: 'Bulking', description: 'Build muscle and size' },
  { key: 'maintenance', label: 'Maintenance', description: 'Stay consistent, maintain physique' },
];

const SEX_OPTIONS = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'other', label: 'Other' },
];

export default function GoalSelectScreen({ navigation }) {
  const { updateOnboardingData } = useOnboardingContext();

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [age, setAge] = useState('');
  const [selectedSex, setSelectedSex] = useState(undefined); // undefined = not answered yet
  const [error, setError] = useState('');

  const handleContinue = () => {
    setError('');

    if (!selectedGoal) {
      setError('Please select a goal to continue');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum)) {
      setError('Please enter your age');
      return;
    }
    if (ageNum < 13 || ageNum > 100) {
      setError('Age must be between 13 and 100');
      return;
    }

    updateOnboardingData({
      goal: selectedGoal,
      age: ageNum,
      sex: selectedSex || null, // null if skipped
    });

    navigation.navigate('HomeGymSetup');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>What's your goal?</Text>
      <Text style={styles.subtitle}>
        This shapes your exercise suggestions and rep ranges
      </Text>

      <View style={styles.goalList}>
        {GOALS.map((goal) => {
          const isSelected = selectedGoal === goal.key;
          return (
            <TouchableOpacity
              key={goal.key}
              style={[styles.goalCard, isSelected && styles.goalCardSelected]}
              onPress={() => setSelectedGoal(goal.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.goalLabel, isSelected && styles.goalLabelSelected]}>
                {goal.label}
              </Text>
              <Text style={styles.goalDescription}>{goal.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your age</Text>
        <Text style={styles.sectionHint}>
          We use this to group you into a fair "Start Date Squad" — people the same age as
          you who started around the same time, so comparisons feel honest.
        </Text>
        <TextInput
          style={styles.ageInput}
          placeholder="e.g. 27"
          placeholderTextColor={theme.colors.muted}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Sex (optional)</Text>
        <Text style={styles.sectionHint}>
          Only used to refine your squad match when available. Totally optional.
        </Text>
        <View style={styles.sexRow}>
          {SEX_OPTIONS.map((option) => {
            const isSelected = selectedSex === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.sexPill, isSelected && styles.sexPillSelected]}
                onPress={() => setSelectedSex(option.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.sexPillText, isSelected && styles.sexPillTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.sexPill, selectedSex === null && styles.sexPillSelected]}
            onPress={() => setSelectedSex(null)}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.sexPillText, selectedSex === null && styles.sexPillTextSelected]}
            >
              Prefer not to say
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
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
  },
  goalList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  goalCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  goalLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  goalLabelSelected: {
    color: theme.colors.primary,
  },
  goalDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  ageInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    width: 120,
  },
  sexRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  sexPill: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  sexPillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sexPillText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  sexPillTextSelected: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});