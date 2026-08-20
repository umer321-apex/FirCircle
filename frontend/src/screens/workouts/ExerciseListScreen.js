import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import exerciseService from '../../services/exerciseService';

export default function ExerciseListScreen({ route, navigation }) {
  const { split } = route.params;
  const { theme } = useTheme();
  const styles = createStyles(theme);

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
      <Text style={styles.title}>{split.toUpperCase()}</Text>

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
        renderItem={({ item, index }) => {
          const isFeatured = index === 0 && !item.premiumLocked; // first unlocked card gets the highlighted treatment
          return (
            <TouchableOpacity
              style={[
                styles.card,
                isFeatured && styles.cardFeatured,
                isFeatured && theme.glow.subtle,
              ]}
              onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.muscleTag}>{item.primaryMuscle.toUpperCase()}</Text>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                </View>
                {item.premiumLocked ? (
                  <Text style={styles.lockBadge}>🔒</Text>
                ) : (
                  <Text style={styles.caloriesBadge}>{item.variant.caloriesPerSet} cal/set</Text>
                )}
              </View>

              {!item.premiumLocked && (
                <>
                  <View style={styles.tipBox}>
                    <Text style={styles.tipIcon}>⚡</Text>
                    <Text style={styles.tipText}>
                      {item.variant.sets} sets × {item.variant.reps} reps · {item.variant.restSeconds}s rest
                    </Text>
                  </View>
                  <View style={styles.logButton}>
                    <Text style={styles.logButtonText}>✎ LOG SET</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background, paddingTop: theme.spacing.xl },
    centerContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
    title: {
      fontFamily: theme.fontFamily.display,
      fontSize: theme.fontSize.headline,
      color: theme.colors.text,
      textTransform: 'uppercase',
      paddingHorizontal: theme.spacing.containerMargin,
      marginBottom: theme.spacing.md,
    },
    premiumBanner: {
      backgroundColor: theme.colors.surfaceLow,
      borderWidth: 1,
      borderColor: theme.colors.primary + '4D',
      borderRadius: theme.radius.lg,
      marginHorizontal: theme.spacing.containerMargin,
      padding: theme.spacing.sm + 2,
      marginBottom: theme.spacing.md,
    },
    premiumBannerText: {
      fontFamily: theme.fontFamily.body,
      color: theme.colors.primary,
      fontSize: theme.fontSize.xs,
      textAlign: 'center',
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: theme.fontSize.sm,
      paddingHorizontal: theme.spacing.containerMargin,
      marginBottom: theme.spacing.md,
    },
    list: {
      paddingHorizontal: theme.spacing.containerMargin,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.lg,
    },
    cardFeatured: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.secondary,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    muscleTag: {
      fontFamily: theme.fontFamily.label,
      fontSize: 10,
      color: theme.colors.secondary,
      letterSpacing: 1,
      marginBottom: 2,
    },
    exerciseName: {
      fontFamily: theme.fontFamily.bodyBold,
      fontSize: theme.fontSize.title,
      color: theme.colors.text,
    },
    lockBadge: { fontSize: theme.fontSize.md },
    caloriesBadge: {
      fontFamily: theme.fontFamily.label,
      fontSize: 10,
      color: theme.colors.tertiary,
    },
    tipBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.colors.background + 'B3',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    tipIcon: { fontSize: 14 },
    tipText: {
      flex: 1,
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.sm,
      color: theme.colors.textVariant,
    },
    logButton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    logButtonText: {
      fontFamily: theme.fontFamily.label,
      fontSize: theme.fontSize.xs,
      color: theme.colors.onSecondary,
      letterSpacing: 1,
    },
  });