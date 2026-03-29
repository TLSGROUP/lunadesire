import { type NextRequest, NextResponse } from 'next/server'
import { getBasicProductInfo } from '@/lib/dreamlove/soap'

// GET /api/dreamlove/stock?id=<dreamlove_id>
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    const info = await getBasicProductInfo(id)
    // Never expose rawXml to client
    return NextResponse.json({
      dreamloveId: info.dreamloveId,
      available: info.available,
      stock: info.stock,
      price: info.price,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
