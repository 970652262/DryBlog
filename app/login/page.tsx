"use client";
import { useState, FormEvent } from "react";
import { supabaseClient as supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    let error;
    if (isSignup) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = signInError;
    }
    setLoading(false);
    if (error) {
      setMsg(error.message);
    } else {
      setMsg(isSignup ? "注册成功，请检查邮箱确认（如果需要）" : "登录成功");
      router.push("/");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 ">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          {isSignup ? "注册" : "登录"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入邮箱地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入密码"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-2 text-white font-medium bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "处理中..." : isSignup ? "注册" : "登录"}
          </button>
        </form>

        {msg && (
          <p
            className={`text-center text-sm font-medium ${msg.includes("成功") ? "text-green-600" : "text-red-500"
              }`}
          >
            {msg}
          </p>
        )}

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={() => setIsSignup((s) => !s)}
            className="hover:underline font-medium"
          >
            {isSignup ? "已有账号？去登录" : "没有账号？去注册"}
          </button>
        </p>

        <p className="text-center">
          <a
            href="/"
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm underline"
          >
            返回首页
          </a>
        </p>
      </div>
    </main>
  );
}
