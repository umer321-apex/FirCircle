import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getMyPods, getConversations } from '../../services/chatService';

export default function ChatListScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [pods, setPods] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [tab, setTab] = useState('pods');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [podData, convoData] = await Promise.all([getMyPods(), getConversations()]);
      setPods(podData);
      setConversations(convoData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = () => { setRefreshing(true); load(); };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const data = tab === 'pods' ? pods : conversations;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
  <Text style={styles.headerTitle}>MESSAGES</Text>
  <View style={{ flexDirection: 'row', gap: 8 }}>
    <TouchableOpacity
      style={styles.newMessageButton}
      onPress={() => navigation.navigate('NewMessage')}
      activeOpacity={0.85}
    >
      <Text style={styles.newMessageButtonText}>✎</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.newPodButton, theme.glow.secondary]}
      onPress={() => navigation.navigate('CreatePod')}
      activeOpacity={0.85}
    >
      <Text style={styles.newPodButtonText}>+ NEW POD</Text>
    </TouchableOpacity>
  </View>
</View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'pods' && styles.tabActive]} onPress={() => setTab('pods')}>
          <Text style={[styles.tabText, tab === 'pods' && styles.tabTextActive]}>PODS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'direct' && styles.tabActive]} onPress={() => setTab('direct')}>
          <Text style={[styles.tabText, tab === 'direct' && styles.tabTextActive]}>DIRECT</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => (tab === 'pods' ? item._id : item.user._id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        renderItem={({ item }) =>
          tab === 'pods' ? (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ChatPod', { podId: item._id, podName: item.name })}
            >
              <View style={styles.podHighlightBar} />
              <View style={[styles.avatar, styles.avatarPod]}>
                <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || 'P'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSubtitle}>{item.memberIds.length} members</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('DirectMessage', { otherUserId: item.user._id, otherUserName: item.user.name })}
            >
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.user.name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={styles.onlineDot} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.user.name}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>{item.lastMessage}</Text>
              </View>
            </TouchableOpacity>
          )
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{tab === 'pods' ? '👥' : '💬'}</Text>
            <Text style={styles.emptyText}>
              {tab === 'pods' ? 'No pods yet — create one to get started.' : 'No conversations yet.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.containerMargin,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
    },
    headerTitle: {
      fontFamily: theme.fontFamily.display,
      fontSize: theme.fontSize.headline,
      color: theme.colors.text,
    },
    newPodButton: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
    },
    newPodButtonText: {
      fontFamily: theme.fontFamily.label,
      color: theme.colors.onSecondary,
      fontSize: 10,
      letterSpacing: 1,
    },
    tabRow: {
      flexDirection: 'row',
      marginHorizontal: theme.spacing.containerMargin,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surfaceLow,
      borderRadius: theme.radius.full,
      padding: 4,
    },
    tab: { flex: 1, paddingVertical: theme.spacing.sm, alignItems: 'center', borderRadius: theme.radius.full },
    tabActive: { backgroundColor: theme.colors.surfaceHigh },
    tabText: { fontFamily: theme.fontFamily.label, fontSize: 10, color: theme.colors.muted, letterSpacing: 0.5 },
    tabTextActive: { color: theme.colors.primary },
    listContent: { paddingHorizontal: theme.spacing.containerMargin, paddingBottom: theme.spacing.xl, gap: theme.spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.md,
      overflow: 'hidden',
    },
    podHighlightBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: theme.colors.primary,
    },
    avatarWrap: { position: 'relative', marginRight: theme.spacing.md },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarPod: { marginRight: theme.spacing.md, marginLeft: 8 },
    avatarText: { fontFamily: theme.fontFamily.bodyBold, color: theme.colors.text, fontSize: theme.fontSize.md },
    onlineDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.secondary,
      borderWidth: 2,
      borderColor: theme.colors.surfaceContainer,
    },
    newMessageButton: {
      width: 36,
      height: 36,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newMessageButtonText: { fontSize: 16, color: theme.colors.text },
    rowTitle: { fontFamily: theme.fontFamily.bodyBold, fontSize: theme.fontSize.md, color: theme.colors.text },
    rowSubtitle: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.sm, color: theme.colors.textVariant, marginTop: 2 },
    emptyState: { alignItems: 'center', paddingTop: theme.spacing.xxl * 2 },
    emptyIcon: { fontSize: 40, marginBottom: theme.spacing.sm },
    emptyText: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.sm, color: theme.colors.textVariant, textAlign: 'center' },
  });