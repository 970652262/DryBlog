"use client";
import Link from 'next/link';
import { Tag } from '@/types/tag';

interface TagDisplayProps {
  tags: Tag[];
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
}

export default function TagDisplay({ tags, size = 'sm', clickable = true }: TagDisplayProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => {
        const classes = `inline-flex items-center rounded-full font-medium text-white ${sizeClasses[size]} transition-transform hover:scale-105`;
        const style = { backgroundColor: tag.color || '#3b82f6' };

        if (clickable) {
          return (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className={classes}
              style={style}
            >
              #{tag.name}
            </Link>
          );
        }

        return (
          <span
            key={tag.id}
            className={classes}
            style={style}
          >
            #{tag.name}
          </span>
        );
      })}
    </div>
  );
}
