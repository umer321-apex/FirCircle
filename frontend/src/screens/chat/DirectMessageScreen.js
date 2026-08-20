import React, { useEffect, useState, useRef } from 'react';
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
import { getDirectMessages, sendDirectMessage } from '../../services/chatService';
import { getSocket } from '../../services/socket';

export default function DirectMessageScreen({ route }) {
  const { otherUserId, otherUserName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        const history = await getDirectMessages(otherUserId);
        if (isMounted) setMessages(history);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }

      const socket = await getSocket();
      socketRef.current = socket;

      socket.on('newMessage', (msg) => {
        const senderId = msg.senderId._id || msg.senderId;
        const recipientId = msg.recipientId;
        const isRelevant =
          (senderId === otherUserId && recipientId === user.id) ||
          (senderId === user.id && recipientId === otherUserId);
        if (isRelevant && !msg.podId) {
          setMessages((prev) => [...prev, msg]);
        }
      });

      socket.on('typing', ({ userId }) => {
        if (userId === otherUserId) {
          setIsTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
        }
      });
    };

    setup();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off('newMessage');
        socketRef.current.off('typing');
      }
      clearTimeout(typingTimeoutRef.current);
    };
  }, [otherUserId]);

  const handleTyping = (value) => {
    setText(value);
    socketRef.current?.emit('typing', { recipientId: otherUserId });
  };

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    const messageText = text.trim();
    setText('');
    try {
      const sent = await sendDirectMessage(otherUserId, messageText);
      // Append locally too, since the socket emit only reaches the recipient's room
      setMessages((prev) => [...prev, sent]);
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
          const senderId = item.senderId._id || item.senderId;
          const isMine = senderId === user.id;
          return (
            <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      {isTyping && (
        <Text style={styles.typingIndicator}>{otherUserName} is typing…</Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={`Message ${otherUserName}…`}
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
  bubble: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.lg,
  },
  bubbleMine: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: theme.colors.surfaceLight, borderBottomLeftRadius: 4 },
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