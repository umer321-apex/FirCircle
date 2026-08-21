import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import userService from '../../services/userService';

const DEBOUNCE_MS = 400;

export default function NewMessageScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef(null);

  const handleQueryChange = (text) => {
    setQuery(text);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await userService.searchUsers(text.trim());
        setResults(users);
      } catch (err) {
        console.error(`[NewMessageScreen] Search error: ${err.message}`);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);
  };

  const handleSelectUser = (user) => {
    navigation.replace('DirectMessage', { otherUserId: user._id, otherUserName: user.name });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEW MESSAGE</Text>

      <TextInput
        style={styles.input}
        placeholder="Search by name…"
        placeholderTextColor={theme.colors.muted}
        value={query}
        onChangeText={handleQueryChange}
        autoFocus
      />

      {isSearching && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: theme.spacing.lg }} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => handleSelectUser(item)} activeOpacity={0.8}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <Text style={styles.rowTitle}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.trim().length >= 2 && !isSearching ? (
            <Text style={styles.emptyText}>No users found matching "{query}"</Text>
          ) : null
        }
      />
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.containerMargin, paddingTop: theme.spacing.xl },
    title: {
      fontFamily: theme.fontFamily.display,
      fontSize: theme.fontSize.headline,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    input: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 4,
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    list: { gap: theme.spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.md,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    avatarText: { fontFamily: theme.fontFamily.bodyBold, color: theme.colors.text },
    rowTitle: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.md, color: theme.colors.text },
    emptyText: {
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.sm,
      color: theme.colors.muted,
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
  });