import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import theme from '../../constants/theme';

const SPLITS = [
  { key: 'Chest Day', emoji: '🏋️', color: '#FF5A3C' },
  { key: 'Back Day', emoji: '🔙', color: '#00D9A3' },
  { key: 'Leg Day', emoji: '🦵', color: '#FFB020' },
  { key: 'Shoulder Day', emoji: '💪', color: '#4D9DFF' },
  { key: 'Arm Day', emoji: '💥', color: '#C77DFF' },
];

export default function WorkoutSplitScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Choose your split</Text>
      <Text style={styles.subtitle}>Pick today's focus area</Text>

      <View style={styles.grid}>
        {SPLITS.map((split) => (
          <TouchableOpacity
            key={split.key}
            style={[styles.card, { borderColor: split.color }]}
            onPress={() => navigation.navigate('ExerciseList', { split: split.key })}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, { backgroundColor: split.color }]}>
              <Text style={styles.iconEmoji}>{split.emoji}</Text>
            </View>
            <Text style={styles.cardLabel}>{split.key}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
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
  grid: {
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  iconEmoji: {
    fontSize: 26,
  },
  cardLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
});