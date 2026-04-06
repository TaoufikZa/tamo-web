import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('tamo_session')

  if (!sessionCookie?.value) {
    redirect('/unauthorized')
  }
  
  return <HomeClient />
}
