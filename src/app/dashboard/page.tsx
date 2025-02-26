import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/supabaseServerClient'
import { getCurrentUserRoles } from '@/server/auth/getCurrentUserRoles'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  const roles = await getCurrentUserRoles()







  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {data.user.email}!</p>
      <p>Your roles: {roles.join(', ')}</p>
      {/* Add your dashboard content here */}
    </div>
  )
}