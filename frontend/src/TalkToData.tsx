import React from 'react';
import { Bot, Database, Send, Sparkles, User } from 'lucide-react';
import type { ChatSource } from '../../shared/api';
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
      content: 'Welcome to Poverty Insights. Ask about the relative poverty trend, changes between survey years, or the report sources behind the dashboard.',
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    const question = input.trim();
    const userMessage: ChatMessage = { id: Date.now(), role: 'user', content: question };
    setMessages((previousMessages) => [...previousMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askChat({ question, datasetId: 'relative-poverty-series' });
      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'bot',
        content: response.answer,
        sources: response.sources,
      };
      setMessages((previousMessages) => [...previousMessages, botMessage]);
    } catch (requestError) {
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'bot',
        content: requestError instanceof Error ? requestError.message : 'Unable to process your question right now.',
      };
      setMessages((previousMessages) => [...previousMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-10rem)] lg:h-[calc(100vh-12rem)] space-y-6">
        <section className="shrink-0">
          <Label className="mb-1 block">Data Q&A</Label>
          <Headline level={1} className="mb-2 text-2xl lg:text-4xl">Talk to the Data</Headline>
          <p className="text-xs lg:text-sm text-on-surface/60 max-w-2xl hidden sm:block">
            Ask focused questions about the relative poverty series and related report evidence through the new API layer.
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
                <p className="text-[9px] lg:text-[10px] text-green-600 font-bold uppercase tracking-wider">Online • API-backed</p>
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
                    message.role === 'bot' ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface',
                  )}
                >
                  {message.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div
                  className={cn(
                    'p-3 lg:p-4 rounded-2xl text-xs lg:text-sm leading-relaxed',
                    message.role === 'bot' ? 'bg-surface-container-low text-on-surface' : 'bg-primary text-white',
                  )}
                >
                  <p>{message.content}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 border-t border-outline-variant pt-3 text-[11px] text-on-surface/60">
                      Sources: {message.sources.map((source) => source.title).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-xs text-on-surface/50">Thinking through the poverty trend data...</div>
            )}
          </div>

          <div className="p-3 lg:p-4 border-t border-outline-variant bg-surface-container-low shrink-0">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSend();
                  }
                }}
                placeholder="Ask about relative poverty trends..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 lg:py-3 pl-4 pr-12 text-xs lg:text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 lg:p-2 bg-primary text-white rounded-lg hover:bg-primary-container transition-colors disabled:opacity-60"
                disabled={isLoading}
              >
                <Send size={16} />
              </button>
            </div>
            <div className="flex items-center gap-4 mt-2 px-1">
              <div className="flex items-center gap-1 text-[9px] font-bold text-on-surface/40 uppercase">
                <Database size={10} /> Relative Poverty Series
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default TalkToData;
