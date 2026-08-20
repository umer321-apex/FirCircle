import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
} from 'react-native';
import feedService from '../../services/feedService';
import theme from '../../constants/theme';

const TYPE_LABELS = {
  workout: '🏋️ Workout',
  progressPhoto: '📸 Progress Photo',
  mealPlan: '🍽️ Meal Plan',
};

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.skeletonHeaderRow}>
        <View style={styles.skeletonAvatar} />
        <View style={{ flex: 1 }}>
          <View style={[styles.skeletonLine, { width: '40%' }]} />
          <View style={[styles.skeletonLine, { width: '25%', marginTop: 6 }]} />
        </View>
      </View>
      <View style={[styles.skeletonBlock, { marginTop: theme.spacing.md }]} />
      <View style={[styles.skeletonLine, { width: '90%', marginTop: theme.spacing.md }]} />
      <View style={[styles.skeletonLine, { width: '60%', marginTop: 6 }]} />
    </View>
  );
}

function PostCard({ post, onLike, onSave, onOpen }) {
  const [scale] = useState(new Animated.Value(1));

  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() => onOpen(post)}
      >
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{post.author.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <Text style={styles.typeLabel}>{TYPE_LABELS[post.type] || post.type}</Text>
          </View>
        </View>

        {!!post.caption && <Text style={styles.caption}>{post.caption}</Text>}

        <View style={styles.contentPreview}>
          <Text style={styles.contentPreviewText}>
            {post.type === 'mealPlan' && `Target: ${post.content?.targetCalories || '—'} kcal/day`}
            {post.type === 'workout' && `${post.content?.splitCategory || 'Workout'} • ${post.content?.totalVolume || 0} vol`}
            {post.type === 'progressPhoto' && (post.content?.photoUrl ? '📷 Photo attached' : 'Progress update')}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onLike(post)} activeOpacity={0.7}>
          <Text style={[styles.actionIcon, post.likedByMe && styles.actionIconActive]}>
            {post.likedByMe ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionCount}>{post.likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onOpen(post)} activeOpacity={0.7}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onSave(post)} activeOpacity={0.7}>
          <Text style={[styles.actionIcon, post.savedByMe && styles.actionIconActive]}>
            {post.savedByMe ? '🔖' : '📑'}
          </Text>
          {post.type === 'mealPlan' && <Text style={styles.actionCount}>Save</Text>}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function SocialFeedScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const data = await feedService.getFeed();
      setPosts(data.posts);
    } catch (err) {
      console.error(`[SocialFeedScreen] Load error: ${err.message}`);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const handleLike = async (post) => {
    // Optimistic update for instant press feedback
    setPosts((prev) =>
      prev.map((p) =>
        p._id === post._id
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
          : p
      )
    );
    try {
      await feedService.toggleLike(post._id);
    } catch (err) {
      console.error(`[SocialFeedScreen] Like error: ${err.message}`);
      loadFeed(); // revert to server state on failure
    }
  };

  const handleSave = async (post) => {
    setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, savedByMe: !p.savedByMe } : p)));
    try {
      const result = await feedService.savePost(post._id);
      if (result.copiedToMealLog) {
        console.log('Meal plan copied to your meal log for today');
      }
    } catch (err) {
      console.error(`[SocialFeedScreen] Save error: ${err.message}`);
      loadFeed();
    }
  };

  const handleOpen = (post) => {
    navigation.navigate('PostDetail', { post });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Feed</Text>
        <View style={styles.list}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={<Text style={styles.screenTitle}>Feed</Text>}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        renderItem={({ item }) => (
          <PostCard post={item} onLike={handleLike} onSave={handleSave} onOpen={handleOpen} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>
              Share a workout, progress photo, or meal plan to get your feed started.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  screenTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    marginBottom: theme.spacing.md,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.glow.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
  },
  authorName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  typeLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: 1,
  },
  caption: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  contentPreview: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm + 2,
  },
  contentPreviewText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    fontWeight: theme.fontWeight.medium,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  actionIcon: {
    fontSize: theme.fontSize.md,
    marginRight: 4,
  },
  actionIconActive: {
    transform: [{ scale: 1.1 }],
  },
  actionCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    fontWeight: theme.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyEmoji: { fontSize: 40, marginBottom: theme.spacing.sm },
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
  // Skeleton styles
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceLight,
    marginRight: theme.spacing.sm,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.surfaceLight,
  },
  skeletonBlock: {
    height: 50,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceLight,
  },
});