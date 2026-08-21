import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import workoutService from '../../services/workoutService';
import theme from '../../constants/theme';
import NetInfo from '@react-native-community/netinfo';
import offlineQueueService from '../../services/offlineQueueService';
import ShareToFeedModal from '../../components/feed/ShareToFeedModal';

// route.params.exercise (optional) lets this screen be opened directly from
// ExerciseDetailScreen with the exercise pre-filled; otherwise starts blank.
export default function LogWorkoutScreen({ route, navigation }) {
  const prefilledExercise = route?.params?.exercise;

  const [splitCategory, setSplitCategory] = useState(prefilledExercise?.splitCategory || '');
  const [exerciseName, setExerciseName] = useState(prefilledExercise?.name || '');
  const [sets, setSets] = useState(prefilledExercise?.variant?.sets ? String(prefilledExercise.variant.sets) : '');
  const [reps, setReps] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loggedWorkoutId, setLoggedWorkoutId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

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
        const data = await workoutService.logWorkout(splitCategory.trim(), entries);
        setSuccess(true);
        // Sharing requires a real saved doc — only available on the online path,
        // since offline-queued workouts don't have a server _id yet.
        setLoggedWorkoutId(data.workout?._id || null);
      } else {
        await offlineQueueService.enqueueWorkout(splitCategory.trim(), entries);
        setSuccess(true);
        setError(''); // clear any prior error — queuing is a success state, not a failure
      }
      setReps('');
      setWeightKg('');
    } catch (err) {
      // Network request itself failed even though NetInfo said we're connected —
      // queue it locally rather than losing the data
      console.error(`[LogWorkoutScreen] Log error, queuing offline: ${err.message}`);
      await offlineQueueService.enqueueWorkout(splitCategory.trim(), entries);
      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Log Workout</Text>
      <Text style={styles.subtitle}>Track today's session</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Split</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Chest Day"
          placeholderTextColor={theme.colors.muted}
          value={splitCategory}
          onChangeText={setSplitCategory}
        />

        <Text style={styles.label}>Exercise</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Barbell Bench Press"
          placeholderTextColor={theme.colors.muted}
          value={exerciseName}
          onChangeText={setExerciseName}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Sets</Text>
            <TextInput
              style={styles.input}
              placeholder="3"
              placeholderTextColor={theme.colors.muted}
              value={sets}
              onChangeText={setSets}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Reps</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor={theme.colors.muted}
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="40"
              placeholderTextColor={theme.colors.muted}
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>✓ Workout logged (will sync if offline)!</Text>}
        {success && loggedWorkoutId && (
          <TouchableOpacity
            style={styles.shareLink}
            onPress={() => setShowShareModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.shareLinkText}>Share this workout to your feed →</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.buttonText}>Log Set</Text>
          )}
        </TouchableOpacity>
      </View>

      <ShareToFeedModal
        visible={showShareModal}
        type="workout"
        contentRefId={loggedWorkoutId}
        onClose={() => setShowShareModal(false)}
        onShared={() => setLoggedWorkoutId(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
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
    marginBottom: theme.spacing.xl,
  },
  form: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.md,
  },
  successText: {
    color: theme.colors.success,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    marginTop: theme.spacing.md,
  },
  shareLink: {
    marginTop: theme.spacing.sm,
  },
  shareLinkText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});