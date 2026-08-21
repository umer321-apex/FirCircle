import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import feedService from '../../services/feedService';
import theme from '../../constants/theme';

export default function PostDetailScreen({ route }) {
  const { post: initialPost } = route.params;

  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const data = await feedService.getComments(post._id);
      setComments(data.comments);
    } catch (err) {
      console.error(`[PostDetailScreen] Load comments error: ${err.message}`);
    } finally {
      setIsLoadingComments(false);
    }
  }, [post._id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleLike = async () => {
    setPost((prev) => ({
      ...prev,
      likedByMe: !prev.likedByMe,
      likeCount: prev.likeCount + (prev.likedByMe ? -1 : 1),
    }));
    try {
      await feedService.toggleLike(post._id);
    } catch (err) {
      console.error(`[PostDetailScreen] Like error: ${err.message}`);
    }
  };

  const handleSave = async () => {
    setPost((prev) => ({ ...prev, savedByMe: !prev.savedByMe }));
    try {
      await feedService.savePost(post._id);
    } catch (err) {
      console.error(`[PostDetailScreen] Save error: ${err.message}`);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const data = await feedService.addComment(post._id, commentText.trim());
      setComments((prev) => [...prev, data.comment]);
      setPost((prev) => ({ ...prev, commentCount: data.commentCount }));
      setCommentText('');
    } catch (err) {
      console.error(`[PostDetailScreen] Comment error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <FlatList
        style={{ flex: 1 }}
        data={comments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.postHeader}>
            <View style={styles.headerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{post.author.name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <Text style={styles.authorName}>{post.author.name}</Text>
            </View>

            {!!post.caption && <Text style={styles.caption}>{post.caption}</Text>}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLike} activeOpacity={0.7}>
                <Text style={styles.actionIcon}>{post.likedByMe ? '❤️' : '🤍'}</Text>
                <Text style={styles.actionCount}>{post.likeCount} likes</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleSave} activeOpacity={0.7}>
                <Text style={styles.actionIcon}>{post.savedByMe ? '🔖' : '📑'}</Text>
                <Text style={styles.actionCount}>{post.savedByMe ? 'Saved' : 'Save'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.commentsLabel}>Comments ({post.commentCount})</Text>
            {isLoadingComments && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 8 }} />}
          </View>
        }
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <View style={styles.commentRow}>
            <View style={styles.commentAvatar}>
              <Text style={styles.commentAvatarText}>{item.userId?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.commentAuthor}>{item.userId?.name}</Text>
              <Text style={styles.commentText}>{item.text}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoadingComments && (
            <Text style={styles.noComments}>No comments yet — be the first to say something.</Text>
          )
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment…"
          placeholderTextColor={theme.colors.muted}
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity
          style={[styles.sendButton, isSubmitting && styles.sendButtonDisabled]}
          onPress={handleSubmitComment}
          disabled={isSubmitting}
        >
          <Text style={styles.sendButtonText}>{isSubmitting ? '…' : 'Post'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: theme.spacing.xl },
  postHeader: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: { color: theme.colors.white, fontWeight: theme.fontWeight.bold },
  authorName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  caption: { fontSize: theme.fontSize.sm, color: theme.colors.text, marginBottom: theme.spacing.md, lineHeight: 20 },
  actionRow: { flexDirection: 'row', marginBottom: theme.spacing.md },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: theme.spacing.lg },
  actionIcon: { fontSize: theme.fontSize.md, marginRight: 4 },
  actionCount: { fontSize: theme.fontSize.xs, color: theme.colors.muted, fontWeight: theme.fontWeight.medium },
  commentsLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  commentAvatarText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  commentAuthor: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  commentText: { fontSize: theme.fontSize.sm, color: theme.colors.text, marginTop: 2 },
  noComments: {
    textAlign: 'center',
    color: theme.colors.muted,
    fontSize: theme.fontSize.sm,
    padding: theme.spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 4,
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: { color: theme.colors.white, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm },
});