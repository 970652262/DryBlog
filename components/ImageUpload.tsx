"use client";
import { useState, useRef } from 'react';
import { supabaseClient as supabase } from '../lib/supabase';
import { Upload, Image as ImageIcon, X, Loader } from 'lucide-react';

interface ImageUploadProps {
  onImageUploaded: (url: string, fileName: string) => void;
}

export default function ImageUpload({ onImageUploaded }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 支持的图片格式
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  // 验证文件
  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '不支持的文件格式。请上传 JPG、PNG、GIF 或 WebP 格式的图片。';
    }
    if (file.size > MAX_SIZE) {
      return '文件太大。请上传小于 5MB 的图片。';
    }
    return null;
  }

  // 上传图片到 Supabase Storage
  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);

    try {
      // 生成文件路径：年份/月份/时间戳-文件名
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}-${cleanFileName}`;
      const filePath = `${year}/${month}/${fileName}`;

      // 上传到 Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      // 通知父组件
      onImageUploaded(imageUrl, file.name);

      setUploading(false);
    } catch (err: any) {
      console.error('上传失败:', err);
      setError(err.message || '上传失败，请重试');
      setUploading(false);
    }
  }

  // 处理文件选择
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    await uploadImage(file);

    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // 处理拖拽
  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  // 处理拖放
  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    await uploadImage(file);
  }

  return (
    <div className="space-y-3">
      {/* 上传区域 */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragActive
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-brand-400'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center space-y-2">
          {uploading ? (
            <>
              <Loader className="w-8 h-8 text-brand-500 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">上传中...</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Upload className="w-6 h-6 text-gray-400" />
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-brand-500">点击上传</span> 或拖拽图片到这里
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                支持 JPG、PNG、GIF、WebP，最大 5MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 使用提示 */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>💡 <strong>提示</strong>：</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>上传后会自动插入 Markdown 图片语法</li>
          <li>可以直接粘贴图片（Ctrl+V）到编辑器</li>
          <li>支持拖拽多张图片批量上传</li>
        </ul>
      </div>
    </div>
  );
}
