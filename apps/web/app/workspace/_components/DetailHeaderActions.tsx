import React, { useState, useRef, useEffect } from 'react'
import { 
  BookOpen, MoreHorizontal, Maximize, SplitSquareHorizontal, SplitSquareVertical, 
  ExternalLink, FileEdit, FolderInput, Star, GitMerge, FilePlus, FileOutput, 
  Search, Replace, Link, History, AppWindow, Trash2, X, List
} from 'lucide-react'

export function DetailHeaderActions({ onClose }: { onClose: () => void }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showPreviewTooltip, setShowPreviewTooltip] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex items-center space-x-1">
      <button 
        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors"
        title="进入全屏沉浸编辑"
        onClick={() => {
          console.log('进入全屏沉浸编辑模式，接口预留')
        }}
      >
        <Maximize size={16} />
      </button>

      <div className="relative flex items-center">
        <button 
          className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors bg-slate-50 dark:bg-white/5"
          onMouseEnter={() => setShowPreviewTooltip(true)}
          onMouseLeave={() => setShowPreviewTooltip(false)}
          onClick={() => {
            console.log('Markdown 预览/编辑模式切换，接口预留')
          }}
        >
          <BookOpen size={16} />
        </button>
        {showPreviewTooltip && (
          <div className="absolute top-full mt-2 right-0 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none">
            该标签页处于编辑视图中<br/>点击此处切换至阅读视图<br/>⌘+单击以在新标签页中打开
            <div className="absolute -top-1 right-3 w-2 h-2 bg-slate-800 transform rotate-45"></div>
          </div>
        )}
      </div>

      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors"
        >
          <MoreHorizontal size={16} />
        </button>
        
        {showDropdown && (
          <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl py-1 z-50 text-[13px]">
            <div className="px-1 py-1 space-y-0.5">
              <DropdownItem icon={Link} label="在标签页中显示反向链接" />
              <DropdownItem icon={BookOpen} label="阅读视图" />
              <DropdownItem icon={FileEdit} label="源码模式" />
            </div>
            <div className="h-px bg-slate-100 dark:bg-white/10 my-1"></div>
            <div className="px-1 py-1 space-y-0.5">
              <DropdownItem icon={SplitSquareHorizontal} label="左右分屏" />
              <DropdownItem icon={SplitSquareVertical} label="上下分屏" />
              <DropdownItem icon={ExternalLink} label="在新窗口中打开" />
            </div>
            <div className="h-px bg-slate-100 dark:bg-white/10 my-1"></div>
            <div className="px-1 py-1 space-y-0.5">
              <DropdownItem icon={FileEdit} label="重命名" />
              <DropdownItem icon={FolderInput} label="将文件移动到..." />
              <DropdownItem icon={Star} label="收藏" />
              <DropdownItem icon={GitMerge} label="将该笔记合并到..." />
              <DropdownItem icon={FilePlus} label="增加笔记属性" />
              <DropdownItem icon={FileOutput} label="导出为 PDF" />
            </div>
            <div className="h-px bg-slate-100 dark:bg-white/10 my-1"></div>
            <div className="px-1 py-1 space-y-0.5">
              <DropdownItem icon={Search} label="查找..." />
              <DropdownItem icon={Replace} label="替换..." />
            </div>
            <div className="h-px bg-slate-100 dark:bg-white/10 my-1"></div>
            <div className="px-1 py-1 space-y-0.5">
              <DropdownItem icon={Link} label="复制路径" hasArrow />
            </div>
            <div className="h-px bg-slate-100 dark:bg-white/10 my-1"></div>
            <div className="px-1 py-1 space-y-0.5">
              <DropdownItem icon={History} label="打开版本历史" />
              <DropdownItem icon={AppWindow} label="打开当前笔记的..." hasArrow />
            </div>
            <div className="h-px bg-slate-100 dark:bg-white/10 my-1"></div>
            <div className="px-1 py-1 space-y-0.5">
              <DropdownItem icon={ExternalLink} label="使用默认应用打开" />
              <DropdownItem icon={Search} label="在访达中显示" />
              <DropdownItem icon={List} label="在文件列表中显示当前文件" />
            </div>
            <div className="h-px bg-slate-100 dark:bg-white/10 my-1"></div>
            <div className="px-1 py-1 space-y-0.5">
              <DropdownItem icon={Trash2} label="删除文件" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" />
            </div>
          </div>
        )}
      </div>

      <button onClick={onClose} className="p-1.5 ml-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
        <X size={16} />
      </button>
    </div>
  )
}

function DropdownItem({ icon: Icon, label, hasArrow, className = '' }: { icon: React.ElementType, label: string, hasArrow?: boolean, className?: string }) {
  return (
    <button className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${className || 'text-slate-700 dark:text-slate-300'}`} onClick={() => console.log(label + ' - 接口预留')}>
      <div className="flex items-center gap-2">
        <Icon size={14} className="opacity-70" />
        {label}
      </div>
      {hasArrow && <span className="text-slate-400">›</span>}
    </button>
  )
}
