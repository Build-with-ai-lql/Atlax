import { readFile } from 'node:fs/promises'
import path from 'node:path'

import PrototypeFrame from './PrototypeFrame'

export default async function Demo2PrototypePage() {
  const prototypePath = path.join(process.cwd(), '..', '..', 'docs', 'design_refs', 'Atlax_MindDock_Landing_Page.txt')
  let html: string | null = null

  try {
    html = await readFile(prototypePath, 'utf8')
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      throw error
    }
  }

  if (!html) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <section className="max-w-xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Demo2 Prototype</p>
          <h1 className="mt-4 text-2xl font-semibold">Design reference unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            This development reference page expects a local prototype file at
            {' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-slate-200">
              docs/design_refs/Atlax_MindDock_Landing_Page.txt
            </code>
            . The main web build can continue without that optional file.
          </p>
        </section>
      </main>
    )
  }

  return <PrototypeFrame html={html} />
}
