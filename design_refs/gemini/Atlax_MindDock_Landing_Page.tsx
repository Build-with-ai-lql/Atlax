"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isEntering, setIsEntering] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 初始化主题检测，确保与操作系统的深色模式匹配
  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 触发“平行世界”穿越动画
  const handleEnterWorkspace = () => {
    setIsEntering(true);
    // 等待 800ms 动画播放完毕后，路由推入 Workspace
    // 这里的时间与 design_system.md 中的 duration-[800ms] 对齐
    setTimeout(() => {
      router.push('/workspace');
    }, 800);
  };

  if (!mounted) return null;

  return (
    <div className={isDark ? 'dark' : ''}>
      {/* 根容器：遵循 Design System 的底层色彩体系 */}
      <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#F5F5F7] dark:bg-[#0E0E11] text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-1000">
        
        {/* =========================================
            背景层：光的隐喻 (Light Metaphors)
            使用极其柔和的动态模糊色块，暗示“思维的流动”
           ========================================= */}
        <div 
          className={`absolute inset-0 pointer-events-none transition-opacity duration-[1000ms] ${isEntering ? 'opacity-0' : 'opacity-100'}`}
        >
          {/* 左上角蓝紫色光晕 */}
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-[100px] animate-[spin_20s_linear_infinite] opacity-50 mix-blend-multiply dark:mix-blend-screen" />
          {/* 右下角靛紫色光晕 */}
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-300/20 dark:bg-purple-600/20 rounded-full blur-[120px] animate-[spin_25s_linear_infinite_reverse] opacity-50 mix-blend-multiply dark:mix-blend-screen" />
        </div>

        {/* =========================================
            交互层：中心视觉组
            在进入状态时，整体产生剧烈的空间 Z 轴位移
           ========================================= */}
        <div 
          className={`relative z-10 flex flex-col items-center transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isEntering ? 'scale-[5] opacity-0 translate-y-[-100px] blur-xl' : 'scale-100 opacity-100 translate-y-0 blur-none'
          }`}
        >
          {/* 1. 拟物化 Logo (Skeuomorphism) - 放大版 */}
          <div className="relative w-28 h-28 flex flex-shrink-0 items-center justify-center group mb-8 shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5 rounded-[2.5rem]">
            {/* 底座毛玻璃 */}
            <div className="absolute inset-0 bg-white/80 dark:bg-black/50 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-white/10" />
            {/* 内部流光 */}
            <div className="absolute inset-[8px] rounded-[2rem] bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-400 opacity-90 blur-[2px] group-hover:blur-[4px] group-hover:scale-105 transition-all duration-700 ease-out" />
            {/* 玻璃高光 */}
            <div className="absolute inset-[8px] rounded-[2rem] bg-gradient-to-b from-white/80 dark:from-white/30 via-white/20 dark:via-transparent to-transparent border border-white/50 dark:border-white/20 z-10 pointer-events-none" />
            {/* 中心核心 */}
            <div className="w-6 h-6 bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.4)] z-20 group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.15)]" />
          </div>

          {/* 2. 品牌排版 (Typography) - 遵循字距与粗细对比规范 */}
          <div className="flex flex-col items-center mb-6">
            <span className="text-sm font-bold tracking-[0.4em] text-slate-400 uppercase leading-none mb-4 ml-2">
              Atlax
            </span>
            <h1 className="text-6xl tracking-[-0.04em] text-slate-800 dark:text-slate-100 leading-none flex items-center">
              <span className="font-extrabold text-slate-900 dark:text-white">Mind</span>
              <span className="font-light text-slate-500 dark:text-slate-400">Dock</span>
            </h1>
          </div>

          {/* 3. 情绪价值 Slogan */}
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-12 font-medium tracking-wide flex items-center gap-2">
            <Sparkles size={18} className="text-blue-500" />
            你的智能思考与知识整理伙伴
          </p>

          {/* 4. 召唤按钮 (Call to Action) */}
          <button 
            onClick={handleEnterWorkspace}
            className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-semibold text-lg overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.15)] hover:scale-105 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_20px_40px_rgba(255,255,255,0.25)] transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.15)]"
          >
            {/* 按钮内的流光反馈 */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative z-10 flex items-center gap-2">
              进入工作区
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          {/* 辅助信息 */}
          <div className="mt-8 text-sm text-slate-400 dark:text-slate-500 flex items-center gap-4">
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">Phase 2 Preview</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">架构与设计系统演示</span>
          </div>
        </div>

        {/* =========================================
            世界转场遮罩 (World Transition Mask)
            点击进入后，这个遮罩会从中心爆发，纯净地覆盖当前屏幕，
            由于它的颜色与 Workspace 的背景色完全一致，
            所以路由跳转时不会有任何闪烁，如同推开了一扇门。
           ========================================= */}
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isEntering ? 'w-[300vw] h-[300vw] bg-[#F5F5F7] dark:bg-[#0E0E11] z-50 opacity-100' : 'w-0 h-0 bg-transparent z-0 opacity-0'
          }`}
        />

      </div>

      {/* 补充：流光动画的自定义 keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}