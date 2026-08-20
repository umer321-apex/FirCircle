import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import exerciseService from '../../services/exerciseService';
import theme from '../../constants/theme';

export default function ExerciseListScreen({ route, navigation }) {
  const { split } = route.params;

  const [exercises, setExercises] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExercises();
  }, [split]);

  const loadExercises = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await exerciseService.getExercisesBySplit(split);
      setExercises(data.exercises);
      setIsPremium(data.isPremium);
    } catch (err) {
      console.error(`[ExerciseListScreen] Load error: ${err.message}`);
      setError('Could not load exercises. Pull to refresh or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{split}</Text>

      {!isPremium && (
        <View style={styles.premiumBanner}>
          <Text style={styles.premiumBannerText}>
            🔒 Upgrade to Premium for goal-matched sets, reps, and rest times
          </Text>
        </View>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={exercises}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              {item.premiumLocked ? (
                <Text style={styles.lockBadge}>🔒</Text>
              ) : (
                <Text style={styles.caloriesBadge}>{item.variant.caloriesPerSet} cal/set</Text>
              )}
            </View>
            <Text style={styles.muscleTag}>{item.primaryMuscle}</Text>
            {!item.premiumLocked && (
              <Text style={styles.previewText}>
                {item.variant.sets} sets × {item.variant.reps} reps
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  premiumBanner: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.sm + 2,
    marginBottom: theme.spacing.md,
  },
  premiumBannerText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.sm,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flexShrink: 1,
  },
  lockBadge: {
    fontSize: theme.fontSize.md,
  },
  caloriesBadge: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.semibold,
  },
  muscleTag: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: 2,
  },
  previewText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
});