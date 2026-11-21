import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ArrowUp, MessageCircle, RotateCcw, X } from 'lucide-react';
import { ApiError, buildApiUrl, streamSse } from '../api/client';
import { HecticLogoMark } from './Navbar';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  session_id: string;
  visitor_token: string;
}

/** Frames emitted by the streaming assistant endpoint (SSE). */
type ChatStreamEvent =
  | {
      type: 'meta';
      session_id: string;
      visitor_token: string;
      sources?: unknown[];
    }
  | { type: 'delta'; text: string }
  | { type: 'done'; timing?: Record<string, number> }
  | { type: 'error'; error: string; code?: string; retryable?: boolean };

interface LauncherDrag {
  startX: number;
  startY: number;
  left: number;
  top: number;
  width: number;
  height: number;
  moved: boolean;
}

const SUGGESTIONS = [
  'What does Hectic Lab do?',
  'What services do you offer?',
  'Show me some projects',
];

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageId = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const launcherDragRef = useRef<LauncherDrag | null>(null);
  const suppressToggleClickRef = useRef(false);
  const [launcherPosition, setLauncherPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isOpen]);

  useEffect(() => {
    const keepLauncherInView = () => {
      const button = toggleRef.current;
      if (!button) return;

      const maxX = Math.max(12, window.innerWidth - button.offsetWidth - 12);
      const maxY = Math.max(12, window.innerHeight - button.offsetHeight - 12);
      setLauncherPosition((current) =>
        current
          ? {
              x: Math.min(maxX, Math.max(12, current.x)),
              y: Math.min(maxY, Math.max(12, current.y)),
            }
          : current
      );
    };

    window.addEventListener('resize', keepLauncherInView);
    return () => window.removeEventListener('resize', keepLauncherInView);
  }, []);

  const handleLauncherPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>
  ) => {
    if (event.button !== 0) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    launcherDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleLauncherPointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>
  ) => {
    const drag = launcherDragRef.current;
    if (!drag) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;

    drag.moved = true;
    const maxX = Math.max(12, window.innerWidth - drag.width - 12);
    const maxY = Math.max(12, window.innerHeight - drag.height - 12);
    setLauncherPosition({
      x: Math.min(maxX, Math.max(12, drag.left + deltaX)),
      y: Math.min(maxY, Math.max(12, drag.top + deltaY)),
    });
  };

  const finishLauncherDrag = () => {
    if (launcherDragRef.current?.moved) {
      suppressToggleClickRef.current = true;
    }
    launcherDragRef.current = null;
  };

  const cancelLauncherDrag = () => {
    launcherDragRef.current = null;
    suppressToggleClickRef.current = false;
  };

  const toggleChat = () => {
    if (suppressToggleClickRef.current) {
      suppressToggleClickRef.current = false;
      return;
    }
    setIsOpen((open) => !open);
  };

  const panelOpensUp =
    launcherPosition === null || launcherPosition.y > window.innerHeight / 2;
  const panelAlignsLeft =
    launcherPosition !== null && launcherPosition.x < window.innerWidth / 2;

  const closeChat = () => {
    setIsOpen(false);
    toggleRef.current?.focus();
  };

  const startNewChat = () => {
    if (isSending) return;
    setMessages([]);
    setSession(null);
    setError(null);
    inputRef.current?.focus();
  };

  const sendMessage = async (value: string) => {
    const text = value.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: ++messageId.current,
      role: 'user',
      content: text,
    };
    // The assistant bubble is added up front and filled in once the reply
    // arrives, so the typing indicator has a bubble to attach to while the
    // request is in flight.
    const assistantId = ++messageId.current;
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setDraft('');
    setError(null);
    setIsSending(true);

    // The reply arrives token-by-token, so the assistant bubble is filled as
    // each delta is streamed instead of being replaced once at the end.
    let answer = '';
    let failed = false;

    const appendAssistant = (chunk: string) => {
      answer += chunk;
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId ? { ...message, content: answer } : message
        )
      );
    };

    const failAssistant = (message: string) => {
      failed = true;
      setError(message);
      // Keep any text already streamed; only fall back to the error message
      // when nothing arrived.
      if (!answer.trim()) {
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantId ? { ...item, content: message } : item
          )
        );
      }
    };

    try {
      await streamSse<ChatStreamEvent>(
        buildApiUrl('/assistant/chat/stream/'),
        { message: text, ...(session ?? {}) },
        (event) => {
          if (event.type === 'meta') {
            if (event.session_id && event.visitor_token) {
              setSession({
                session_id: event.session_id,
                visitor_token: event.visitor_token,
              });
            }
          } else if (event.type === 'delta') {
            appendAssistant(event.text);
          } else if (event.type === 'error') {
            failAssistant(
              event.error || 'The assistant couldn’t reply just now. Please try again.'
            );
          }
        }
      );

      if (!failed && !answer.trim()) {
        failAssistant('The assistant returned an empty response. Please try again.');
      }
    } catch (requestError) {
      const message =
        requestError instanceof ApiError && requestError.status === 429
          ? 'You’ve sent several messages quickly. Please wait a moment and try again.'
          : requestError instanceof Error
            ? requestError.message
            : 'The assistant couldn’t reply just now. Please try again.';
      failAssistant(message);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  // The assistant bubble is created empty and filled when the reply arrives,
  // so the typing indicator stands in for it until then.
  const lastMessage = messages[messages.length - 1];
  const showThinking =
    isSending && lastMessage?.role === 'assistant' && !lastMessage.content;

  return (
    <div
      className="fixed bottom-5 right-4 z-[60] sm:right-6"
      style={
        launcherPosition
          ? {
              left: launcherPosition.x,
              top: launcherPosition.y,
              right: 'auto',
              bottom: 'auto',
            }
          : undefined
      }
    >
      {isOpen && (
        <section
          role="dialog"
          aria-label="Hectic Lab AI chat"
          aria-modal="false"
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeChat();
          }}
          className={`chat-panel-in absolute flex h-[min(620px,calc(100dvh-112px))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[24px] border border-[#111110]/10 bg-[#F3F0E9] text-[#111110] shadow-[0_24px_80px_rgba(17,17,16,0.22)] sm:w-[400px] ${
            panelOpensUp ? 'bottom-full mb-4' : 'top-full mt-4'
          } ${panelAlignsLeft ? 'left-0' : 'right-0'}`}
        >
          <header className="relative flex items-center justify-between border-b border-[#111110]/10 bg-white/70 px-5 py-4 backdrop-blur">
            <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#14bfb9] via-[#2cf5ef] to-transparent" />
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111110] text-[#2cf5ef]">
                <HecticLogoMark className="h-4 w-4" invert />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight">Hectic Lab</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#73726d]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14bfb9] opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#14bfb9]" />
                  </span>
                  AI studio guide
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={startNewChat}
                  disabled={isSending}
                  aria-label="Start a new chat"
                  title="New chat"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#73726d] transition hover:bg-[#111110]/5 hover:text-[#111110] disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={closeChat}
                aria-label="Close chat"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#73726d] transition hover:bg-[#111110]/5 hover:text-[#111110]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div
            className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {messages.length === 0 ? (
              <div className="flex min-h-[320px] flex-col justify-center">
                <p className="text-xl font-medium leading-tight tracking-tight">
                  A little curious?
                </p>
                <p className="mt-2 max-w-[290px] text-sm leading-6 text-[#73726d]">
                  Ask about our studio, services, or the work we make.
                </p>
                <div className="mt-6 flex flex-col items-stretch gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void sendMessage(suggestion)}
                      disabled={isSending}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-[#111110]/10 bg-white/70 px-4 py-3 text-left text-xs font-medium text-[#111110]/85 transition hover:-translate-y-0.5 hover:border-[#14bfb9] hover:bg-white hover:text-[#111110] hover:shadow-[0_8px_20px_rgba(17,17,16,0.07)] disabled:opacity-50"
                    >
                      {suggestion}
                      <ArrowUp
                        className="h-3.5 w-3.5 rotate-45 text-[#73726d] transition group-hover:text-[#14bfb9]"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => {
                if (message.role === 'assistant' && !message.content) {
                  return null;
                }
                return (
                <div
                  key={message.id}
                  className={`chat-pop-in flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <p
                    className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-[#111110] text-[#F3F0E9] shadow-[0_8px_20px_rgba(17,17,16,0.16)]'
                        : `rounded-bl-md border bg-white text-[#111110] shadow-[0_2px_10px_rgba(17,17,16,0.05)] ${
                            error && message === messages[messages.length - 1]
                              ? 'border-amber-700/25'
                              : 'border-[#111110]/[0.06]'
                          }`
                    }`}
                  >
                    {message.content}
                  </p>
                </div>
                );
              })
            )}

            {showThinking && (
              <div className="chat-pop-in flex justify-start">
                <div
                  className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#111110]/[0.06] bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(17,17,16,0.05)]"
                  aria-label="Assistant is thinking"
                  role="status"
                >
                  <span className="chat-dot h-1.5 w-1.5 rounded-full bg-[#14bfb9]" />
                  <span
                    className="chat-dot h-1.5 w-1.5 rounded-full bg-[#14bfb9]"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <span
                    className="chat-dot h-1.5 w-1.5 rounded-full bg-[#14bfb9]"
                    style={{ animationDelay: '0.3s' }}
                  />
                </div>
              </div>
            )}
            {error && <span className="sr-only" role="status">{error}</span>}
            <div ref={endOfMessagesRef} />
          </div>

          <div className="border-t border-[#111110]/10 bg-white/40 px-4 pb-4 pt-3 sm:px-5">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 rounded-full border border-[#111110]/10 bg-white p-1.5 pl-4 shadow-[0_2px_10px_rgba(17,17,16,0.04)] transition focus-within:border-[#14bfb9] focus-within:ring-2 focus-within:ring-[#14bfb9]/15"
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={2000}
                placeholder="Ask us anything…"
                aria-label="Your message"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#111110] outline-none placeholder:text-[#73726d]/70"
              />
              <button
                type="submit"
                disabled={isSending || !draft.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111110] text-[#2cf5ef] transition hover:bg-[#14bfb9] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] text-[#73726d]/75">
              AI can make mistakes. Please don’t share sensitive information.
            </p>
          </div>
        </section>
      )}

      <button
        ref={toggleRef}
        type="button"
        onClick={toggleChat}
        onPointerDown={handleLauncherPointerDown}
        onPointerMove={handleLauncherPointerMove}
        onPointerUp={finishLauncherDrag}
        onPointerCancel={cancelLauncherDrag}
        aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
        aria-expanded={isOpen}
        title="Drag to move or click to chat"
        className="relative ml-auto flex h-10 w-10 touch-none select-none items-center justify-center rounded-full bg-[#111110] text-[#F3F0E9] shadow-[0_8px_24px_rgba(17,17,16,0.2)] transition hover:bg-[#2cf5ef] hover:text-[#111110] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#14bfb9] active:cursor-grabbing"
      >
        {!isOpen && messages.length === 0 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-3 w-3"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2cf5ef] opacity-70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#2cf5ef]" />
          </span>
        )}
        {isOpen ? (
          <X className="h-4 w-4" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
