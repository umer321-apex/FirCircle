import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import progressService from '../../services/progressService';
import theme from '../../constants/theme';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: theme.colors.surface,
  backgroundGradientTo: theme.colors.surface,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(255, 90, 60, ${opacity})`, // primary color
  labelColor: (opacity = 1) => `rgba(138, 143, 152, ${opacity})`, // muted
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: theme.colors.primary,
  },
};

export default function ProgressDashboardScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      const data = await progressService.getMyProgress();
      setEntries(data.entries);
    } catch (err) {
      console.error(`[ProgressDashboardScreen] Load error: ${err.message}`);
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

  const weightEntries = entries.filter((e) => typeof e.weightKg === 'number');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Progress</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProgressEntry')}
        activeOpacity={0.85}
      >
        <Text style={styles.addButtonText}>+ Add Entry</Text>
      </TouchableOpacity>

      {weightEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📈</Text>
          <Text style={styles.emptyTitle}>No progress logged yet</Text>
          <Text style={styles.emptyText}>
            Add your first weight entry to start seeing your trend line here.
          </Text>
        </View>
      ) : weightEntries.length === 1 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👍</Text>
          <Text style={styles.emptyTitle}>Great start!</Text>
          <Text style={styles.emptyText}>
            Log at least one more entry to unlock your trend chart.
          </Text>
        </View>
      ) : (
        <View style={styles.chartCard}>
          <Text style={styles.chartLabel}>Weight (kg)</Text>
          <LineChart
            data={{
              labels: weightEntries.map((e) => e.date.slice(5)), // 'MM-DD'
              datasets: [{ data: weightEntries.map((e) => e.weightKg) }],
            }}
            width={screenWidth - theme.spacing.lg * 2 - theme.spacing.lg * 2}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {entries.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.historyLabel}>Recent Entries</Text>
          {entries
            .slice()
            .reverse()
            .slice(0, 10)
            .map((entry, index) => (
              <View key={index} style={styles.historyRow}>
                <Text style={styles.historyDate}>{entry.date}</Text>
                {typeof entry.weightKg === 'number' && (
                  <Text style={styles.historyValue}>{entry.weightKg} kg</Text>
                )}
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
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
    marginBottom: theme.spacing.lg,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  addButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  chartLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  chart: {
    borderRadius: theme.radius.md,
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  historyLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historyDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
  },
  historyValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
});