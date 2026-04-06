import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import HomeClient from './HomeClient'

export default async function HomePage(props: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await props.searchParams;

  // CRITICAL: We must intercept the token here since we deleted middleware!
  if (token) {
    redirect(`/api/auth?token=${token}`);
  }

  // Enforce session security
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('tamo_session')

  if (!sessionCookie?.value) {
    redirect('/unauthorized')
  }
  
  return <HomeClient />
}
