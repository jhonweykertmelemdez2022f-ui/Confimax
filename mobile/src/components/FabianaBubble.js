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
  Modal,
  Animated,
  PanResponder
} from 'react-native';
import { Send, Bot, User, X, MessageCircle, Loader2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { fabianaAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

function MessageBubble({ message, isUser }) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
    timestamp: {
      ...typography.label,
      color: isUser ? colors.onPrimary + '99' : colors.muted,
      marginTop: spacing.xs,
      textAlign: 'right',
    },
  });

  return (
    <View style={[
      styles.bubble,
      isUser ? styles.userBubble : styles.aiBubble
    ]}>
      <Text style={styles.text}>{message.content}</Text>
      {message.timestamp && (
        <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
      )}
    </View>
  );
}

export default function FabianaBubble() {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const { user } = useAuthStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy Fabiana, tu asistente virtual de Confimax. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();
  
  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Solo capturar si hay un movimiento real (evita capturar taps simples)
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        isDragging.current = false;
        pan.flattenOffset();
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        pan.flattenOffset();
      }
    })
  ).current;

  useEffect(() => {
    if (isOpen && scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const messagesToSend = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const userRole = user?.role === 'admin' ? 'admin' : 
                     user?.role === 'vendor' || user?.role === 'vendedor' ? 'vendor' : 
                     'customer';

      console.log('Enviando a Fabiana:', { messages: messagesToSend, role: userRole });
      const response = await fabianaAPI.chat(messagesToSend, userRole);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data?.message || 'Lo siento, no pude procesar tu solicitud.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error en el chat:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.response?.data?.message || error.response?.data?.error || 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    '¿Cómo registro una venta?',
    '¿Cómo veo el inventario?',
    '¿Cómo agrego un cliente?',
  ];

  const styles = StyleSheet.create({
    bubbleButton: {
      position: 'absolute',
      bottom: 80,
      right: 20,
      width: 64,
      height: 64,
      borderRadius: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 999,
    },
    bubbleContent: {
      width: '100%',
      height: '100%',
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    chatContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
      width: '100%',
      maxHeight: '85%',
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.page,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMuted,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    headerTitle: {
      ...typography.headlineMd,
      color: '#FFFFFF',
    },
    headerSubtitle: {
      ...typography.bodySm,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    messagesContainer: {
      flex: 1,
      padding: spacing.page,
      backgroundColor: colors.surfaceDim,
    },
    quickQuestionsContainer: {
      paddingHorizontal: spacing.page,
      paddingBottom: spacing.sm,
      backgroundColor: colors.surfaceDim,
    },
    quickQuestionsLabel: {
      ...typography.bodySm,
      color: colors.muted,
      marginBottom: spacing.sm,
    },
    quickQuestionsButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    quickQuestionButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.borderMuted,
    },
    quickQuestionText: {
      ...typography.bodySm,
      color: colors.onSurface,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.page,
      borderTopWidth: 1,
      borderTopColor: colors.borderMuted,
      backgroundColor: colors.surface,
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
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginVertical: spacing.xs,
    },
    messageAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: spacing.xs,
    },
  });

  const handlePress = () => {
    if (!isDragging.current) {
      setIsOpen(true);
    }
  };

  if (!isOpen) {
    return (
      <Animated.View
        style={[
          styles.bubbleButton, 
          { 
            transform: [
              { translateX: pan.x },
              { translateY: pan.y }
            ] 
          }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, styles.bubbleContent]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6']}
            style={styles.bubbleContent}
          >
            <MessageCircle size={32} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Modal
        visible={isOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
      <View 
        style={styles.modalOverlay}
        onTouchStart={() => setIsOpen(false)}
      >
        <View 
          style={styles.chatContainer}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerAvatar}>
                <Bot size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Fabiana</Text>
                <Text style={styles.headerSubtitle}>Asistente virtual de Confimax</Text>
              </View>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setIsOpen(false)}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={{ paddingBottom: spacing.sm }}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.role === 'user' ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }
                ]}
              >
                {message.role === 'assistant' && (
                  <View style={[styles.messageAvatar, { backgroundColor: '#3B82F6' }]}>
                    <Bot size={16} color="#FFFFFF" />
                  </View>
                )}
                <MessageBubble message={message} isUser={message.role === 'user'} />
                {message.role === 'user' && (
                  <View style={[styles.messageAvatar, { backgroundColor: colors.surfaceVariant }]}>
                    <User size={16} color={colors.muted} />
                  </View>
                )}
              </View>
            ))}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <View style={[styles.messageAvatar, { backgroundColor: '#3B82F6' }]}>
                  <Bot size={16} color="#FFFFFF" />
                </View>
                <View style={{ padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderMuted }}>
                  <Loader2 size={20} color="#3B82F6" />
                </View>
              </View>
            )}
          </ScrollView>

          {messages.length === 1 && (
            <View style={styles.quickQuestionsContainer}>
              <Text style={styles.quickQuestionsLabel}>Preguntas frecuentes:</Text>
              <View style={styles.quickQuestionsButtons}>
                {quickQuestions.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.quickQuestionButton}
                    onPress={() => {
                      setInput(q);
                    }}
                  >
                    <Text style={styles.quickQuestionText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Escribe tu mensaje..."
              placeholderTextColor={colors.muted}
              multiline
              maxLength={500}
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!input.trim() || isLoading}
            >
              <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                style={[StyleSheet.absoluteFillObject, { borderRadius: borderRadius.full }]}
              />
              {isLoading ? (
                <Loader2 size={20} color="#FFFFFF" />
              ) : (
                <Send size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
