import React from 'react';

interface HashtagProps {
  tag: string;
  onClick?: (tag: string) => void;
  className?: string;
}

const Hashtag: React.FC<HashtagProps> = ({ tag, onClick, className = '' }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(tag);
  };

  // Ensure tag starts with #
  const displayTag = tag.startsWith('#') ? tag : `#${tag}`;

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none transition-colors ${className}`}
      aria-label={`Ver posts con ${displayTag}`}
    >
      {displayTag}
    </button>
  );
};

export default Hashtag;
