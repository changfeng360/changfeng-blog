"use client";

import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  MessageSquare,
  Reply,
  Send,
  ShieldCheck,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { useAdmin } from "@/components/admin/AdminContext";
import RichText from "@/components/RichText";
import RichTextEditor from "@/components/RichTextEditor";
import AdminModal from "@/components/admin/AdminModal";

type GuestReply = {
  id: string;
  nickname: string;
  content: string;
  avatarUrl?: string;
  images?: string[];
  isAuthor: boolean;
  likes: number;
  createdAt: string;
};

type GuestMessage = GuestReply & {
  replies: GuestReply[];
};

const inputClass =
  "w-full rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm text-ink outline-none backdrop-blur-xl transition-colors duration-200 placeholder:text-ink-faint focus:border-accent-blue/60 dark:border-white/10 dark:bg-white/10 dark:text-white";

const LIKE_STORAGE_KEY = "changfeng-guest-liked";
const MAX_UPLOAD_IMAGES = 2;
const MAX_IMAGE_DATA_LENGTH = 260000;

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function readLikedIds(): string[] {
  try {
    const value = window.localStorage.getItem(LIKE_STORAGE_KEY);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片读取失败"));
    image.src = src;
  });
}

async function compressImage(file: File): Promise<string> {
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("图片不能超过 15MB");
  }
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const maxEdge = 1000;
  const scale = Math.min(
    1,
    maxEdge / Math.max(image.naturalWidth, image.naturalHeight),
  );
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  let context = canvas.getContext("2d");
  if (!context) {
    throw new Error("图片处理失败");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  let quality = 0.82;
  let output = canvas.toDataURL("image/webp", quality);
  if (!output.startsWith("data:image/webp")) {
    output = canvas.toDataURL("image/jpeg", quality);
  }
  while (output.length > MAX_IMAGE_DATA_LENGTH && quality > 0.35) {
    quality -= 0.08;
    output = canvas.toDataURL("image/webp", quality);
    if (!output.startsWith("data:image/webp")) {
      output = canvas.toDataURL("image/jpeg", quality);
    }
  }
  if (output.length > MAX_IMAGE_DATA_LENGTH) {
    const shrink = Math.sqrt(MAX_IMAGE_DATA_LENGTH / output.length);
    width = Math.max(1, Math.round(width * shrink));
    height = Math.max(1, Math.round(height * shrink));
    canvas.width = width;
    canvas.height = height;
    context = canvas.getContext("2d");
    if (!context) {
      throw new Error("图片处理失败");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    output = canvas.toDataURL("image/jpeg", 0.72);
  }
  if (output.length > MAX_IMAGE_DATA_LENGTH) {
    throw new Error("图片压缩后仍然过大，请换一张试试");
  }
  return output;
}

export default function Guestbook() {
  const { isAdmin, token } = useAdmin();
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyNickname, setReplyNickname] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  async function loadMessages() {
    try {
      const response = await fetch("/api/guestbook");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "留言加载失败");
      }
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "留言加载失败");
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    setLikedIds(readLikedIds());
    loadMessages();
  }, []);

  async function postMessage() {
    if (busy) {
      return;
    }
    if (!isAdmin && !nickname.trim()) {
      setError("请输入昵称");
      return;
    }
    if (!isAdmin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("请输入有效的邮箱");
      return;
    }
    if (!content.trim() && draftImages.length === 0) {
      setError("请输入留言内容");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isAdmin ? { "x-admin-token": token } : {}),
        },
        body: JSON.stringify({
          action: "add",
          nickname,
          email,
          content,
          images: draftImages,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "发表失败");
      }
      setMessages(data.messages || []);
      setNickname("");
      setEmail("");
      setContent("");
      setDraftImages([]);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发表失败");
    } finally {
      setBusy(false);
    }
  }

  async function postReply(parentId: string) {
    if (busy) {
      return;
    }
    if (!isAdmin && !replyNickname.trim()) {
      setError("请输入昵称");
      return;
    }
    if (!isAdmin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyEmail.trim())) {
      setError("请输入有效的邮箱");
      return;
    }
    if (!replyContent.trim() && replyImages.length === 0) {
      setError("请输入回复内容");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isAdmin ? { "x-admin-token": token } : {}),
        },
        body: JSON.stringify({
          action: "reply",
          parentId,
          nickname: isAdmin ? "长风" : replyNickname,
          email: replyEmail,
          content: replyContent,
          images: replyImages,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "回复失败");
      }
      setMessages(data.messages || []);
      setReplyTarget(null);
      setReplyNickname("");
      setReplyEmail("");
      setReplyContent("");
      setReplyImages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "回复失败");
    } finally {
      setBusy(false);
    }
  }

  async function like(id: string, parentId?: string) {
    if (likedIds.includes(id)) {
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "like",
          id,
          parentId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "点赞失败");
      }
      setMessages(data.messages || []);
      const next = [...likedIds, id];
      setLikedIds(next);
      window.localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      setError(err instanceof Error ? err.message : "点赞失败");
    }
  }

  async function adminDelete(id: string, parentId?: string) {
    if (!isAdmin || !window.confirm("确定删除这条留言吗？")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/guestbook", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ id, parentId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "删除失败");
      }
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  function openReply(messageId: string) {
    setError("");
    setReplyTarget(messageId);
  }

  function closeReply() {
    setReplyTarget(null);
    setReplyNickname("");
    setReplyEmail("");
    setReplyContent("");
    setReplyImages([]);
    setError("");
  }

  return (
    <section className="mt-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip pixel-font !text-[12px] text-accent-mint">
            06 // GUESTBOOK
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            留言
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            在这里留下你的足迹~
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip pixel-font !text-[12px] text-ink-soft">
            {messages.length} MESSAGES
          </span>
          <button
            type="button"
            onClick={() => {
              setError("");
              setModalOpen(true);
            }}
            className="pixel-btn rounded-full px-5 py-3"
          >
            <MessageSquare className="h-4 w-4" />
            留言
          </button>
        </div>
      </div>

      <div className="glass rounded-5xl p-6 sm:p-8">
        <div className="mt-8 space-y-5">
          {loaded && messages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/50 bg-white/30 p-8 text-center backdrop-blur-xl dark:border-white/15 dark:bg-white/10">
              <MessageSquare className="mx-auto h-6 w-6 text-ink-soft" />
              <p className="mt-3 text-sm text-ink-soft">
                还没有留言，来抢沙发吧
              </p>
            </div>
          ) : null}

          {messages.map((message) => (
            <GuestMessageCard
              key={message.id}
              message={message}
              isAdmin={isAdmin}
              likedIds={likedIds}
              onOpenReply={() => openReply(message.id)}
              onLike={(id, parentId) => like(id, parentId)}
              onDelete={(id, parentId) => adminDelete(id, parentId)}
            />
          ))}
        </div>
      </div>

      <AdminModal
        open={modalOpen}
        title="写留言"
        onClose={() => {
          setDraftImages([]);
          setModalOpen(false);
        }}
      >
        <div className="space-y-4">
          {isAdmin ? (
            <span className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm font-medium text-ink backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
              <ShieldCheck className="h-4 w-4 text-accent-pink" />
              长风
            </span>
          ) : (
            <>
              <input
                type="text"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="昵称"
                maxLength={30}
                className={inputClass}
              />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="邮箱（用于接收博主回复）"
                maxLength={120}
                className={inputClass}
              />
            </>
          )}
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="想说的话..."
            rows={6}
            maxLength={1000}
          />
          <GuestImageUploader
            images={draftImages}
            onChange={setDraftImages}
            onError={setError}
          />
          {error ? (
            <p className="text-sm text-accent-pink">{error}</p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setDraftImages([]);
                setModalOpen(false);
              }}
              className="rounded-full border border-white/60 bg-white/60 px-5 py-3 text-sm font-medium text-ink backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white"
            >
              取消
            </button>
            <button
              type="button"
              onClick={postMessage}
              disabled={busy}
              className="pixel-btn rounded-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {busy ? "Sending" : "发表"}
            </button>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={replyTarget !== null}
        title="写回复"
        onClose={closeReply}
      >
        <div className="space-y-4">
          {isAdmin ? (
            <span className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm font-medium text-ink backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
              <ShieldCheck className="h-4 w-4 text-accent-pink" />
              长风
            </span>
          ) : (
            <>
              <input
                type="text"
                value={replyNickname}
                onChange={(event) => setReplyNickname(event.target.value)}
                placeholder="昵称"
                maxLength={30}
                className={inputClass}
              />
              <input
                type="email"
                value={replyEmail}
                onChange={(event) => setReplyEmail(event.target.value)}
                placeholder="邮箱（用于接收博主回复）"
                maxLength={120}
                className={inputClass}
              />
            </>
          )}
          <RichTextEditor
            value={replyContent}
            onChange={setReplyContent}
            placeholder="写下你的回复..."
            rows={4}
            maxLength={1000}
          />
          <GuestImageUploader
            images={replyImages}
            onChange={setReplyImages}
            onError={setError}
          />
          {error ? (
            <p className="text-sm text-accent-pink">{error}</p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeReply}
              className="rounded-full border border-white/60 bg-white/60 px-5 py-3 text-sm font-medium text-ink backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                if (replyTarget) {
                  postReply(replyTarget);
                }
              }}
              disabled={busy}
              className="pixel-btn rounded-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {busy ? "Sending" : "回复"}
            </button>
          </div>
        </div>
      </AdminModal>
    </section>
  );
}

function GuestImageUploader({
  images,
  onChange,
  onError,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  onError: (message: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) {
      return;
    }
    onError("");
    const incoming = Array.from(files);
    if (images.length + incoming.length > MAX_UPLOAD_IMAGES) {
      onError("最多上传 2 张图片");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    const next = [...images];
    for (const file of incoming) {
      try {
        next.push(await compressImage(file));
      } catch (err) {
        onError(err instanceof Error ? err.message : "图片处理失败");
      }
    }
    onChange(next);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="chip transition-transform duration-150 ease-out hover:bg-white active:scale-95"
        title="添加图片"
      >
        <ImagePlus className="h-3.5 w-3.5" />
        添加图片
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((src, index) => (
            <div
              key={`${src.slice(0, 32)}-${index}`}
              className="relative"
            >
              <img
                src={src}
                alt=""
                className="h-16 w-16 rounded-2xl border border-white/60 bg-white/50 object-cover shadow-apple-sm dark:border-white/10"
              />
              <button
                type="button"
                onClick={() =>
                  onChange(images.filter((_, imageIndex) => imageIndex !== index))
                }
                className="icon-button absolute -right-1.5 -top-1.5 !h-6 !w-6"
                aria-label="移除图片"
                title="移除图片"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Avatar({
  nickname,
  avatarUrl,
  className = "",
}: {
  nickname: string;
  avatarUrl?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/5 bg-white/80 font-mono text-sm font-bold text-accent-blue shadow-apple-sm dark:border-white/10 dark:bg-white/20 ${className}`}
    >
      <span>{nickname.slice(0, 1).toUpperCase()}</span>
      {avatarUrl && !failed ? (
        <img
          src={avatarUrl}
          alt=""
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </span>
  );
}

function GuestImages({ images }: { images?: string[] }) {
  if (!images || images.length === 0) {
    return null;
  }
  return (
    <div
      className={`mt-3 grid gap-2 ${
        images.length > 1 ? "grid-cols-2" : "grid-cols-1"
      }`}
    >
      {images.map((src, index) => (
        <img
          key={`${src.slice(0, 32)}-${index}`}
          src={src}
          alt=""
          loading="lazy"
          className="max-h-80 w-full rounded-2xl border border-white/50 bg-white/40 object-cover dark:border-white/10 dark:bg-white/10"
        />
      ))}
    </div>
  );
}

function GuestMessageCard({
  message,
  isAdmin,
  likedIds,
  onOpenReply,
  onLike,
  onDelete,
}: {
  message: GuestMessage;
  isAdmin: boolean;
  likedIds: string[];
  onOpenReply: () => void;
  onLike: (id: string, parentId?: string) => void;
  onDelete: (id: string, parentId?: string) => void;
}) {
  const messageLiked = likedIds.includes(message.id);

  return (
    <article className="rounded-4xl border border-white/60 bg-white/45 p-5 shadow-apple-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            nickname={message.nickname}
            avatarUrl={message.avatarUrl}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink">
                {message.nickname}
              </span>
              {message.isAuthor ? (
                <span className="chip pixel-font !text-[11px] text-accent-pink">
                  博主
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-ink-soft">
              {formatTime(message.createdAt)}
            </p>
          </div>
        </div>
        {isAdmin ? (
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            className="icon-button !h-8 !w-8"
            aria-label="删除留言"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <RichText
        content={message.content}
        className="mt-4 break-words text-sm leading-relaxed text-ink"
      />
      <GuestImages images={message.images} />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onLike(message.id)}
          disabled={messageLiked}
          className={`chip transition-transform duration-150 ease-out active:scale-95 ${
            messageLiked
              ? "border-pixel-ink bg-pixel-cream text-pixel-ink shadow-pixel-sm"
              : "hover:bg-white"
          }`}
        >
          <ThumbsUp
            className={`h-3.5 w-3.5 ${
              messageLiked ? "fill-pixel-ink" : ""
            }`}
          />
          {message.likes || 0}
        </button>
        <button
          type="button"
          onClick={onOpenReply}
          className="chip transition-transform duration-150 ease-out active:scale-95 hover:bg-white"
        >
          <Reply className="h-3.5 w-3.5" />
          评论
        </button>
      </div>

      {message.replies && message.replies.length > 0 ? (
        <div className="mt-5 space-y-3 border-l-2 border-white/50 pl-4 dark:border-white/15">
          {message.replies.map((reply) => (
            <div
              key={reply.id}
              className="rounded-2xl border border-white/50 bg-white/35 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Avatar
                    nickname={reply.nickname}
                    avatarUrl={reply.avatarUrl}
                    className="!h-8 !w-8 !text-xs"
                  />
                  <span className="text-sm font-semibold text-ink">
                    {reply.nickname}
                  </span>
                  {reply.isAuthor ? (
                    <span className="chip pixel-font !text-[11px] text-accent-pink">
                      博主
                    </span>
                  ) : null}
                  <span className="text-xs text-ink-soft">
                    {formatTime(reply.createdAt)}
                  </span>
                </div>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => onDelete(reply.id, message.id)}
                    className="icon-button !h-7 !w-7"
                    aria-label="删除回复"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <RichText
                content={reply.content}
                className="mt-2 break-words text-sm leading-relaxed text-ink"
              />
              <GuestImages images={reply.images} />
              <button
                type="button"
                onClick={() => onLike(reply.id, message.id)}
                disabled={likedIds.includes(reply.id)}
                className={`chip mt-3 transition-transform duration-150 ease-out active:scale-95 ${
                  likedIds.includes(reply.id)
                    ? "border-pixel-ink bg-pixel-cream text-pixel-ink shadow-pixel-sm"
                    : "hover:bg-white"
                }`}
              >
                <ThumbsUp
                  className={`h-3.5 w-3.5 ${
                    likedIds.includes(reply.id) ? "fill-pixel-ink" : ""
                  }`}
                />
                {reply.likes || 0}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
