'use client'

interface PrototypeFrameProps {
  html: string
}

export default function PrototypeFrame({ html }: PrototypeFrameProps) {
  return (
    <iframe
      title="Atlax MindDock Demo2 Golden Prototype"
      srcDoc={html}
      className="h-screen w-screen border-0 bg-[#111111]"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
    />
  )
}
