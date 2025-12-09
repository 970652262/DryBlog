"use client";
import { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, Loader } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function LazyImage({ src, alt, className = '' }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer - 懒加载
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px' // 提前50px开始加载
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  // 关闭灯箱（ESC键）
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowLightbox(false);
      }
    }

    if (showLightbox) {
      document.addEventListener('keydown', handleKeyDown);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showLightbox]);

  return (
    <>
      {/* 图片容器 */}
      <div
        ref={imgRef}
        className={`relative inline-block w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ minHeight: '200px' }}
      >
        {/* 占位符/加载中 */}
        {!isLoaded && isInView && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <X className="w-12 h-12 mb-2" />
            <p className="text-sm">图片加载失败</p>
          </div>
        )}

        {/* 实际图片 */}
        {isInView && !error && (
          <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setError(true);
              setIsLoaded(true);
            }}
            className={`w-full h-auto cursor-pointer transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setShowLightbox(true)}
            loading="lazy"
          />
        )}

        {/* 放大图标提示 */}
        {isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
            <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
              <ZoomIn className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
          </div>
        )}
      </div>

      {/* 灯箱模态框 */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* 图片信息 */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-sm text-white/80">{alt}</p>
            <p className="text-xs text-white/60 mt-1">点击任意位置或按 ESC 关闭</p>
          </div>

          {/* 大图 */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
