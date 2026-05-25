import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Send, Bot, User, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { fabianaAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

function MessageBubble({ message, isUser }) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const styles = StyleSheet.create({
    bubble: {
      maxWidth: '80%',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginVertical: spacing.xs,
    },
    userBubble: {
      backgroundColor: colors.primary,
      alignSelf: 'flex-end',
      marginLeft: 'auto',
      borderBottomRightRadius: 4,
    },
    aiBubble: {
      backgroundColor: colors.surface,
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.borderMuted,
    },
    text: {
      ...typography.bodyMd,
      color: isUser ? colors.onPrimary : colors.onSurface,
    },
  });

  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
      <Text style={styles.text}>{message.content}</Text>
    </View>
  );
}

export default function FabianaChatScreen({ navigation }) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '¡Hola! Soy Fabiana, tu asistente virtual de Confimax. ¿En qué puedo ayudarte hoy? 🤖'
      }
    ]);
  }, []);

  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const messagesToSend = messages.map(m => ({
        role: m.role,
        content: m.content
      })).concat(userMessage);

      const userRole = user?.role === 'admin' ? 'admin' : 
                     user?.role === 'vendor' || user?.role === 'vendedor' ? 'vendor' : 
                     'customer';

      const response = await fabianaAPI.chat(messagesToSend, userRole);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data?.message || 'Lo siento, no puedo responder en este momento.'
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error en chat con Fabiana:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, estoy teniendo problemas técnicos. Por favor, inténtalo de nuevo más tarde.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surfaceDim,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.page,
      paddingTop: Platform.OS === 'ios' ? 60 : spacing.page,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMuted,
    },
    backButton: {
      padding: spacing.sm,
      marginRight: spacing.sm,
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      marginRight: spacing.sm,
    },
    headerTitle: {
      ...typography.headlineMd,
      color: colors.onSurface,
    },
    headerSubtitle: {
      ...typography.bodySm,
      color: colors.muted,
    },
    messagesContainer: {
      flex: 1,
      padding: spacing.page,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.page,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.borderMuted,
    },
    input: {
      flex: 1,
      ...typography.bodyMd,
      color: colors.onSurface,
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
      minHeight: 44,
      maxHeight: 120,
    },
    sendButton: {
      width: 48,
      height: 48,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    loadingContainer: {
      padding: spacing.page,
      alignItems: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <X size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Bot size={28} color={colors.primary} style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>Fabiana</Text>
            <Text style={styles.headerSubtitle}>Asistente Virtual</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingBottom: spacing.sm }}
        >
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isUser={message.role === 'user'}
            />
          ))}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
