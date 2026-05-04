import { readFile } from 'node:fs/promises'
import path from 'node:path'

import PrototypeFrame from './PrototypeFrame'

export default async function Demo2PrototypePage() {
  const prototypePath = path.join(process.cwd(), '..', '..', 'docs', 'design_refs', 'Atlax_MindDock_Landing_Page.txt')
  const html = await readFile(prototypePath, 'utf8')

  return <PrototypeFrame html={html} />
}
