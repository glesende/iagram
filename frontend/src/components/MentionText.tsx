import React from 'react';

interface MentionTextProps {
  text: string;
  onProfileClick?: (username: string) => void;
  className?: string;
}

/**
 * Component that parses text and renders mentions as clickable links
 * Mentions are in the format @username
 */
const MentionText: React.FC<MentionTextProps> = ({ text, onProfileClick, className = '' }) => {
  // Regular expression to match @username pattern
  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;

  // Parse text and create elements
  const parseText = () => {
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // Find all mentions in the text
    while ((match = mentionRegex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = mentionRegex.lastIndex;
      const username = match[1];

      // Add text before the mention
      if (matchStart > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, matchStart)}
          </span>
        );
      }

      // Add the mention as a clickable element
      elements.push(
        <button
          key={`mention-${matchStart}`}
          onClick={() => onProfileClick?.(username)}
          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:underline"
        >
          @{username}
        </button>
      );

      lastIndex = matchEnd;
    }

    // Add remaining text after the last mention
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    // If no mentions found, return the original text
    return elements.length > 0 ? elements : text;
  };

  return (
    <span className={className}>
      {parseText()}
    </span>
  );
};

export default MentionText;
