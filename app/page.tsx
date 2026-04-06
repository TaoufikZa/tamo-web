import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ClientHome } from './components/ClientHome'

export default async function Page(props: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await props.searchParams;

  // Intercept inbound tokens
  if (token) {
    redirect(`/api/auth?token=${token}`);
  }

  // Session gatekeeper
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tamo_session');

  if (!sessionCookie?.value) {
    redirect('/unauthorized');
  }

  // Safe to render for validated users
  return <ClientHome />;
}
