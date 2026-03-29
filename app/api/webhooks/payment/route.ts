import { type NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

// POST /api/webhooks/payment
// Stripe sends events here. Configure the webhook in the Stripe dashboard.
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent
    const orderId = intent.metadata?.order_id

    if (orderId) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_provider: 'stripe',
          payment_reference: intent.id,
          stripe_payment_intent_id: intent.id,
          status: 'confirmed',
        })
        .eq('id', orderId)
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent
    const orderId = intent.metadata?.order_id

    if (orderId) {
      await supabase
        .from('orders')
        .update({ payment_status: 'unpaid', status: 'pending' })
        .eq('id', orderId)
    }
  }

  return NextResponse.json({ received: true })
}
