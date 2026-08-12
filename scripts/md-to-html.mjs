#!/usr/bin/env node
/**
 * md-to-html.mjs — Convert a CÈCHÉMOI markdown doc into a print-ready HTML
 *
 * Usage:
 *   node scripts/md-to-html.mjs doc-web/04-ANNUAIRE-LIENS-ADMIN-DASHBOARD.md
 *
 * Output:
 *   doc-web/print-output/<basename>.html
 *
 * Then open the .html in Safari or Chrome and choose File → Export as PDF
 * (Safari) or File → Print → Save as PDF (Chrome). Chrome renders running
 * headers / page numbers more faithfully than Safari.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, basename, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const TEMPLATE_DIR = join(REPO_ROOT, 'doc-web', 'print-template')
const OUTPUT_DIR = join(REPO_ROOT, 'doc-web', 'print-output')
const LOGO_PATH = join(REPO_ROOT, 'public', 'logo', 'web', 'icon-512.png')

// ----------------------------------------------------------------------------
// CLI
// ----------------------------------------------------------------------------

const inputArg = process.argv[2]
if (!inputArg) {
  console.error('Usage: node scripts/md-to-html.mjs <path-to-markdown.md>')
  process.exit(1)
}

const inputPath = resolve(REPO_ROOT, inputArg)
const md = readFileSync(inputPath, 'utf8')

// ----------------------------------------------------------------------------
// Metadata extraction from markdown content
// ----------------------------------------------------------------------------

function extractMetadata(source) {
  const lines = source.split('\n')

  // Title = first H1, stripped of "CÈCHÉMOI — " prefix
  let title = ''
  let titleLineIdx = -1
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+?)\s*$/)
    if (m) {
      title = m[1].replace(/^C[èeE]CH[éeE]MOI\s*[—–-]\s*/i, '').trim()
      titleLineIdx = i
      break
    }
  }

  // Subtitle = first H2 immediately following the H1 (skipping blanks / hr)
  let subtitle = ''
  let subtitleLineIdx = -1
  if (titleLineIdx >= 0) {
    for (let i = titleLineIdx + 1; i < Math.min(titleLineIdx + 6, lines.length); i++) {
      const raw = lines[i].trim()
      if (raw === '' || raw === '---') continue
      const m = raw.match(/^##\s+(.+?)\s*$/)
      if (m) {
        subtitle = m[1].trim()
        subtitleLineIdx = i
      }
      break
    }
  }

  // Footer block: "**Version du document** : X", "**Dernière mise à jour** : Y",
  // "**Destiné à** : Z". Scan from the end.
  let version = '1.0'
  let date = new Date().toISOString().slice(0, 10)
  let recipient = ''
  let footerStartIdx = -1

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    const versionMatch = line.match(/\*\*Version du document\*\*\s*:\s*(.+?)\s*$/)
    const dateMatch = line.match(/\*\*Derni[èe]re mise [àa] jour\*\*\s*:\s*(.+?)\s*$/)
    const recipientMatch = line.match(/\*\*Destin[ée] [àa]\*\*\s*:\s*(.+?)\s*$/)

    if (versionMatch) {
      version = versionMatch[1]
      if (footerStartIdx === -1 || i < footerStartIdx) footerStartIdx = i
    }
    if (dateMatch) {
      date = dateMatch[1]
      if (footerStartIdx === -1 || i < footerStartIdx) footerStartIdx = i
    }
    if (recipientMatch) {
      recipient = recipientMatch[1]
      if (footerStartIdx === -1 || i < footerStartIdx) footerStartIdx = i
    }
  }

  // Walk back from footerStartIdx to skip the preceding "---" separator and
  // any blank lines, so the stripped content ends cleanly.
  let footerCutFrom = footerStartIdx
  if (footerCutFrom > 0) {
    let j = footerCutFrom - 1
    while (j >= 0 && lines[j].trim() === '') j--
    if (j >= 0 && lines[j].trim() === '---') {
      footerCutFrom = j
      // Also strip trailing blanks above the ---
      let k = footerCutFrom - 1
      while (k >= 0 && lines[k].trim() === '') k--
      footerCutFrom = k + 1
    }
  }

  return { title, subtitle, version, date, recipient, titleLineIdx, subtitleLineIdx, footerCutFrom }
}

const meta = extractMetadata(md)

// Default recipient if none declared in the doc
if (!meta.recipient) meta.recipient = ''

// ----------------------------------------------------------------------------
// Strip title, subtitle and footer block from markdown body
// ----------------------------------------------------------------------------

function stripMetaFromBody(source, meta) {
  const lines = source.split('\n')
  const out = []

  for (let i = 0; i < lines.length; i++) {
    if (i === meta.titleLineIdx) continue
    if (meta.subtitleLineIdx >= 0 && i === meta.subtitleLineIdx) continue
    if (meta.footerCutFrom >= 0 && i >= meta.footerCutFrom) break
    out.push(lines[i])
  }

  // Trim leading "---" separators and blank lines that may remain after the
  // title/subtitle have been removed.
  while (out.length > 0 && (out[0].trim() === '' || out[0].trim() === '---')) {
    out.shift()
  }
  // Trim trailing blanks
  while (out.length > 0 && out[out.length - 1].trim() === '') {
    out.pop()
  }

  return out.join('\n')
}

const cleanedMd = stripMetaFromBody(md, meta)

// ----------------------------------------------------------------------------
// Markdown → HTML (marked, GitHub-flavoured)
// ----------------------------------------------------------------------------

marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: false,
  mangle: false,
})

let html = marked.parse(cleanedMd)

// Strip the anchor links that some marked versions still inject
html = html.replace(/<a\s+id="[^"]*"\s+class="anchor"[^>]*><\/a>/g, '')

// ----------------------------------------------------------------------------
// Assemble final HTML from template
// ----------------------------------------------------------------------------

const cssRaw = readFileSync(join(TEMPLATE_DIR, 'style.css'), 'utf8')
const templateRaw = readFileSync(join(TEMPLATE_DIR, 'template.html'), 'utf8')

// Inline the logo as a base64 data URI so the HTML is fully self-contained
const logoBuf = readFileSync(LOGO_PATH)
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`

// Subtitle block (hidden if no subtitle was extracted)
const subtitleBlock = meta.subtitle
  ? `<hr class="cover-rule">\n      <p class="cover-subtitle">${escapeHtml(meta.subtitle)}</p>`
  : `<hr class="cover-rule">`

// Recipient block (hidden if no recipient was declared)
const recipientBlock = meta.recipient
  ? `<div class="cover-recipient">${escapeHtml(meta.recipient)}</div>`
  : ''

const finalHtml = templateRaw
  .replace(/{{TITLE}}/g, escapeHtml(meta.title))
  .replace(/{{SUBTITLE_BLOCK}}/g, subtitleBlock)
  .replace(/{{RECIPIENT_BLOCK}}/g, recipientBlock)
  .replace(/{{DATE}}/g, escapeHtml(formatDate(meta.date)))
  .replace(/{{VERSION}}/g, escapeHtml(meta.version))
  .replace(/{{LOGO_DATA_URI}}/g, logoDataUri)
  .replace(/{{CSS}}/g, cssRaw)
  .replace(/{{CONTENT}}/g, html)

// ----------------------------------------------------------------------------
// Write output
// ----------------------------------------------------------------------------

mkdirSync(OUTPUT_DIR, { recursive: true })
const outName = basename(inputPath).replace(/\.md$/i, '.html')
const outPath = join(OUTPUT_DIR, outName)
writeFileSync(outPath, finalHtml, 'utf8')

console.log(`\n✓ Généré : ${outPath}`)
console.log(`  Titre     : ${meta.title}`)
console.log(`  Sous-titre: ${meta.subtitle || '(aucun)'}`)
console.log(`  Destiné à : ${meta.recipient || '(aucun)'}`)
console.log(`  Date      : ${meta.date}`)
console.log(`  Version   : ${meta.version}`)
console.log(`\nOuvrir : open "${outPath}"`)
console.log(`Puis dans le navigateur : Cmd+P → Enregistrer en PDF\n`)

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(iso) {
  // Accept YYYY-MM-DD or anything; format to "4 juin 2026" if ISO, else return as-is
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return iso
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  const day = parseInt(m[3], 10)
  const month = months[parseInt(m[2], 10) - 1]
  const year = m[1]
  return `${day} ${month} ${year}`
}
