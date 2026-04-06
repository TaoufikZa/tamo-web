import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import OrderTrackingClient from './OrderTrackingClient'

export const dynamic = 'force-dynamic'

export default async function OrderPage(props: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await props.params
  const supabase = await createClient()

  // 1. Get session customer_id
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('tamo_session')
  if (!sessionCookie?.value) {
    redirect('/unauthorized')
  }

  let sessionCustomerId = null
  try {
    sessionCustomerId = JSON.parse(sessionCookie.value).customer_id
  } catch (e) {
    redirect('/unauthorized')
  }

  // 2. Fetch the order and ensure ownership
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, shops(shop_name)')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    redirect('/')
  }

  // 3. Security Check: Only the owner can track the order
  if (order.customer_id !== sessionCustomerId) {
    redirect('/unauthorized')
  }

  return (
    <OrderTrackingClient initialOrder={order as any} />
  )
}
