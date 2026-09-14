"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import type { TutorMessage, Citation } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, FileText, Quote, Loader2, RefreshCw, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";

type MessageWithChat = TutorMessage & { chatId: string };

const SUGGESTED_QUESTIONS = [
  "Summarize the key concepts",
  "Explain the main topic in simple terms",
  "What are the most important points?",
];

export function TutorClient({ initialChats }: { initialChats: any[] }) {
  const [chats, setChats] = useState<any[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChats.length > 0 ? initialChats[0].id : null);
  const [messages, setMessages] = useState<MessageWithChat[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeChatId) {
      setMessages([]);
      setError("");
      api<TutorMessage[]>(`/tutor/chats/${activeChatId}/messages`)
        .then((msgs) => setMessages(msgs.map(m => ({ ...m, chatId: activeChatId }))))
        .catch(() => {});
    }
  }, [activeChatId]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createChat = async () => {
    try {
      const chat = await api<any>(`/tutor/chats`, {
        method: "POST",
        body: JSON.stringify({ title: "New Chat" }),
      });
      setChats((c) => [chat, ...c]);
      setActiveChatId(chat.id);
    } catch {
      setError("Failed to create chat");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChatId) return;
    const content = input.trim();
    setInput("");
    setLoading(true);
    setError("");

    setMessages((m) => [...m, { id: `temp-${Date.now()}`, role: "user" as const, content, is_grounded: false, citations: [], created_at: new Date().toISOString(), chatId: activeChatId }]);

    try {
      const msg = await api<TutorMessage>(`/tutor/chats/${activeChatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      setMessages((m) => [...m, { ...msg, chatId: activeChatId }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const retry = async (chatId: string) => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    setLoading(true);
    setError("");

    try {
      const msg = await api<TutorMessage>(`/tutor/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: lastUser.content }),
      });
      setMessages((m) => [...m, { ...msg, chatId }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to retry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <div className="w-52 shrink-0 space-y-3 hidden sm:block">
        <Button onClick={createChat} className="w-full gap-2 shadow-sm">
          <MessageSquare className="h-4 w-4" />
          New Chat
        </Button>
        <div className="space-y-1">
          {chats.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">No chats yet. Start a new one!</p>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm truncate
                  transition-colors
                  ${activeChatId === chat.id
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "hover:bg-muted text-muted-foreground"
                  }
                `}
              >
                {chat.title || "New Chat"}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Mobile new chat */}
      <div className="sm:hidden w-full">
        <Button onClick={createChat} variant="outline" size="sm" className="w-full gap-2 mb-2">
          <MessageSquare className="h-4 w-4" />
          New Chat
        </Button>
        {chats.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`
                  shrink-0 px-3 py-1.5 rounded-md text-sm truncate max-w-[160px]
                  transition-colors
                  ${activeChatId === chat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }
                `}
              >
                {chat.title || "New Chat"}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col shadow-sm">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeChatId ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Start a Conversation</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Select or create a chat to ask questions about your study materials.
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ask a question about your study materials</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  I&apos;ll search your uploaded documents to provide accurate, cited answers.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="px-3 py-1.5 rounded-full border border-primary/20 text-sm text-primary hover:bg-primary/5 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in`}
              >
                <div className={`
                  max-w-[85%] md:max-w-[75%] rounded-xl px-4 py-3
                  ${msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted border rounded-bl-sm"
                  }
                `}>
                  <div className="flex items-start gap-2">
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary shrink-0 mt-0.5">
                        <SparklesIcon />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === "assistant" && (
                        <div className="mt-3 space-y-2">
                          {msg.is_grounded ? (
                            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Grounded in your materials
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Insufficient context — answer may not be grounded
                            </div>
                          )}
                          {msg.citations?.length > 0 && (
                            <div className="space-y-2">
                              {msg.citations.map((c: Citation, i: number) => (
                                <div
                                  key={i}
                                  className="bg-background/80 rounded-lg p-3 border text-sm"
                                >
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-medium text-xs">{c.document_name}</span>
                                    {c.page_number && (
                                      <span className="text-xs text-muted-foreground">p.{c.page_number}</span>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Quote className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed italic">
                                      &ldquo;{c.excerpt}&rdquo;
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start animate-in">
              <div className="bg-muted rounded-xl rounded-bl-sm px-4 py-3 max-w-[75%]">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </CardContent>

        <div className="p-4 border-t space-y-2">
          {error && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
              {activeChatId && (
                <button
                  onClick={() => retry(activeChatId)}
                  className="shrink-0 flex items-center gap-1 text-xs text-destructive hover:underline"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              )}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your study materials..."
              disabled={loading || !activeChatId}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim() || !activeChatId}
              className="gap-1.5 shadow-sm"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill="currentColor" stroke="none" opacity="0.5" />
    </svg>
  );
}
