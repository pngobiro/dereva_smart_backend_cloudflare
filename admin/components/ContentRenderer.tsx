'use client';

interface ContentObject {
  format: 'text' | 'html' | 'latex';
  value: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    position: 'before' | 'after';
    alt?: string;
  };
}

interface ContentRendererProps {
  content: string | ContentObject;
  className?: string;
}

export default function ContentRenderer({ content, className = '' }: ContentRendererProps) {
  // Handle plain string
  if (typeof content === 'string') {
    return <div className={className}>{content}</div>;
  }

  // Handle ContentObject
  const { format, value, media } = content;

  const renderMedia = () => {
    if (!media) return null;

    if (media.type === 'image') {
      return (
        <div className="my-3">
          <img
            src={media.url}
            alt={media.alt || 'Content image'}
            className="max-w-full h-auto rounded-lg shadow-sm"
          />
        </div>
      );
    }

    if (media.type === 'video') {
      return (
        <div className="my-3">
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            <span>▶️</span>
            <span>Watch Video</span>
          </a>
        </div>
      );
    }

    return null;
  };

  const renderContent = () => {
    switch (format) {
      case 'html':
        return (
          <div
            className={`prose prose-sm max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        );

      case 'latex':
        return (
          <div className={`font-mono text-sm bg-gray-50 p-3 rounded ${className}`}>
            {value}
            <div className="text-xs text-gray-500 mt-2">LaTeX format (requires renderer)</div>
          </div>
        );

      case 'text':
      default:
        return <div className={className}>{value}</div>;
    }
  };

  return (
    <div>
      {media?.position === 'before' && renderMedia()}
      {renderContent()}
      {media?.position === 'after' && renderMedia()}
    </div>
  );
}
