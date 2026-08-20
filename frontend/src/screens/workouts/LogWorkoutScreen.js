import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../../context/ThemeContext';
import workoutService from '../../services/workoutService';
import offlineQueueService from '../../services/offlineQueueService';

export default function LogWorkoutScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const prefilledExercise = route?.params?.exercise;

  const [splitCategory, setSplitCategory] = useState(prefilledExercise?.splitCategory || '');
  const [exerciseName, setExerciseName] = useState(prefilledExercise?.name || '');
  const [sets, setSets] = useState(prefilledExercise?.variant?.sets ? String(prefilledExercise.variant.sets) : '');
  const [reps, setReps] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    if (!splitCategory.trim() || !exerciseName.trim()) {
      setError('Please enter a split and exercise name');
      return;
    }

    const setsNum = parseInt(sets, 10);
    const repsNum = parseInt(reps, 10);
    const weightNum = parseFloat(weightKg);

    if (!setsNum || !repsNum || isNaN(weightNum)) {
      setError('Please enter valid sets, reps, and weight');
      return;
    }

    setIsSubmitting(true);

    const entries = [
      {
        exerciseId: prefilledExercise?._id || '000000000000000000000000',
        exerciseName: exerciseName.trim(),
        sets: setsNum,
        reps: repsNum,
        weightKg: weightNum,
      },
    ];

    const netState = await NetInfo.fetch();

    try {
      if (netState.isConnected) {
        await workoutService.logWorkout(splitCategory.trim(), entries);
      } else {
        await offlineQueueService.enqueueWorkout(splitCategory.trim(), entries);
      }
      setSuccess(true);
      setReps('');
      setWeightKg('');
    } catch (err) {
      console.error(`[LogWorkoutScreen] Log error, queuing offline: ${err.message}`);
      await offlineQueueService.enqueueWorkout(splitCategory.trim(), entries);
      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>LOG WORKOUT</Text>
      <Text style={styles.subtitle}>Track today's session</Text>

      <View style={styles.form}>
        <Text style={styles.label}>SPLIT</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Chest Day"
          placeholderTextColor={theme.colors.muted}
          value={splitCategory}
          onChangeText={setSplitCategory}
        />

        <Text style={styles.label}>EXERCISE</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Barbell Bench Press"
          placeholderTextColor={theme.colors.muted}
          value={exerciseName}
          onChangeText={setExerciseName}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>SETS</Text>
            <TextInput style={styles.input} placeholder="3" placeholderTextColor={theme.colors.muted} value={sets} onChangeText={setSets} keyboardType="number-pad" />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>REPS</Text>
            <TextInput style={styles.input} placeholder="10" placeholderTextColor={theme.colors.muted} value={reps} onChangeText={setReps} keyboardType="number-pad" />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>WEIGHT (KG)</Text>
            <TextInput style={styles.input} placeholder="40" placeholderTextColor={theme.colors.muted} value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" />
          </View>
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>✓ Workout logged (will sync if offline)!</Text>}

        <TouchableOpacity
          style={[styles.button, theme.glow.secondary, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? <ActivityIndicator color={theme.colors.onSecondary} /> : <Text style={styles.buttonText}>LOG SET</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: theme.spacing.containerMargin, paddingVertical: theme.spacing.xxl },
    title: {
      fontFamily: theme.fontFamily.display,
      fontSize: theme.fontSize.headline,
      color: theme.colors.text,
      textTransform: 'uppercase',
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.sm,
      color: theme.colors.textVariant,
      marginBottom: theme.spacing.xl,
    },
    form: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.lg,
    },
    label: {
      fontFamily: theme.fontFamily.label,
      fontSize: 10,
      color: theme.colors.textVariant,
      letterSpacing: 1,
      marginBottom: theme.spacing.xs,
      marginTop: theme.spacing.md,
    },
    input: {
      backgroundColor: theme.colors.surfaceHigh,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 4,
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
    },
    row: { flexDirection: 'row', gap: theme.spacing.sm },
    rowItem: { flex: 1 },
    errorText: { color: theme.colors.danger, fontSize: theme.fontSize.sm, marginTop: theme.spacing.md },
    successText: {
      fontFamily: theme.fontFamily.bodyBold,
      color: theme.colors.secondary,
      fontSize: theme.fontSize.sm,
      marginTop: theme.spacing.md,
    },
    button: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: {
      fontFamily: theme.fontFamily.label,
      color: theme.colors.onSecondary,
      fontSize: theme.fontSize.sm,
      letterSpacing: 1,
    },
  });