import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import feedService from '../../services/feedService';
import theme from '../../constants/theme';

const TYPE_COPY = {
  workout: { emoji: '🏋️', title: 'Share this workout?' },
  progressPhoto: { emoji: '📸', title: 'Share this progress update?' },
  mealPlan: { emoji: '🍽️', title: "Share today's meal plan?" },
};

// Reusable "share to feed" prompt used right after logging a workout / progress
// entry, or from the meal plan screen. Pass the type + the Mongo _id of the
// content just saved (contentRefId) — the backend verifies you own it.
export default function ShareToFeedModal({ visible, type, contentRefId, onClose, onShared }) {
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const copy = TYPE_COPY[type] || { emoji: '📣', title: 'Share to feed?' };

  const handleClose = () => {
    if (isSubmitting) return;
    setCaption('');
    setError('');
    onClose();
  };

  const handleShare = async () => {
    if (!contentRefId) {
      setError('Nothing to share yet — try again in a moment.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await feedService.createPost({ type, contentRefId, caption: caption.trim() });
      setCaption('');
      onShared?.();
      onClose();
    } catch (err) {
      console.error(`[ShareToFeedModal] Share error: ${err.message}`);
      setError(err.response?.data?.message || 'Could not share this. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.emoji}>{copy.emoji}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>Your friends (or everyone, if your profile is public) will see this.</Text>

          <TextInput
            style={styles.captionInput}
            placeholder="Add a caption (optional)"
            placeholderTextColor={theme.colors.muted}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipButton} onPress={handleClose} disabled={isSubmitting}>
              <Text style={styles.skipButtonText}>Not now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareButton, isSubmitting && styles.shareButtonDisabled]}
              onPress={handleShare}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <Text style={styles.shareButtonText}>Share to Feed</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 36,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: theme.spacing.md,
  },
  captionInput: {
    width: '100%',
    minHeight: 70,
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    textAlignVertical: 'top',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  skipButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  skipButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  shareButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
});