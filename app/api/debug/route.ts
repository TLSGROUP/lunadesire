import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

export async function GET() {
  const url = process.env.DREAMLOVE_CATALOG_URL!
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    return NextResponse.json({ error: `Fetch failed: ${res.status}` })
  }

  const xml = await res.text()

  // Show raw XML snippet
  const snippet = xml.slice(0, 2000)

  // Parse and show top-level keys + first item keys
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const doc = parser.parse(xml)
  const topKeys = Object.keys(doc)

  // Try to find the items array
  let firstItem: unknown = null
  let itemPath = ''
  for (const k1 of topKeys) {
    const v1 = doc[k1]
    if (typeof v1 === 'object' && v1 !== null) {
      for (const k2 of Object.keys(v1)) {
        const v2 = v1[k2]
        const arr = Array.isArray(v2) ? v2 : [v2]
        if (arr.length > 0 && typeof arr[0] === 'object') {
          firstItem = arr[0]
          itemPath = `${k1}.${k2}`
          break
        }
      }
    }
    if (firstItem) break
  }

  return NextResponse.json({
    status: res.status,
    topKeys,
    itemPath,
    firstItemKeys: firstItem ? Object.keys(firstItem as object) : [],
    firstItem,
    xmlSnippet: snippet,
  })
}
