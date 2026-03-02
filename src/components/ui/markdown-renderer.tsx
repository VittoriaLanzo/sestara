import React from "react";
import { MathRenderer } from "@/components/notes/MathRenderer";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className = "" }: MarkdownRendererProps) => {
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let key = 0;

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        const ListTag = listType === 'ul' ? 'ul' : 'ol';
        elements.push(
          <ListTag key={key++} className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} ml-5 space-y-1 my-3`}>
            {listItems.map((item, i) => (
              <li key={i} className="text-foreground/90">
                {parseInline(item)}
              </li>
            ))}
          </ListTag>
        );
        listItems = [];
        listType = null;
      }
    };

    /** Split text on LaTeX delimiters first, then apply markdown inline formatting to non-math parts */
    const parseMath = (text: string, baseKey: number): React.ReactNode[] => {
      const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
      const nodes: React.ReactNode[] = [];
      parts.forEach((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          nodes.push(<MathRenderer key={`m-${baseKey}-${i}`} latex={part.slice(2, -2).trim()} display className="my-2" />);
        } else if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          nodes.push(<MathRenderer key={`m-${baseKey}-${i}`} latex={part.slice(1, -1).trim()} />);
        } else if (part) {
          nodes.push(<React.Fragment key={`t-${baseKey}-${i}`}>{part}</React.Fragment>);
        }
      });
      return nodes;
    };

    const parseInline = (text: string): React.ReactNode => {
      // Handle bold **text** or __text__
      const parts: React.ReactNode[] = [];
      let remaining = text;
      let inlineKey = 0;

      while (remaining.length > 0) {
        // Bold: **text** or __text__
        const boldMatch = remaining.match(/^(.*?)(\*\*|__)(.+?)\2(.*)$/s);
        if (boldMatch) {
          if (boldMatch[1]) parts.push(parseItalic(boldMatch[1], inlineKey++));
          parts.push(<strong key={inlineKey++} className="font-semibold text-foreground">{parseItalic(boldMatch[3], inlineKey++)}</strong>);
          remaining = boldMatch[4];
          continue;
        }

        // No more patterns, add remaining and break
        parts.push(parseItalic(remaining, inlineKey++));
        break;
      }

      return parts.length === 1 ? parts[0] : parts;
    };

    const parseItalic = (text: string, baseKey: number): React.ReactNode => {
      const parts: React.ReactNode[] = [];
      let remaining = text;
      let key = 0;

      while (remaining.length > 0) {
        const italicMatch = remaining.match(/^(.*?)(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)(.*)$/s) ||
                           remaining.match(/^(.*?)(?<!_)_(?!_)(.+?)(?<!_)_(?!_)(.*)$/s);
        if (italicMatch) {
          if (italicMatch[1]) parts.push(...parseMath(italicMatch[1], baseKey * 100 + key++));
          parts.push(<em key={`${baseKey}-${key++}`} className="italic text-foreground/90">{parseMath(italicMatch[2], baseKey * 100 + key)}</em>);
          remaining = italicMatch[3];
          continue;
        }

        parts.push(...parseMath(remaining, baseKey * 100 + key++));
        break;
      }

      return parts.length === 1 ? parts[0] : parts;
    };

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Empty line
      if (!trimmedLine) {
        flushList();
        continue;
      }

      // Headings
      const h3Match = trimmedLine.match(/^###\s+(.+)$/);
      if (h3Match) {
        flushList();
        elements.push(
          <h3 key={key++} className="text-lg font-semibold text-foreground mt-4 mb-2">
            {parseInline(h3Match[1])}
          </h3>
        );
        continue;
      }

      const h2Match = trimmedLine.match(/^##\s+(.+)$/);
      if (h2Match) {
        flushList();
        elements.push(
          <h2 key={key++} className="text-xl font-semibold text-foreground mt-5 mb-2">
            {parseInline(h2Match[1])}
          </h2>
        );
        continue;
      }

      const h1Match = trimmedLine.match(/^#\s+(.+)$/);
      if (h1Match) {
        flushList();
        elements.push(
          <h1 key={key++} className="text-2xl font-bold text-foreground mt-6 mb-3">
            {parseInline(h1Match[1])}
          </h1>
        );
        continue;
      }

      // Unordered list items
      const ulMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
      if (ulMatch) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        listItems.push(ulMatch[1]);
        continue;
      }

      // Ordered list items
      const olMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
      if (olMatch) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        listItems.push(olMatch[1]);
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={key++} className="text-foreground/90 my-2 leading-relaxed">
          {parseInline(trimmedLine)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  return (
    <div className={`prose-custom ${className}`}>
      {parseMarkdown(content)}
    </div>
  );
};
