import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import theme from '../../constants/theme';
import { getMyPods, getConversations } from '../../services/chatService';

export default function ChatListScreen({ navigation }) {
  const [pods, setPods] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [tab, setTab] = useState('pods'); // 'pods' | 'direct'
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

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
        <Text style={styles.headerTitle}>Chat</Text>
        <TouchableOpacity
          style={styles.newPodButton}
          onPress={() => navigation.navigate('CreatePod')}
          activeOpacity={0.8}
        >
          <Text style={styles.newPodButtonText}>+ New Pod</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'pods' && styles.tabActive]}
          onPress={() => setTab('pods')}
        >
          <Text style={[styles.tabText, tab === 'pods' && styles.tabTextActive]}>Pods</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'direct' && styles.tabActive]}
          onPress={() => setTab('direct')}
        >
          <Text style={[styles.tabText, tab === 'direct' && styles.tabTextActive]}>
            Direct Messages
          </Text>
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
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ChatPod', { podId: item._id, podName: item.name })}
            >
              <View style={styles.avatar}>
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
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('DirectMessage', {
                  otherUserId: item.user._id,
                  otherUserName: item.user.name,
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.user.name?.[0]?.toUpperCase() || '?'}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  newPodButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
  },
  newPodButtonText: { color: theme.colors.white, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: theme.spacing.sm, alignItems: 'center', borderRadius: theme.radius.sm },
  tabActive: { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  tabText: { fontSize: theme.fontSize.sm, color: theme.colors.muted, fontWeight: theme.fontWeight.medium },
  tabTextActive: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold },
  listContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: { color: theme.colors.white, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.md },
  rowTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  rowSubtitle: { fontSize: theme.fontSize.sm, color: theme.colors.muted, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: theme.spacing.xxl * 2 },
  emptyIcon: { fontSize: 40, marginBottom: theme.spacing.sm },
  emptyText: { fontSize: theme.fontSize.sm, color: theme.colors.muted, textAlign: 'center' },
});