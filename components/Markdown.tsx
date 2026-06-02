'use client';

import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { CopyButton } from './CopyButton';

// Recursively flattens React children to a plain string so code blocks can be
// copied even after rehype-highlight has wrapped tokens in <span> elements.
function nodeToText(node: ReactNode): string {
  if (node == null || node === false || node === true) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join('');
  if (typeof node === 'object' && 'props' in node) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return nodeToText((node as any).props?.children);
  }
  return '';
}

function detectLang(children: ReactNode): string {
  const el = Array.isArray(children) ? children[0] : children;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cls: string = (el as any)?.props?.className ?? '';
  const m = /language-([\w-]+)/.exec(cls);
  return m ? m[1] : '';
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pre({ children }: any) {
            const lang = detectLang(children);
            const raw = nodeToText(children);
            return (
              <div className="codeblock">
                <div className="codeblock__bar">
                  <span className="codeblock__lang">{lang || 'code'}</span>
                  <CopyButton text={raw} />
                </div>
                <pre>{children}</pre>
              </div>
            );
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          a({ children, href }: any) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
