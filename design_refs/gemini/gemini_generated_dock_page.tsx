"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Inbox, Archive, Hash, Settings, Search, Plus, Send, Paperclip, 
  Image as ImageIcon, CheckSquare, List, Maximize2, Minimize2, 
  Mic, MessageSquare, PenTool, MoreHorizontal, ChevronRight, Clock, 
  Sparkles, Loader2, Sun, Moon 
} from 'lucide-react';

// ============================================================================
// 🔌 后端集成区 (Backend Integration)
// 根据你的 TECH_SPEC.md，这里引入你本地 IndexedDB 的 repository 接口
// ============================================================================
// 注意：如果你的实际导出路径不同，请调整这里的 import
import { repository } from '@/lib/repository'; 

// --- Gemini API 集成 (用于 AI 魔法功能) ---
const apiKey = ""; // 执行环境会自动注入
const callGemini = async (prompt: string) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (e) {
    console.error("Gemini API Error:", e);
    return "✨ AI 请求暂时失败，请稍后再试。";
  }
};

// 兜底的展示数据（当你的本地 DB 是空的时候展示，保持界面美观）
const FALLBACK_DOCK_ITEMS = [
  { id: 'mock-1', text: "今天下午3点和产品团队开会讨论 Phase 3 规划，需要准备一下现有的用户反馈数据。", time: "10:24 AM", tags: ["工作", "会议"], type: "chat" },
  { id: 'mock-2', text: "推荐阅读：AI 原生应用交互设计指南。重点关注里面关于 Copilot 向 Agent 演进的部分。", time: "Yesterday", tags: ["阅读", "AI"], type: "classic" },
  { id: 'mock-3', text: "买牛奶、鸡蛋，还有打印纸用完了。", time: "Tuesday", tags: ["生活"], type: "chat", suggested: true }
];

export default function WorkspacePage() {
  const [activeNav, setActiveNav] = useState('dock');
  const [inputMode, setInputMode] = useState<'chat' | 'classic'>('chat');
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // 真实数据状态
  const [dockItems, setDockItems] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 优雅的主题状态 (支持黑白模式切换)
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [isDark, setIsDark] = useState(false);

  // --- 初始化主题 ---
  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode]);

  // --- 加载真实数据 ---
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // 调用你的 repository 获取当前 Dock 的条目 (请根据你实际的 lib/repository 方法名修改)
      // 例如：const data = await repository.getEntriesByStatus('dock');
      const data = (repository as any).list ? await (repository as any).list() : [];
      
      if (data && data.length > 0) {
        // 适配真实数据结构
        setDockItems(data.map((item: any) => ({
          id: item.id,
          text: item.content || item.text,
          time: new Date(item.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          tags: item.tags || [],
          type: item.type || 'classic',
          suggested: item.suggested || false
        })));
      } else {
        setDockItems(FALLBACK_DOCK_ITEMS);
      }
    } catch (error) {
      console.warn("Failed to load real data, falling back to mock.", error);
      setDockItems(FALLBACK_DOCK_ITEMS);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- 保存新记录 (Capture) ---
  const handleSaveEntry = async (content: string) => {
    if (!content.trim()) return;
    try {
      // 对接你的底层存储，将新输入写入本地库
      if ((repository as any).create) {
        await (repository as any).create({
          content: content,
          type: inputMode,
          status: 'dock', // 默认进入 dock
          tags: [],       // 后续可由 Gemini 补充
          createdAt: new Date().toISOString()
        });
      }
      // 保存成功后刷新列表
      await loadData();
    } catch (error) {
      console.error("Save entry failed:", error);
    }
    
    // 清空输入框并收起
    setInputText('');
    setIsInputExpanded(false);
  };

  const handleCloseEditor = () => setIsInputExpanded(false);

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="flex h-screen w-full bg-[#F5F5F7] dark:bg-[#0E0E11] text-slate-800 dark:text-slate-200 font-sans overflow-hidden selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
        
        {/* 1. Sidebar */}
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

        {/* 2. Main Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-8 bg-white/40 dark:bg-[#1C1C1E]/40 backdrop-blur-md border-b border-white/20 dark:border-white/5 z-10 sticky top-0 transition-colors duration-[800ms]">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                {activeNav === 'dock' ? 'Dock' : activeNav === 'entries' ? 'Entries' : 'Tags'}
              </h1>
              <span className="px-2 py-0.5 bg-slate-200/50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-full text-xs font-medium">
                {dockItems.length}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <button className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-colors">
                <Search size={20} />
              </button>
              {/* ✨ 引入专属设计的线性日月拼接按钮 */}
              <ThemeToggle mode={themeMode} setMode={setThemeMode} />
              <button className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-colors">
                <Settings size={20} />
              </button>
            </div>
          </header>

          {/* Scrollable Content (Dock Items) */}
          <main className="flex-1 overflow-y-auto px-8 py-6 pb-40 space-y-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {isLoadingData ? (
                <div className="flex items-center justify-center h-32 opacity-50">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : (
                dockItems.map((item) => (
                  <DockCard key={item.id} item={item} />
                ))
              )}
            </div>
          </main>

          {/* --- 魔法时刻：平行世界遮罩 --- */}
          <div 
            className={`absolute inset-0 pointer-events-none transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] z-40 ${
              inputMode === 'chat' 
                ? 'bg-[#F5F5F7]/80 dark:bg-[#0E0E11]/80 backdrop-blur-[12px] opacity-100' 
                : 'bg-[#F5F5F7]/0 dark:bg-[#0E0E11]/0 backdrop-blur-none opacity-0'
            }`} 
          />

          {/* 3. Floating Input Area (空间穿越动画) */}
          <div 
            className={`absolute left-0 w-full flex flex-col items-center pointer-events-none z-50 transition-all duration-[800ms] ease-[cubic-bezier(0.175,0.885,0.32,1.15)] ${
              inputMode === 'chat'
                ? 'bottom-[50%] translate-y-[50%] p-6 scale-[1.03]'
                : 'bottom-0 translate-y-0 p-6 scale-100'
            }`}
          >
            <div className="w-full max-w-4xl flex flex-col items-center pointer-events-auto relative">
              
              {/* Trae Style Mode Switch */}
              <div className={`mb-3 transition-all duration-500 ease-out ${isInputExpanded ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                <ModeSwitch mode={inputMode} setMode={setInputMode} />
              </div>

              {/* Feishu Style Input Box */}
              <div className={`w-full relative transition-all duration-700 ${inputMode === 'chat' && !isInputExpanded ? 'max-w-3xl' : 'max-w-4xl'}`}>
                <InputContainer 
                  mode={inputMode} 
                  expanded={isInputExpanded} 
                  setExpanded={setIsInputExpanded}
                  text={inputText}
                  setText={setInputText}
                  onSave={handleSaveEntry}
                  onClose={handleCloseEditor}
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 子组件区域 (Components)
// ============================================================================

function ThemeToggle({ mode, setMode }: { mode: string, setMode: (m: 'system'|'light'|'dark') => void }) {
  const cycleMode = () => {
    if (mode === 'system') setMode('light');
    else if (mode === 'light') setMode('dark');
    else setMode('system');
  };

  const getClipPath = (type: 'sun' | 'moon') => {
    if (mode === 'system') {
      return type === 'sun'
        ? 'polygon(0 0, 50% 0, 50% 100%, 0% 100%)' 
        : 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)'; 
    }
    if (mode === 'light') {
      return type === 'sun'
        ? 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)' 
        : 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)';
    }
    return type === 'sun'
      ? 'polygon(0 0, 0 0, 0 100%, 0% 100%)' 
      : 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)'; 
  };

  return (
    <button
      onClick={cycleMode}
      className="relative p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors w-9 h-9 flex items-center justify-center group"
      title={mode === 'system' ? '跟随系统' : mode === 'light' ? '日间模式' : '夜间模式'}
    >
      <div className="absolute inset-0 flex items-center justify-center transition-all duration-[600ms] ease-linear" style={{ clipPath: getClipPath('sun') }}>
        <Sun size={18} className="text-amber-500" strokeWidth={2} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center transition-all duration-[600ms] ease-linear" style={{ clipPath: getClipPath('moon') }}>
        <Moon size={18} className="text-indigo-400" strokeWidth={2} />
      </div>
    </button>
  );
}

function Sidebar({ activeNav, setActiveNav }: { activeNav: string, setActiveNav: (nav: string) => void }) {
  const navItems = [
    { id: 'dock', icon: Inbox, label: 'Dock' },
    { id: 'entries', icon: Archive, label: 'Entries' },
    { id: 'tags', icon: Hash, label: 'Tags' },
  ];

  return (
    <div className="w-64 h-full bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl border-r border-slate-200/50 dark:border-white/5 flex flex-col transition-colors duration-[800ms]">
      <div className="p-6 flex items-center">
        {/* Apple 风格 Logo */}
        <div className="relative w-10 h-10 flex flex-shrink-0 items-center justify-center group cursor-pointer">
          <div className="absolute inset-0 bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/10 transition-shadow duration-500 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] dark:group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]"></div>
          <div className="absolute inset-[3px] rounded-[11px] bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-400 opacity-80 blur-[1px] group-hover:opacity-100 group-hover:blur-[2px] group-hover:scale-105 transition-all duration-700 ease-out"></div>
          <div className="absolute inset-[3px] rounded-[11px] bg-gradient-to-b from-white/80 dark:from-white/30 via-white/20 dark:via-transparent to-transparent border border-white/50 dark:border-white/20 z-10 pointer-events-none"></div>
          <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.4)] z-20 group-hover:scale-110 transition-transform duration-300"></div>
        </div>
        
        {/* 品牌名称排版 */}
        <div className="flex flex-col justify-center ml-3.5 mt-0.5 cursor-pointer">
          <span className="text-[9px] font-bold tracking-[0.35em] text-slate-400 uppercase leading-none mb-1">Atlax</span>
          <span className="text-[22px] tracking-[-0.04em] text-slate-800 dark:text-slate-100 leading-none flex items-center transition-colors">
            <span className="font-bold text-slate-900 dark:text-white">Mind</span>
            <span className="font-light text-slate-500 dark:text-slate-400">Dock</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-out group ${
                isActive 
                  ? 'bg-white dark:bg-[#2C2C2E] shadow-sm text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors'} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="bg-slate-100/50 dark:bg-black/20 rounded-2xl p-4 border border-white dark:border-white/5 flex items-center space-x-3 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 dark:from-blue-900 to-indigo-100 dark:to-indigo-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold shadow-inner">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">User Workspace</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DockCard({ item }: { item: any }) {
  const [aiInsight, setAiInsight] = useState("");
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  const handleGenerateInsight = async () => {
    if (aiInsight || isInsightLoading) return;
    setIsInsightLoading(true);
    const prompt = `你是一个个人知识管理助手。请阅读以下用户的记录，并从中提取出1-3个具体的【行动项 (Action Items)】或者给出一个【一句话核心摘要】。请保持非常简短、干练，使用 Markdown 格式（如列表）。\n\n用户记录："${item.text}"`;
    const result = await callGemini(prompt);
    setAiInsight(result);
    setIsInsightLoading(false);
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_15px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-white/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300 ease-out group flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed flex-1 transition-colors">
          {item.text}
        </p>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleGenerateInsight}
            disabled={isInsightLoading}
            className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-1 tooltip-trigger"
            title="✨ AI 提取待办/摘要"
          >
            {isInsightLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          </button>
          <button className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
      
      {aiInsight && (
        <div className="mt-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-xl p-4 border border-blue-100/50 dark:border-blue-500/20 text-sm text-slate-700 dark:text-slate-300 animate-in fade-in slide-in-from-top-2 transition-colors">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium mb-2 text-xs">
            <Sparkles size={14} /> AI 洞察
          </div>
          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: aiInsight.replace(/\n/g, '<br/>') }} />
        </div>
      )}
      
      <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-50 dark:border-white/5">
        <div className="flex items-center space-x-2">
          {item.tags?.map((tag: string, idx: number) => (
            <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs rounded-lg font-medium transition-colors">
              #{tag}
            </span>
          ))}
          {item.suggested && (
            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded-lg font-medium border border-blue-100 dark:border-blue-500/20 flex items-center gap-1 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></span>
              建议
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
            <Clock size={12} />
            {item.time}
          </span>
          <button className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors border border-slate-100 dark:border-transparent">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeSwitch({ mode, setMode }: { mode: 'chat'|'classic', setMode: (m: 'chat'|'classic')=>void }) {
  return (
    <div className="relative flex items-center p-1 bg-white/60 dark:bg-[#2C2C2E]/60 backdrop-blur-md rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.05)] dark:shadow-none border border-slate-200/50 dark:border-white/10 transition-colors">
      <div 
        className="absolute h-[calc(100%-8px)] top-1 w-[100px] bg-white dark:bg-[#4C4C50] rounded-full shadow-sm transition-transform duration-300 cubic-bezier(0.32, 0.72, 0, 1)"
        style={{ transform: mode === 'chat' ? 'translateX(0)' : 'translateX(100px)' }}
      />
      <button 
        onClick={() => setMode('chat')}
        className={`relative z-10 w-[100px] py-1.5 text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-1.5 ${mode === 'chat' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
      >
        <MessageSquare size={14} />
        Chat
      </button>
      <button 
        onClick={() => setMode('classic')}
        className={`relative z-10 w-[100px] py-1.5 text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-1.5 ${mode === 'classic' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
      >
        <PenTool size={14} />
        Classic
      </button>
    </div>
  );
}

function InputContainer({ mode, expanded, setExpanded, text, setText, onSave, onClose }: any) {
  const [chatPlaceholder, setChatPlaceholder] = React.useState("告诉 Atlax 你想记录什么...");

  useEffect(() => {
    if (mode === 'chat' && !expanded) {
      const prompts = [
        "今天有什么奇思妙想想要保存下来？",
        "别担心思绪凌乱，Atlax 会帮你理清...",
        "每一个伟大的想法，都源于一次不经意的记录 ✨",
        "放轻松，在这里写下你现在的真实感受...",
        "我在这里，随时准备倾听你的灵光一闪...",
        "你的每一次输入，都在构建更强大的自己。"
      ];
      setChatPlaceholder(prompts[Math.floor(Math.random() * prompts.length)]);
    }
  }, [mode, expanded]);

  const renderChatInput = () => {
    if (!expanded) {
      return (
        <div className="w-full bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-3xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white dark:border-white/10 p-2.5 flex items-center transition-all duration-500 hover:shadow-[0_30px_80px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_30px_80px_rgba(59,130,246,0.2)] hover:scale-[1.01] focus-within:ring-2 focus-within:ring-blue-100/50 dark:focus-within:ring-blue-500/30 focus-within:border-blue-200 dark:focus-within:border-blue-400 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-transparent to-purple-400/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

          <button className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all relative z-10" title="语音闪记">
            <Mic size={20} />
          </button>

          <input 
            type="text"
            placeholder={chatPlaceholder}
            className="flex-1 bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-200 px-3 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[15px] relative z-10"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && text.trim()) onSave(text);
            }}
          />

          <div className="flex items-center space-x-1 pl-2 border-l border-slate-100 dark:border-white/10 opacity-60 group-focus-within:opacity-100 group-hover:opacity-100 transition-opacity relative z-10">
            <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"><ImageIcon size={18} /></button>
            <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"><Hash size={18} /></button>
            <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"><Paperclip size={18} /></button>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/20 mx-1.5"></div>
            <button onClick={() => setExpanded(true)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"><Maximize2 size={18} /></button>
            
            <button 
              onClick={() => onSave(text)}
              disabled={!text.trim()}
              className={`ml-1.5 p-2 rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center ${
                text.trim() ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md hover:-translate-y-0.5' : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send size={18} className={text.trim() ? 'translate-x-[1px] -translate-y-[1px]' : ''} />
            </button>
          </div>
        </div>
      );
    }
    return <ExpandedEditor mode="chat" text={text} setText={setText} onSave={onSave} onClose={onClose} dynamicPlaceholder={chatPlaceholder} />;
  };

  const renderClassicInput = () => {
    if (!expanded) {
      return (
        <button onClick={() => setExpanded(true)} className="w-full max-w-[240px] mx-auto bg-white/90 dark:bg-[#2C2C2E]/90 backdrop-blur-2xl rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/80 dark:border-white/10 p-3 flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_8px_30px_rgba(59,130,246,0.3)] group relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <Plus size={20} className="relative z-10" />
          <span className="relative z-10 tracking-wide">新建记录</span>
        </button>
      );
    }
    return <ExpandedEditor mode="classic" text={text} setText={setText} onSave={onSave} onClose={onClose} />;
  };

  return <div className="w-full transition-all duration-500 ease-out flex justify-center">{mode === 'chat' ? renderChatInput() : renderClassicInput()}</div>;
}

function ExpandedEditor({ mode, text, setText, onSave, onClose, dynamicPlaceholder }: any) {
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const handleAIPolish = async () => {
    if (!text.trim() || isAiProcessing) return;
    setIsAiProcessing(true);
    const prompt = mode === 'chat' 
      ? `你是一个出色的灵感助手。用户输入了一段想法，请你顺着他的思路继续发散，提供几个扩展视角的建议。尽量亲切自然。\n\n用户输入："${text}"`
      : `你是一个专业的个人知识整理助手。请帮我把下面这段随意的记录【重新排版】，使其结构更清晰（需要时使用无序列表）。并在内容的最后，基于内容语义自动生成 3 个相关的【#标签】。\n\n原记录："${text}"`;
    const aiResponse = await callGemini(prompt);
    if (mode === 'chat') setText(text + "\n\n✨ AI 补充：\n" + aiResponse);
    else setText(aiResponse);
    setIsAiProcessing(false);
  };

  return (
    <div className="w-full bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 overflow-hidden flex flex-col transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 relative">
      <div className="px-5 py-3 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
        <div className="flex items-center space-x-2">
          {mode === 'chat' 
            ? <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-lg flex items-center gap-1.5"><MessageSquare size={12}/> AI 助手引导中</span>
            : <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5"><PenTool size={12}/> 经典模式</span>
          }
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">
          <Minimize2 size={16} />
        </button>
      </div>

      <div className="p-5 relative">
        <textarea 
          autoFocus
          placeholder={mode === 'chat' ? dynamicPlaceholder : "输入记录内容..."}
          className={`w-full h-32 bg-transparent border-none focus:outline-none resize-none text-slate-700 dark:text-slate-200 text-[15px] placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-relaxed transition-opacity ${isAiProcessing ? 'opacity-50' : 'opacity-100'}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {isAiProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-[#1C1C1E]/50 backdrop-blur-[1px] z-10">
            <div className="bg-white dark:bg-[#2C2C2E] shadow-lg border border-slate-100 dark:border-white/10 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              <Loader2 size={16} className="animate-spin" /> ✨ Gemini 思考中...
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-white dark:bg-[#1C1C1E] border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <ToolButton icon={ImageIcon} tooltip="图片" />
          <ToolButton icon={Paperclip} tooltip="附件" />
          <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-2"></div>
          <ToolButton icon={CheckSquare} tooltip="待办" />
          <ToolButton icon={List} tooltip="列表" />
          <button 
            onClick={handleAIPolish}
            disabled={isAiProcessing || !text.trim()}
            className={`ml-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 shadow-sm border ${!text.trim() || isAiProcessing ? 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-white/5 cursor-not-allowed' : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20 hover:shadow-md hover:scale-[1.02] active:scale-95'}`}
            title="使用 Gemini 智能润色"
          >
            <Sparkles size={16} className={isAiProcessing ? "animate-pulse" : ""} />
            {mode === 'chat' ? "发散思路" : "智能排版与打标"}
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">{text.length} chars</span>
          <button 
            onClick={() => onSave(text)}
            disabled={!text.trim() || isAiProcessing}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-xl font-medium shadow-sm shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2"
          >
            {mode === 'chat' ? '发送' : '保存'} <Send size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ icon: Icon, tooltip }: any) {
  return (
    <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors relative group" title={tooltip}>
      <Icon size={18} strokeWidth={2.5} />
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
        {tooltip}
      </span>
    </button>
  );
}