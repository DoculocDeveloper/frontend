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
  ChevronDown,
  Users,
} from "lucide-react";
import { toast } from "sonner";

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

export function ApplicationChat({ applicationId, isAdmin = false }: ApplicationChatProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCurrentUserStaff =
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "ACCOUNT_EXECUTIVE" ||
    Boolean(isAdmin);

  // Poll messages every 3.5 seconds
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["rental-application-messages", applicationId],
    queryFn: () => listApplicationMessages(applicationId),
    refetchInterval: 3500,
    staleTime: 1000,
  });

  // Mensagens pendentes de leitura recebidas do lado oposto (Imobiliária <-> Doculoc)
  const unreadCount = messages.filter((m) => {
    if (m.readAt) return false;
    if (isCurrentUserStaff) {
      return !m.isStaff;
    }
    return m.isStaff;
  }).length;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isOpen]);

  // Sincroniza o status da consulta na tela quando novas mensagens chegam no polling
  useEffect(() => {
    if (messages.length > 0) {
      queryClient.invalidateQueries({
        queryKey: ["rental-application", applicationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["rental-applications"],
      });
    }
  }, [messages.length, applicationId, queryClient]);

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
      queryClient.invalidateQueries({
        queryKey: ["rental-application", applicationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["rental-applications"],
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Window */}
      {isOpen ? (
        <div className="mb-3 flex h-[540px] max-h-[calc(100vh-6rem)] w-[360px] sm:w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 bg-primary px-4 py-3 text-primary-foreground shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white">
                <MessageSquare className="size-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate leading-tight">
                    Chat da Consulta
                  </h3>
                  {messages.length > 0 ? (
                    <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
                      {messages.length}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-primary-foreground/80 truncate">
                  {isCurrentUserStaff
                    ? "Histórico compartilhado • Atendimento Doculoc"
                    : "Imobiliária & Atendimento Doculoc"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="size-8 rounded-lg text-primary-foreground/90 hover:bg-white/20 hover:text-white"
                title="Minimizar chat"
              >
                <ChevronDown className="size-5" />
              </Button>
            </div>
          </div>

          {/* Banner de histórico compartilhado para a equipe Doculoc */}
          {isCurrentUserStaff ? (
            <div className="flex items-center justify-between bg-blue-50 px-3.5 py-1.5 border-b border-blue-200/80 text-[11px] text-blue-900">
              <span className="flex items-center gap-1.5 font-medium truncate">
                <Users className="size-3.5 shrink-0 text-blue-600" />
                Histórico compartilhado da equipe Doculoc
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 shrink-0">
                Visão Staff
              </span>
            </div>
          ) : null}

          {/* Subheader aviso de anexos */}
          <div className="flex items-center justify-between bg-muted/50 px-3.5 py-1.5 border-b border-border/40 text-[11px] text-muted-foreground">
            <span>Anexos até 15MB</span>
            <span className="text-[10px] font-mono">PDF • Imagens • DOCX</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-3.5">
            {isLoading && messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-xs">Carregando mensagens...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center text-muted-foreground space-y-2 px-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <MessageSquare className="size-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Nenhuma mensagem ainda
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Envie mensagens, solicite documentos ou anexe comprovantes e holerites complementares.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isAuthoredByMe = message.senderId === session?.user?.id;
                const isStaffMessage = Boolean(message.isStaff);

                // Se quem está logado for Doculoc (Admin/Staff), seu lado (à direita) são as mensagens da equipe Doculoc.
                // Se quem está logado for Imobiliária, seu lado (à direita) são as mensagens da imobiliária.
                const isFromMySide = isCurrentUserStaff ? isStaffMessage : !isStaffMessage;

                // Identificação visual do remetente
                let senderName: string;
                let badgeLabel: string;
                let badgeClass: string;
                let bubbleClass: string;
                let isBubbleDark: boolean;

                if (isCurrentUserStaff) {
                  if (isStaffMessage) {
                    if (isAuthoredByMe) {
                      senderName = "Você";
                      badgeLabel = "Doculoc";
                      badgeClass = "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30";
                      bubbleClass = "bg-primary text-primary-foreground rounded-tr-xs";
                      isBubbleDark = true;
                    } else {
                      senderName = message.sender?.name || "Administrador";
                      badgeLabel = "Doculoc • Equipe";
                      badgeClass = "bg-blue-100 text-blue-900 border-blue-200";
                      bubbleClass = "bg-blue-600 text-white rounded-tr-xs shadow-xs";
                      isBubbleDark = true;
                    }
                  } else {
                    senderName = message.sender?.name || "Imobiliária";
                    badgeLabel = "Imobiliária";
                    badgeClass = "bg-emerald-100 text-emerald-900 border-emerald-200";
                    bubbleClass = "bg-muted/80 text-foreground border border-border/60 rounded-tl-xs";
                    isBubbleDark = false;
                  }
                } else {
                  if (!isStaffMessage) {
                    senderName = isAuthoredByMe ? "Você" : message.sender?.name || "Imobiliária";
                    badgeLabel = "Imobiliária";
                    badgeClass = "bg-emerald-100 text-emerald-900 border-emerald-200";
                    bubbleClass = "bg-primary text-primary-foreground rounded-tr-xs";
                    isBubbleDark = true;
                  } else {
                    senderName = message.sender?.name || "Atendimento Doculoc";
                    badgeLabel = "Doculoc";
                    badgeClass = "bg-blue-100 text-blue-900 border-blue-200";
                    bubbleClass = "bg-muted/80 text-foreground border border-border/60 rounded-tl-xs";
                    isBubbleDark = false;
                  }
                }

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      isFromMySide ? "ml-auto items-end" : "mr-auto items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5 mb-1 px-1",
                        isFromMySide ? "justify-end" : "justify-start",
                      )}
                    >
                      <span className="text-[11px] font-semibold text-foreground/80 truncate max-w-[130px]">
                        {senderName}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[9px] px-1 py-0 h-4 font-semibold uppercase tracking-wider",
                          badgeClass,
                        )}
                      >
                        {badgeLabel}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>

                    <div
                      className={cn(
                        "rounded-2xl p-3 shadow-2xs space-y-2 text-sm",
                        bubbleClass,
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
                            isBubbleDark
                              ? "bg-white/10 border-white/20 text-white"
                              : "bg-background border-border/80 text-foreground",
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-background/90 text-foreground shadow-2xs shrink-0">
                              {getFileIcon(message.attachmentMimeType)}
                            </div>
                            <div className="min-w-0 text-left">
                              <p
                                className="text-xs font-semibold truncate max-w-[150px] sm:max-w-[180px]"
                                title={message.attachmentFileName || "anexo"}
                              >
                                {message.attachmentFileName || "Arquivo anexado"}
                              </p>
                              <span
                                className={cn(
                                  "text-[10px]",
                                  isBubbleDark ? "text-white/80" : "text-muted-foreground",
                                )}
                              >
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
                              "size-7 shrink-0 rounded-lg",
                              isBubbleDark
                                ? "text-white hover:bg-white/20 hover:text-white"
                                : "text-foreground hover:bg-black/10",
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
            <div className="mx-3 mb-2 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="size-3.5 text-primary shrink-0" />
                <span className="font-semibold text-foreground truncate max-w-[200px]">
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
          <div className="border-t border-border/60 bg-background p-3">
            <form onSubmit={handleSend} className="flex items-end gap-2">
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
                  selectedFile
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )}
                title="Anexar documento (PDF, imagem ou DOCX)"
              >
                <Paperclip className="size-4" />
              </Button>

              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isCurrentUserStaff
                    ? "Responder como Doculoc... (Enter para enviar)"
                    : "Digite uma mensagem... (Enter para enviar)"
                }
                disabled={sendMutation.isPending}
                className="min-h-[40px] max-h-[100px] rounded-xl text-xs resize-none py-2.5 px-3"
                rows={1}
              />

              <Button
                type="submit"
                size="icon"
                disabled={
                  sendMutation.isPending || (!content.trim() && !selectedFile)
                }
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
          </div>
        </div>
      ) : null}

      {/* Notification banner when closed with unread messages */}
      {!isOpen && unreadCount > 0 ? (
        <div
          onClick={() => setIsOpen(true)}
          className="mb-2 flex cursor-pointer items-center gap-2 rounded-full border border-rose-300 bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xl transition-all hover:bg-rose-700 animate-pulse"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-white" />
          </span>
          <span>{unreadCount === 1 ? "Nova mensagem recebida!" : `${unreadCount} novas mensagens!`}</span>
        </div>
      ) : null}

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex size-14 items-center justify-center rounded-full shadow-xl transition-all duration-200 hover:scale-105 active:scale-95",
          isOpen
            ? "bg-muted text-foreground border border-border shadow-md"
            : unreadCount > 0
              ? "bg-rose-600 text-white hover:bg-rose-700 ring-4 ring-rose-400/50 animate-bounce"
              : "bg-primary text-primary-foreground hover:bg-primary/95 ring-4 ring-primary/20",
        )}
        title={isOpen ? "Fechar chat" : "Abrir chat da consulta"}
      >
        {isOpen ? (
          <X className="size-6" />
        ) : (
          <>
            <MessageSquare className="size-6" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white shadow-sm animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </>
        )}
      </button>
    </div>
  );
}
