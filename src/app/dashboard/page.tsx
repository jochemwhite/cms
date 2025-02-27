import { redirect, unauthorized } from 'next/navigation'

import { createClient } from '@/lib/supabase/supabaseServerClient'
import { getCurrentUserRoles } from '@/server/auth/getCurrentUserRoles'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_user_session')
  if (error) {
   return unauthorized()
  }








  return (
    <div>
      {
        JSON.stringify(data, null, 2)
      }
    </div>
  )
}