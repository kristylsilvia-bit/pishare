'use client';

import { User, Sparkles } from 'lucide-react';
import { Markdown } from './Markdown';
import { CopyButton } from './CopyButton';
import type { Message } from '@/lib/types';

export function ChatMessage({
  message,
  streaming = false,
}: {
  message: Message;
  streaming?: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`msg msg--${message.role} animate-fade-in`}>
      <div className="msg__avatar">
        {isUser ? <User size={15} /> : <Sparkles size={15} />}
      </div>
      <div className="msg__body">
        <div className="msg__head">
          <span className="msg__role">{isUser ? 'You' : 'Hermes'}</span>
          {!streaming && message.content && (
            <CopyButton text={message.content} className="msg__copy" />
          )}
        </div>
        <div className="msg__content">
          {isUser ? (
            <p className="msg__text">{message.content}</p>
          ) : (
            <Markdown content={message.content} />
          )}
          {streaming && <span className="cursor" aria-hidden />}
        </div>
      </div>
    </div>
  );
}
