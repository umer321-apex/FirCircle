import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import theme from '../../constants/theme';
import coachService from '../../services/coachService';

const FILTERS = [
  { key: null, label: 'All' },
  { key: 'workout', label: 'Workout Plans' },
  { key: 'meal', label: 'Meal Plans' },
];

export default function CoachMarketplaceScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
  const [filter, setFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (activeFilter) => {
    try {
      const data = await coachService.listPlans(activeFilter);
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      load(filter);
    }, [filter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load(filter);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('CoachPlanDetail', { planId: item._id })}
    >
      <Image
        source={{ uri: item.coverImageUrl || 'https://via.placeholder.com/300x160.png?text=Plan' }}
        style={styles.coverImage}
      />
      <View style={styles.cardBody}>
        <View style={styles.typeTag}>
          <Text style={styles.typeTagText}>{item.type === 'workout' ? '💪 Workout' : '🍽️ Meal'}</Text>
        </View>
        <Text style={styles.planTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.coachRow}>
          <Image
            source={{ uri: item.coachUserId?.profilePhotoUrl || 'https://via.placeholder.com/40.png' }}
            style={styles.coachAvatar}
          />
          <Text style={styles.coachName} numberOfLines={1}>{item.coachUserId?.name || 'Coach'}</Text>
        </View>
      </View>
      <View style={styles.priceBadge}>
        <Text style={styles.priceBadgeText}>${item.priceUSD.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Coach Marketplace</Text>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyText}>No plans here yet — check back soon.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  screenTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterChipText: { fontSize: theme.fontSize.xs, color: theme.colors.muted, fontWeight: theme.fontWeight.semibold },
  filterChipTextActive: { color: theme.colors.white },
  listContent: { padding: theme.spacing.lg, paddingTop: theme.spacing.sm },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  coverImage: { width: '100%', height: 140, backgroundColor: theme.colors.border },
  cardBody: { padding: theme.spacing.md },
  typeTag: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  typeTagText: { fontSize: theme.fontSize.xs, color: theme.colors.muted, fontWeight: theme.fontWeight.semibold },
  planTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: 8 },
  coachRow: { flexDirection: 'row', alignItems: 'center' },
  coachAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8, backgroundColor: theme.colors.border },
  coachName: { fontSize: theme.fontSize.xs, color: theme.colors.muted, flex: 1 },
  priceBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  priceBadgeText: { color: theme.colors.white, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.sm },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: theme.spacing.md },
  emptyText: { fontSize: theme.fontSize.sm, color: theme.colors.muted },
});