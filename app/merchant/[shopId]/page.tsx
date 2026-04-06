import { DashboardClient } from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function MerchantPage(props: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await props.params

  return <DashboardClient shopId={shopId} />
}
