import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const SPLITS = [
  { key: 'Chest Day', emoji: '🏋️' },
  { key: 'Back Day', emoji: '🔙' },
  { key: 'Leg Day', emoji: '🦵' },
  { key: 'Shoulder Day', emoji: '💪' },
  { key: 'Arm Day', emoji: '💥' },
];

export default function WorkoutSplitScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>WORKOUTS</Text>
      <Text style={styles.subtitle}>Pick today's focus area</Text>

      <View style={styles.grid}>
        {SPLITS.map((split) => (
          <TouchableOpacity
            key={split.key}
            style={styles.card}
            onPress={() => navigation.navigate('ExerciseList', { split: split.key })}
            activeOpacity={0.85}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>{split.emoji}</Text>
            </View>
            <Text style={styles.cardLabel}>{split.key.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: {
      paddingHorizontal: theme.spacing.containerMargin,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.xxl,
    },
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
    grid: { gap: theme.spacing.md },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.lg,
    },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary + '1A',
      borderWidth: 1,
      borderColor: theme.colors.primary + '4D',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.lg,
    },
    iconEmoji: { fontSize: 24 },
    cardLabel: {
      fontFamily: theme.fontFamily.bodyBold,
      fontSize: theme.fontSize.title,
      color: theme.colors.text,
      letterSpacing: 0.5,
    },
  });