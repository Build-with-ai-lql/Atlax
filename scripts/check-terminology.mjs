import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname

const FORBIDDEN = [
  /\bInbox\b/,
  /\binbox\b/,
  /\bInboxEntry\b/,
  /\bsourceInboxEntryId\b/,
  /\binboxEntries\b/,
]

const SCAN_DIRS = [
  join(ROOT, 'apps/web'),
  join(ROOT, 'packages/domain'),
]

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

let violations = []

for (const dir of SCAN_DIRS) {
  for (const ext of EXTENSIONS) {
    const pattern = `${dir.replace(/\/$/, '')}/**/*${ext}`
    let files = []
    try {
      const output = execSync(
        `find "${dir}" -name "*${ext}" -not -path "*/node_modules/*" -not -path "*/.next/*"`,
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
      )
      files = output.trim().split('\n').filter(Boolean)
    } catch {
      continue
    }

    for (const file of files) {
      let content
      try {
        content = readFileSync(file, 'utf-8')
      } catch {
        continue
      }

      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        for (const pattern of FORBIDDEN) {
          if (pattern.test(line)) {
            const rel = file.replace(ROOT, '')
            violations.push(`${rel}:${i + 1}: ${line.trim()}`)
            break
          }
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error('❌ Terminology check failed. Found forbidden Inbox references:\n')
  for (const v of violations) {
    console.error(`  ${v}`)
  }
  console.error(`\n${violations.length} violation(s) found.`)
  console.error('All product-layer and business-layer code must use "Dock" instead of "Inbox".')
  process.exit(1)
} else {
  console.log('✅ Terminology check passed. No Inbox references found.')
  process.exit(0)
}
