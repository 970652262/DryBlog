"use client";
import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';
import { Moon, Sun, Search } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const icon = theme === 'dark' ? (
    <Sun className="h-5 w-5 text-yellow-500" />
  ) : (
    <Moon className="h-5 w-5 text-gray-800" />
  );
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    // 获取按钮中心坐标
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // 计算需要覆盖的最大半径
    const distances = [
      Math.hypot(cx, cy),
      Math.hypot(vw - cx, cy),
      Math.hypot(cx, vh - cy),
      Math.hypot(vw - cx, vh - cy)
    ];
    const radius = Math.max(...distances);
    const targetDark = theme !== 'dark'; // 将要切换到的主题是否是 dark
  // 半透明遮罩色：只调整透明度，保持主题色调
  const color = targetDark ? 'rgba(13,15,19,0.75)' : 'rgba(255,247,230,0.75)';

    const circle = document.createElement('span');
    circle.className = 'theme-reveal-circle';
    circle.style.position = 'fixed';
    circle.style.zIndex = '9999';
    circle.style.left = cx - radius + 'px';
    circle.style.top = cy - radius + 'px';
    circle.style.width = circle.style.height = radius * 2 + 'px';
    circle.style.borderRadius = '50%';
    circle.style.background = color;
    circle.style.pointerEvents = 'none';
    circle.style.transform = 'scale(0)';
    circle.style.transition = 'transform 520ms ease-out';
    document.body.appendChild(circle);
    // 先触发动画，再在中途切换主题，减少闪烁
    requestAnimationFrame(() => {
      circle.style.transform = 'scale(1)';
    });
    // 在动画进行到一半时切换主题
    setTimeout(() => {
      toggle();
    }, 260);
    // 动画结束移除节点
    circle.addEventListener('transitionend', () => {
      circle.remove();
    });
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={handleClick}
      className="group rounded-full border border-transparent bg-white/70 backdrop-blur text-gray-700 shadow hover:bg-white/90 dark:text-gray-200 dark:bg-gray-800/70 dark:hover:bg-gray-800/90 transition p-2 overflow-hidden"
    >
      {mounted ? icon : <div className="h-5 w-5" />}
    </button>
  );
}
