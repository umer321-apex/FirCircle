import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import theme from '../../constants/theme';
import { getPodMessages, sendPodMessage } from '../../services/chatService';
import { getSocket } from '../../services/socket';

export default function ChatPodScreen({ route }) {
  const { podId, podName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        const history = await getPodMessages(podId);
        if (isMounted) setMessages(history);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }

      const socket = await getSocket();
      socketRef.current = socket;
      socket.emit('joinPod', podId);

      socket.on('newMessage', (msg) => {
        if (msg.podId === podId) {
          setMessages((prev) => [...prev, msg]);
        }
      });

      socket.on('typing', ({ userId, podId: typingPodId }) => {
        if (typingPodId === podId && userId !== user.id) {
          setTypingUser('Someone is typing…');
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
        }
      });
    };

    setup();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.emit('leavePod', podId);
        socketRef.current.off('newMessage');
        socketRef.current.off('typing');
      }
      clearTimeout(typingTimeoutRef.current);
    };
  }, [podId]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleTyping = (value) => {
    setText(value);
    socketRef.current?.emit('typing', { podId });
  };

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    const messageText = text.trim();
    setText('');
    try {
      await sendPodMessage(podId, messageText);
      // newMessage arrives via socket broadcast, no need to manually append
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMine = item.senderId._id === user.id || item.senderId === user.id;
          return (
            <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              {!isMine && (
                <Text style={styles.senderName}>{item.senderId.name}</Text>
              )}
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      {typingUser && (
        <Text style={styles.typingIndicator}>{typingUser}</Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={`Message ${podName}…`}
          placeholderTextColor={theme.colors.muted}
          value={text}
          onChangeText={handleTyping}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (isSending || !text.trim()) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isSending || !text.trim()}
        >
          <Text style={styles.sendButtonText}>{isSending ? '…' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  messageList: { padding: theme.spacing.md, paddingBottom: theme.spacing.lg },
  bubbleRow: { marginBottom: theme.spacing.sm, maxWidth: '80%' },
  bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { fontSize: theme.fontSize.xs, color: theme.colors.muted, marginBottom: 2, marginLeft: 4 },
  bubble: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.lg,
  },
  bubbleMine: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: theme.colors.surfaceLight,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: theme.fontSize.sm, color: theme.colors.text, lineHeight: 20 },
  bubbleTextMine: { color: theme.colors.white },
  typingIndicator: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    fontStyle: 'italic',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
    maxHeight: 100,
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