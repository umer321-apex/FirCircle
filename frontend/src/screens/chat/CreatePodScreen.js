import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { createPod } from '../../services/chatService';
import userService from '../../services/userService';

const GOALS = ['cutting', 'bulking', 'maintenance'];
const DEBOUNCE_MS = 400;

export default function CreatePodScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [name, setName] = useState('');
  const [goal, setGoal] = useState(null);
  const [memberQuery, setMemberQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]); // [{ _id, name }]
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceTimer = useRef(null);

  const handleMemberQueryChange = (text) => {
    setMemberQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await userService.searchUsers(text.trim());
        // hide already-selected members from results
        setSearchResults(users.filter((u) => !selectedMembers.some((m) => m._id === u._id)));
      } catch (err) {
        console.error(`[CreatePodScreen] Search error: ${err.message}`);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);
  };

  const addMember = (user) => {
    setSelectedMembers((prev) => [...prev, user]);
    setSearchResults((prev) => prev.filter((u) => u._id !== user._id));
    setMemberQuery('');
  };

  const removeMember = (userId) => {
    setSelectedMembers((prev) => prev.filter((m) => m._id !== userId));
  };

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter a pod name');
      return;
    }

    setIsSubmitting(true);
    try {
      const pod = await createPod(
        name.trim(),
        goal,
        selectedMembers.map((m) => m._id)
      );
      navigation.replace('ChatPod', { podId: pod._id, podName: pod.name });
    } catch (err) {
      const message = err.response?.data?.message || 'Could not create pod. Please try again.';
      console.error(`[CreatePodScreen] Create error: ${message}`);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEW SQUAD POD</Text>
      <Text style={styles.subtitle}>Create a group chat for people training toward similar goals</Text>

      <View style={styles.form}>
        <Text style={styles.label}>POD NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Bulking Squad Beta"
          placeholderTextColor={theme.colors.muted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>GOAL (OPTIONAL)</Text>
        <View style={styles.goalRow}>
          {GOALS.map((g) => {
            const isSelected = goal === g;
            return (
              <TouchableOpacity
                key={g}
                style={[styles.goalPill, isSelected && styles.goalPillSelected]}
                onPress={() => setGoal(isSelected ? null : g)}
                activeOpacity={0.85}
              >
                <Text style={[styles.goalPillText, isSelected && styles.goalPillTextSelected]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>ADD MEMBERS</Text>
        <TextInput
          style={styles.input}
          placeholder="Search by name…"
          placeholderTextColor={theme.colors.muted}
          value={memberQuery}
          onChangeText={handleMemberQueryChange}
        />

        {isSearching && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: theme.spacing.sm }} />}

        {searchResults.length > 0 && (
          <View style={styles.resultsBox}>
            {searchResults.map((user) => (
              <TouchableOpacity key={user._id} style={styles.resultRow} onPress={() => addMember(user)} activeOpacity={0.8}>
                <Text style={styles.resultName}>{user.name}</Text>
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedMembers.length > 0 && (
          <View style={styles.chipsRow}>
            {selectedMembers.map((m) => (
              <TouchableOpacity key={m._id} style={styles.chip} onPress={() => removeMember(m._id)} activeOpacity={0.8}>
                <Text style={styles.chipText}>{m.name} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, theme.glow.secondary, isSubmitting && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.onSecondary} />
          ) : (
            <Text style={styles.buttonText}>CREATE POD</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.containerMargin, paddingTop: theme.spacing.xxl },
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
    form: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.lg,
    },
    label: {
      fontFamily: theme.fontFamily.label,
      fontSize: 10,
      color: theme.colors.textVariant,
      letterSpacing: 1,
      marginBottom: theme.spacing.xs,
      marginTop: theme.spacing.md,
    },
    input: {
      backgroundColor: theme.colors.surfaceHigh,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 4,
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
    },
    goalRow: { flexDirection: 'row', gap: theme.spacing.sm },
    goalPill: {
      backgroundColor: theme.colors.surfaceHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.radius.full,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    goalPillSelected: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary },
    goalPillText: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.sm, color: theme.colors.text },
    goalPillTextSelected: { color: theme.colors.onSecondary, fontFamily: theme.fontFamily.bodyBold },
    resultsBox: {
      backgroundColor: theme.colors.surfaceHigh,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginTop: theme.spacing.xs,
      overflow: 'hidden',
    },
    resultRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    resultName: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.sm, color: theme.colors.text },
    addIcon: { color: theme.colors.secondary, fontSize: theme.fontSize.md, fontWeight: '700' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.md },
    chip: {
      backgroundColor: theme.colors.primary + '1A',
      borderWidth: 1,
      borderColor: theme.colors.primary + '4D',
      borderRadius: theme.radius.full,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    chipText: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.xs, color: theme.colors.primary },
    errorText: { color: theme.colors.danger, fontSize: theme.fontSize.sm, marginTop: theme.spacing.lg },
    button: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: {
      fontFamily: theme.fontFamily.label,
      color: theme.colors.onSecondary,
      fontSize: theme.fontSize.sm,
      letterSpacing: 1,
    },
  });