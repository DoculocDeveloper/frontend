import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  Loader2,
  MessageSquare,
  X,
  File,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { getApiErrorMessage } from "@/services/api";
import {
  listApplicationMessages,
  sendApplicationMessage,
  downloadMessageAttachment,
} from "@/services/rental-applications";
import type { RentalApplicationMessage } from "@/types/doculoc";

interface ApplicationChatProps {
  applicationId: string;
  isAdmin?: boolean;
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mimeType?: string | null) {
  if (mimeType?.startsWith("image/")) {
    return <ImageIcon className="size-4 text-sky-600 shrink-0" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="size-4 text-rose-600 shrink-0" />;
  }
  return <File className="size-4 text-primary shrink-0" />;
}

export function ApplicationChat({ applicationId }: ApplicationChatProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll messages every 3.5 seconds
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["rental-application-messages", applicationId],
    queryFn: () => listApplicationMessages(applicationId),
    refetchInterval: 3500,
    staleTime: 1000,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (data: { content?: string; file?: File }) =>
      sendApplicationMessage(applicationId, data),
    onSuccess: (newMessage) => {
      setContent("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      queryClient.setQueryData<RentalApplicationMessage[]>(
        ["rental-application-messages", applicationId],
        (old = []) => [...old, newMessage],
      );
      queryClient.invalidateQueries({
        queryKey: ["rental-application-messages", applicationId],
      });
      setTimeout(scrollToBottom, 100);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanContent = content.trim();

    if (!cleanContent && !selectedFile) {
      return;
    }

    sendMutation.mutate({
      content: cleanContent || undefined,
      file: selectedFile || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("O arquivo excede o limite máximo permitido de 15MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleDownload = async (message: RentalApplicationMessage) => {
    try {
      setDownloadingId(message.id);
      await downloadMessageAttachment(
        applicationId,
        message.id,
        message.attachmentFileName || undefined,
      );
      toast.success("Download iniciado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Card className="flashlight-card bg-white/90 shadow-sm border border-border/80 flex flex-col overflow-hidden">
      <CardHeader className="border-b border-border/50 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">
              <MessageSquare className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                Chat & Documentos
                {messages.length > 0 ? (
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-semibold">
                    {messages.length}
                  </Badge>
                ) : null}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Comunicação direta entre Imobiliária e Administrador para esta consulta.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/60">
            Anexos até 15MB (PDF, Imagens, DOCX)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex flex-col flex-1">
        {/* Messages Feed */}
        <div className="min-h-[220px] max-h-[380px] overflow-y-auto space-y-3 pr-1 py-1">
          {isLoading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Carregando histórico do chat...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-1">
              <MessageSquare className="size-8 opacity-40 mb-1" />
              <p className="text-sm font-medium text-foreground">Nenhuma mensagem ainda.</p>
              <p className="text-xs max-w-sm">
                Utilize o chat para enviar dúvidas, solicitar ou anexar comprovantes de renda, holerites ou documentos complementares.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isMe = message.senderId === session?.user?.id;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col max-w-[85%] sm:max-w-[75%]",
                    isMe ? "ml-auto items-end" : "mr-auto items-start",
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-foreground/80 truncate max-w-[140px]">
                      {isMe ? "Você" : message.sender?.name || "Usuário"}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[9px] px-1 py-0 h-4 font-semibold uppercase tracking-wider",
                        message.isStaff
                          ? "bg-blue-100 text-blue-900 border border-blue-200"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-200",
                      )}
                    >
                      {message.isStaff ? "Doculoc" : "Imobiliária"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "rounded-2xl p-3 shadow-2xs space-y-2 text-sm",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-xs"
                        : "bg-muted/70 text-foreground border border-border/60 rounded-tl-xs",
                    )}
                  >
                    {message.content ? (
                      <p className="whitespace-pre-wrap break-words leading-relaxed text-xs sm:text-sm">
                        {message.content}
                      </p>
                    ) : null}

                    {message.attachmentKey ? (
                      <div
                        className={cn(
                          "rounded-xl p-2.5 flex items-center justify-between gap-3 border transition-colors",
                          isMe
                            ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                            : "bg-background border-border/80 text-foreground",
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-background/80 shadow-2xs shrink-0">
                            {getFileIcon(message.attachmentMimeType)}
                          </div>
                          <div className="min-w-0 text-left">
                            <p
                              className="text-xs font-semibold truncate max-w-[160px] sm:max-w-[200px]"
                              title={message.attachmentFileName || "anexo"}
                            >
                              {message.attachmentFileName || "Arquivo anexado"}
                            </p>
                            <span className="text-[10px] opacity-75">
                              {formatBytes(message.attachmentSizeBytes)}
                            </span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={downloadingId === message.id}
                          onClick={() => handleDownload(message)}
                          className={cn(
                            "size-7 shrink-0 rounded-lg hover:bg-black/10",
                            isMe ? "text-primary-foreground hover:text-white" : "text-foreground",
                          )}
                          title="Baixar documento"
                        >
                          {downloadingId === message.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Download className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected file preview */}
        {selectedFile ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Paperclip className="size-3.5 text-primary shrink-0" />
              <span className="font-semibold text-foreground truncate max-w-[220px]">
                {selectedFile.name}
              </span>
              <span className="text-muted-foreground text-[10px] shrink-0">
                ({formatBytes(selectedFile.size)})
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="size-6 text-muted-foreground hover:text-destructive"
              title="Remover anexo"
            >
              <X className="size-3" />
            </Button>
          </div>
        ) : null}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="mt-3 flex items-end gap-2 pt-2 border-t border-border/50">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,application/pdf,image/*,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendMutation.isPending}
            className={cn(
              "size-10 rounded-xl shrink-0 transition-colors",
              selectedFile ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
            )}
            title="Anexar documento (PDF, imagem ou DOCX)"
          >
            <Paperclip className="size-4" />
          </Button>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem... (Enter para enviar)"
            disabled={sendMutation.isPending}
            className="min-h-[40px] max-h-[110px] rounded-xl text-xs sm:text-sm resize-none py-2.5 px-3"
            rows={1}
          />

          <Button
            type="submit"
            size="icon"
            disabled={sendMutation.isPending || (!content.trim() && !selectedFile)}
            className="size-10 rounded-xl shrink-0 gap-1"
            title="Enviar mensagem"
          >
            {sendMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
