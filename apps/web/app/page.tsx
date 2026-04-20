export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Atlax</h1>
      <p className="text-lg text-gray-600 mb-8">让知识开始替你工作</p>
      <div className="flex gap-4">
        <a href="/capture" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          开始记录
        </a>
        <a href="/inbox" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          查看 Inbox
        </a>
      </div>
    </main>
  )
}