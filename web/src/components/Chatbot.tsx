"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Loader2, Bot, User, Minimize2, Maximize2, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence, useDragControls } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "¡Hola! Soy Fabiana, tu asistente virtual de Confimax. ¿En qué puedo ayudarte hoy?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const windowDragControls = useDragControls();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await api.chatWithFabiana([{
        role: userMessage.role,
        content: userMessage.content
      }], user?.role || 'cliente');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: (data as { message?: string }).message || "Lo siento, no pude procesar tu solicitud.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error en el chat:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "¿Cómo registro una venta?",
    "¿Cómo veo el inventario?",
    "¿Cómo agrego un cliente?",
  ];

  return (
    <>
      {/* Constraints boundary */}
      <div 
        ref={constraintsRef} 
        className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" 
      />

      <AnimatePresence>
        {!isOpen ? (
          <motion.div
            key="chat-bubble-wrapper"
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-10 right-6 z-[10000] pointer-events-auto touch-none"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-center border-2 border-white/30 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-blue-500/20"
            >
              <MessageCircle className="w-8 h-8 pointer-events-none" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="chat-window-wrapper"
            drag
            dragListener={false}
            dragControls={windowDragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 right-6 z-[10000] pointer-events-auto touch-none"
          >
            <div
              className={`bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#222] overflow-hidden transition-all duration-300 ${
                isMinimized ? "w-16 h-16" : "w-[calc(100vw-2rem)] sm:w-96 h-[600px] max-h-[calc(100vh-6rem)]"
              }`}
            >
              {isMinimized ? (
                <button
                  onClick={() => setIsMinimized(false)}
                  className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white"
                >
                  <Maximize2 className="w-6 h-6" />
                </button>
              ) : (
                <div className="flex flex-col h-full">
                  <div 
                    onPointerDown={(e) => windowDragControls.start(e)}
                    className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 flex items-center justify-between flex-shrink-0 cursor-move active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3 select-none pointer-events-none">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Fabiana</h3>
                        <p className="text-[10px] opacity-80">Asistente Virtual</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          try { api.downloadProductsPDF(); } catch (err) {}
                        }}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMinimized(true);
                        }}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <Minimize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                        }}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a] brutal-scrollbar">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                            message.role === "user"
                              ? "bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-tr-sm"
                              : "bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#333] rounded-tl-sm text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          <div className="text-sm leading-relaxed">
                            {message.role === "assistant" ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  table: ({ ...props }) => (
                                    <div className="overflow-x-auto my-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                                      <table className="w-full border-collapse text-xs" {...props} />
                                    </div>
                                  ),
                                  th: ({ ...props }) => <th className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-left font-bold" {...props} />,
                                  td: ({ ...props }) => <td className="px-2 py-1 border-b border-gray-100 dark:border-gray-800" {...props} />,
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            ) : message.content}
                          </div>
                          <p className={`text-[9px] mt-1 text-right opacity-60 ${message.role === "user" ? "text-white" : "text-gray-500"}`}>
                            {message.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 bg-gray-200 dark:bg-[#222] rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#333] p-3 rounded-2xl rounded-tl-sm shadow-sm">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="p-4 border-t border-gray-100 dark:border-[#222] bg-white dark:bg-[#111]"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pregunta a Fabiana..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-2xl hover:shadow-lg disabled:opacity-50 transition-all shadow-blue-500/10"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
