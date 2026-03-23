import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Bot, Send, Loader2, User, ChevronDown, ChevronUp, Layers, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageActions, type ArtifactType } from "./MessageActions";
import { ArtifactWorkspace, type Artifact } from "./ArtifactWorkspace";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface VideoStudyBuddyProps {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  userId: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-studybuddy`;
const ARTIFACT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-artifact`;

async function streamVideoChat({
  messages, videoId, videoTitle, videoUrl, onDelta, onDone, onError,
}: {
  messages: Message[]; videoId: string; videoTitle: string; videoUrl: string;
  onDelta: (text: string) => void; onDone: () => void; onError: (err: string) => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) { onError("Please sign in"); return; }

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })), videoId, videoTitle, videoUrl }),
    });
    if (!resp.ok) { const err = await resp.json().catch(() => ({ error: "Failed" })); onError(err.error || "Failed"); return; }
    if (!resp.body) { onError("No response"); return; }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") { onDone(); return; }
        try { const p = JSON.parse(json); const c = p.choices?.[0]?.delta?.content; if (c) onDelta(c); } catch { /* skip */ }
      }
    }
    onDone();
  } catch { onError("Connection failed. Please try again."); }
}

export const VideoStudyBuddy = ({ videoId, videoTitle, videoUrl, userId }: VideoStudyBuddyProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [view, setView] = useState<"chat" | "workspace">("chat");
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [generatingType, setGeneratingType] = useState<ArtifactType | null>(null);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Load chat history
  useEffect(() => {
    setHistoryLoaded(false); setMessages([]); setInput("");
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("video_chat_messages" as any).select("role, content, created_at")
        .eq("user_id", userId).eq("video_id", videoId).order("created_at", { ascending: true });
      if (!error && data && (data as any[]).length > 0) {
        setMessages((data as any[]).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content, timestamp: m.created_at })));
      } else {
        const welcomeContent = videoTitle
          ? `Hey! 👋 I'm here to help you with any questions about "${videoTitle}". Ask me anything!`
          : `Hey! 👋 I'm here to help with any questions about this video. Ask me anything!`;
        const welcomeMsg: Message = { role: "assistant", content: welcomeContent, timestamp: new Date().toISOString() };
        setMessages([welcomeMsg]);
        await supabase.from("video_chat_messages" as any).insert({ user_id: userId, video_id: videoId, video_title: videoTitle || null, video_url: videoUrl, role: "assistant", content: welcomeContent } as any);
      }
      setHistoryLoaded(true);
    };
    loadHistory();
  }, [videoId, userId, videoTitle, videoUrl]);

  const loadArtifacts = useCallback(async () => {
    const { data } = await supabase.from("video_chat_artifacts" as any).select("*")
      .eq("user_id", userId).eq("video_id", videoId).order("created_at", { ascending: false });
    if (data) setArtifacts(data as any as Artifact[]);
  }, [userId, videoId]);

  useEffect(() => { loadArtifacts(); }, [loadArtifacts]);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const persistMessage = async (role: "user" | "assistant", content: string) => {
    await supabase.from("video_chat_messages" as any).insert({ user_id: userId, video_id: videoId, video_title: videoTitle || null, video_url: videoUrl, role, content } as any);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]); setInput(""); setIsLoading(true);
    persistMessage("user", userMsg.content);
    let assistantContent = "";
    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.timestamp) return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        return [...prev, { role: "assistant" as const, content: assistantContent }];
      });
    };
    await streamVideoChat({
      messages: [...messages, userMsg], videoId, videoTitle, videoUrl,
      onDelta: upsertAssistant,
      onDone: () => { setIsLoading(false); if (assistantContent) { persistMessage("assistant", assistantContent); setMessages(prev => prev.map((m, i) => i === prev.length - 1 && m.role === "assistant" && !m.timestamp ? { ...m, timestamp: new Date().toISOString() } : m)); } },
      onError: (error) => { const errMsg = `Sorry, I encountered an error: ${error}`; setMessages(prev => [...prev, { role: "assistant", content: errMsg, timestamp: new Date().toISOString() }]); persistMessage("assistant", errMsg); setIsLoading(false); },
    });
  }, [input, isLoading, messages, videoId, videoTitle, videoUrl]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleMessageAction = useCallback(async (type: ArtifactType, content: string, messageIndex: number) => {
    if (type === "export") {
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `message-${messageIndex}.md`; a.click();
      URL.revokeObjectURL(url); toast.success("Exported"); return;
    }
    // Both "summary" and "notes" call the edge function, notes generates a downloadable .txt with markdown
    setGeneratingType(type); setGeneratingIndex(messageIndex);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in"); return; }
      const resp = await fetch(ARTIFACT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ artifactType: type, messageContent: content, videoId, messageIndex }),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({ error: "Failed" })); toast.error(err.error || "Generation failed"); return; }
      const { artifact } = await resp.json();
      await loadArtifacts();

      if (type === "notes") {
        // Download as editable .txt file with markdown content
        const noteContent = `# ${artifact.title}\n\n${artifact.content}`;
        const blob = new Blob([noteContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${(artifact.title || "notes").replace(/[^a-zA-Z0-9 ]/g, "_")}.txt`; a.click();
        URL.revokeObjectURL(url);
        toast.success("Notes downloaded as .txt");
      } else {
        setActiveArtifactId(artifact.id); setView("workspace"); toast.success("Generated successfully");
      }
    } catch { toast.error("Failed to generate"); }
    finally { setGeneratingType(null); setGeneratingIndex(null); }
  }, [userId, videoId, loadArtifacts]);

  const truncatedTitle = videoTitle && videoTitle.length > 40 ? videoTitle.slice(0, 40) + "…" : videoTitle || "Video";

  if (!historyLoaded) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm flex items-center justify-center h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const containerHeight = isMobile ? "h-[400px]" : "h-[520px]";

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm flex flex-col overflow-hidden", containerHeight)}>
      {/* Header — shared between both views */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
        {view === "workspace" ? (
          <>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs px-2" onClick={() => setView("chat")}>
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </Button>
            <div className="flex-1" />
            <span className="text-xs font-medium text-muted-foreground">{artifacts.length} artifact{artifacts.length !== 1 ? "s" : ""}</span>
          </>
        ) : (
          <>
            <button
              onClick={() => isMobile && setCollapsed(!collapsed)}
              className={cn("flex items-center gap-2.5 flex-1 min-w-0", isMobile && "cursor-pointer")}
            >
              <div className="p-1.5 rounded-lg bg-primary shrink-0">
                <Bot className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h4 className="text-sm font-semibold text-foreground leading-tight">StudyBuddy</h4>
                <p className="text-[11px] text-muted-foreground truncate leading-tight">{truncatedTitle}</p>
              </div>
              {isMobile && (collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />)}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 relative"
              onClick={() => { setView("workspace"); setActiveArtifactId(null); }}
            >
              <Layers className="w-4 h-4" />
              {artifacts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold leading-none">
                  {artifacts.length}
                </span>
              )}
            </Button>
          </>
        )}
      </div>

      {/* View content */}
      {view === "workspace" ? (
        <ArtifactWorkspace
          videoId={videoId}
          userId={userId}
          artifacts={artifacts}
          onArtifactsChange={loadArtifacts}
          onClose={() => setView("chat")}
          activeArtifactId={activeArtifactId}
        />
      ) : (
        (!isMobile || !collapsed) && (
          <>
            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn("flex gap-2 group", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-accent" />
                      </div>
                    )}
                    <div className="flex flex-col max-w-[85%]">
                      <div className={cn(
                        "rounded-2xl px-3 py-2",
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      )}>
                        {msg.role === "assistant" ? (
                          <MarkdownRenderer content={msg.content} className="text-sm" />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                      {msg.role === "assistant" && msg.timestamp && i > 0 && (
                        <div className="flex justify-start mt-0.5 ml-1">
                          <MessageActions
                            messageContent={msg.content}
                            messageIndex={i}
                            onAction={handleMessageAction}
                            isGenerating={generatingIndex === i}
                            generatingType={generatingIndex === i ? generatingType : null}
                          />
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="bg-secondary rounded-2xl px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border shrink-0">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about the video..."
                  disabled={isLoading}
                  className="flex-1 bg-secondary border-border text-sm h-9"
                />
                <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="icon" className="bg-primary hover:bg-primary/90 shrink-0 h-9 w-9">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
};
