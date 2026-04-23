'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight } from 'lucide-react'

import { getCurrentUser, type LocalUser } from '@/lib/auth'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<LocalUser | null>(null)
  const [checked, setChecked] = useState(false)
  const [isEntering, setIsEntering] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setUser(getCurrentUser())
    setChecked(true)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const handleEnterWorkspace = () => {
    setIsEntering(true)
    setTimeout(() => {
      router.push('/workspace')
    }, 800)
  }

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F5F7] dark:bg-[#0E0E11]">
        <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#F5F5F7] dark:bg-[#0E0E11] text-slate-800 dark:text-slate-200 font-sans overflow-hidden selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-1000">

        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-[1000ms] ${isEntering ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-[100px] animate-[spin_20s_linear_infinite] opacity-50 mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-300/20 dark:bg-purple-600/20 rounded-full blur-[120px] animate-[spin_25s_linear_infinite_reverse] opacity-50 mix-blend-multiply dark:mix-blend-screen" />
        </div>

        <div
          className={`relative z-10 flex flex-col items-center transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isEntering ? 'scale-[5] opacity-0 translate-y-[-100px] blur-xl' : 'scale-100 opacity-100 translate-y-0 blur-none'
          }`}
        >
          <div className="relative w-28 h-28 flex flex-shrink-0 items-center justify-center group mb-8 shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5 rounded-[2.5rem]">
            <div className="absolute inset-0 bg-white/80 dark:bg-black/50 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-white/10" />
            <div className="absolute inset-[8px] rounded-[2rem] bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-400 opacity-90 blur-[2px] group-hover:blur-[4px] group-hover:scale-105 transition-all duration-700 ease-out" />
            <div className="absolute inset-[8px] rounded-[2rem] bg-gradient-to-b from-white/80 dark:from-white/30 via-white/20 dark:via-transparent to-transparent border border-white/50 dark:border-white/20 z-10 pointer-events-none" />
            <div className="w-6 h-6 bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.4)] z-20 group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.15)]" />
          </div>

          <div className="flex flex-col items-center mb-6">
            <span className="text-sm font-bold tracking-[0.4em] text-slate-400 uppercase leading-none mb-4 ml-2">
              Atlax
            </span>
            <h1 className="text-6xl tracking-[-0.04em] text-slate-800 dark:text-slate-100 leading-none flex items-center">
              <span className="font-extrabold text-slate-900 dark:text-white">Mind</span>
              <span className="font-light text-slate-500 dark:text-slate-400">Dock</span>
            </h1>
          </div>

          <p className="text-lg text-slate-500 dark:text-slate-400 mb-12 font-medium tracking-wide flex items-center gap-2">
            <Sparkles size={18} className="text-blue-500" />
            {user ? '欢迎回来，继续整理' : '你的智能思考与知识整理伙伴'}
          </p>

          <button
            onClick={handleEnterWorkspace}
            className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-semibold text-lg overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.15)] hover:scale-105 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_20px_40px_rgba(255,255,255,0.25)] transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.15)]"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative z-10 flex items-center gap-2">
              {user ? '继续整理' : '进入工作区'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <div className="mt-8 text-sm text-slate-400 dark:text-slate-500 flex items-center gap-4">
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">Phase 2 Preview</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">架构与设计系统演示</span>
          </div>
        </div>

        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isEntering ? 'w-[300vw] h-[300vw] bg-[#F5F5F7] dark:bg-[#0E0E11] z-50 opacity-100' : 'w-0 h-0 bg-transparent z-0 opacity-0'
          }`}
        />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  )
}
