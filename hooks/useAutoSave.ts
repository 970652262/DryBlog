"use client";
import { useEffect, useRef, useState } from 'react';

interface UseAutoSaveOptions {
  delay?: number; // 延迟保存时间（毫秒）
  onSave: () => Promise<void>; // 保存函数
  enabled?: boolean; // 是否启用自动保存
}

export function useAutoSave({ delay = 3000, onSave, enabled = true }: UseAutoSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const valueRef = useRef<any>();

  const triggerSave = async () => {
    if (!enabled) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave();
      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSave = (value: any) => {
    if (!enabled) return;

    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 设置新的定时器
    timerRef.current = setTimeout(() => {
      triggerSave();
    }, delay);
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    error,
    triggerSave,
    debouncedSave
  };
}
