import React from 'react';
import { Bot, ExternalLink, Globe, Send, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatHistoryEntry, ChatSource } from '../../shared/api';
import { askChat } from './lib/api';
import { Layout } from './components/Layout';
import { Headline, Card, Label } from './components/UI';
import { cn } from './lib/utils';

interface ChatMessage {
  id: number;
  role: 'bot' | 'user';
  content: string;
  sources?: ChatSource[];
}

const TalkToData = () => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 1,
      role: 'bot',
      content:
        "Welcome to Poverty Insights. Ask about the relative poverty trend, demographic breakdowns, regional disparities, or any poverty-related topic — I can also search the web if the data doesn't cover it.",
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const historyRef = React.useRef<ChatHistoryEntry[]>([]);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: question }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askChat({ question, history: historyRef.current });

      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: question },
        { role: 'model', content: response.answer },
      ];

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          content: response.answer,
          sources: response.sources.length > 0 ? response.sources : undefined,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          content: err instanceof Error ? err.message : 'Unable to process your question right now.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-10rem)] lg:h-[calc(100vh-12rem)] space-y-6">
        <section className="shrink-0">
          <Label className="mb-1 block">Data Q&A</Label>
          <Headline level={1} className="mb-2 text-2xl lg:text-4xl">
            Talk to the Data
          </Headline>
          <p className="text-xs lg:text-sm text-on-surface/60 max-w-2xl hidden sm:block">
            Ask questions about the poverty data — or broader poverty topics — powered by Gemini with Google Search grounding.
          </p>
        </section>

        <Card className="flex-1 flex flex-col overflow-hidden p-0 border border-outline-variant min-h-0">
          <div className="p-3 lg:p-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-xs lg:text-sm font-bold">Poverty Insights Assistant</h3>
                <p className="text-[9px] lg:text-[10px] text-green-600 font-bold uppercase tracking-wider">
                  Online • Gemini 2.0 Flash
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 bg-surface-container-lowest">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 lg:gap-4 max-w-[90%] lg:max-w-3xl',
                  message.role === 'user' ? 'ml-auto flex-row-reverse' : '',
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center shrink-0',
                    message.role === 'bot'
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-highest text-on-surface',
                  )}
                >
                  {message.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div
                  className={cn(
                    'p-3 lg:p-4 rounded-2xl text-xs lg:text-sm leading-relaxed',
                    message.role === 'bot'
                      ? 'bg-surface-container-low text-on-surface'
                      : 'bg-primary text-white',
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      h1: ({ children }) => <h1 className="font-bold text-base mb-1">{children}</h1>,
                      h2: ({ children }) => <h2 className="font-bold text-sm mb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="font-semibold mb-1">{children}</h3>,
                      code: ({ children }) => <code className="bg-black/10 rounded px-1 font-mono text-[11px]">{children}</code>,
                      blockquote: ({ children }) => <blockquote className="border-l-2 border-outline-variant pl-3 italic opacity-70">{children}</blockquote>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 border-t border-outline-variant pt-3 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface/50 uppercase tracking-wider mb-1">
                        <Globe size={10} /> Web Sources
                      </div>
                      {message.sources.map((source) =>
                        source.uri ? (
                          <a
                            key={source.uri}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-primary hover:underline truncate"
                          >
                            <ExternalLink size={10} className="shrink-0" />
                            <span className="truncate">{source.title}</span>
                          </a>
                        ) : (
                          <span key={source.title} className="block text-[11px] text-on-surface/60">
                            {source.title}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 max-w-3xl">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="p-3 lg:p-4 rounded-2xl bg-surface-container-low text-xs text-on-surface/50 flex items-center gap-2">
                  <span className="animate-pulse">Thinking</span>
                  <span className="flex gap-0.5">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 lg:p-4 border-t border-outline-variant bg-surface-container-low shrink-0">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSend();
                }}
                placeholder="Ask about poverty trends, demographics, regions..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 lg:py-3 pl-4 pr-12 text-xs lg:text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isLoading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 lg:p-2 bg-primary text-white rounded-lg hover:bg-primary-container transition-colors disabled:opacity-60"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2 px-1">
              <div className="flex items-center gap-1 text-[9px] font-bold text-on-surface/40 uppercase">
                <Sparkles size={10} /> Gemini 2.0 Flash
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold text-on-surface/40 uppercase">
                <Globe size={10} /> Search Grounding
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default TalkToData;
