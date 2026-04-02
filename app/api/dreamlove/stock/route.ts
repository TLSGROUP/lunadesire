import { type NextRequest, NextResponse } from 'next/server'
import { getProductStock } from '@/lib/dreamlove/api'

// GET /api/dreamlove/stock?id=<dreamlove_id>
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    const info = await getProductStock(id)
    return NextResponse.json({
      dreamloveId: id,
      available: info.available,
      stock: info.stock,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
