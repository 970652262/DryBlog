"use client"

import React from "react"
import Link from "next/link"
import { FaGithub, FaTwitter, FaLinkedin, FaYoutube } from "react-icons/fa"

export default function Footer() {
  return (
    <footer className="bg-(--bg) text-(--text) border-t border-gray-200 dark:border-gray-800 py-10 mt-16 transition-all duration-300">
      <div className="container mx-auto px-6">
        {/* 顶部部分：Logo + 社交图标 */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
          {/* 左侧 Logo 与描述 */}
          <div className="text-center md:text-left">
            <Link
              href="/"
              className="text-3xl font-semibold text-primary hover:opacity-80 transition-opacity"
            >
              DryBlog
            </Link>
            {/* <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
              
            </p> */}
          </div>

          {/* 右侧 社交媒体 */}
          <div className="flex space-x-6 text-xl text-gray-500 dark:text-gray-400">
            <SocialLink href="https://github.com" icon={<FaGithub />} />
            <SocialLink href="https://twitter.com" icon={<FaTwitter />} />
            <SocialLink href="https://linkedin.com" icon={<FaLinkedin />} />
            <SocialLink href="https://youtube.com" icon={<FaYoutube />} />
          </div>
        </div>

        {/* 分割线 */}
        <div className="border-t border-gray-200 dark:border-gray-800 my-8" />

        {/* 底部版权部分 */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-0 text-sm text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} DryBlog · Copyright</p>
          {/* <div className="flex space-x-6">
            <FooterLink href="#">隐私政策</FooterLink>
            <FooterLink href="#">使用条款</FooterLink>
            <FooterLink href="#">联系我们</FooterLink>
          </div> */}
        </div>
      </div>
    </footer>
  )
}

/* 小组件封装：社交图标按钮 */
function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="hover:text-primary transition-all duration-300 transform hover:scale-110"
    >
      {icon}
    </Link>
  )
}

/* 小组件封装：底部链接 */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="hover:text-primary transition-colors duration-300"
    >
      {children}
    </Link>
  )
}
