interface EmptyStateProps {
  title: string
  description: string
  hint: string
}

export default function EmptyState({ title, description, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-xl text-gray-300">📋</span>
      </div>
      <h3 className="text-base font-semibold text-gray-600 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 text-center max-w-xs">{description}</p>
      <p className="text-xs text-gray-300 mt-3">{hint}</p>
    </div>
  )
}
