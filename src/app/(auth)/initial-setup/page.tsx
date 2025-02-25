import { createClient } from '@/lib/supabase/supabaseServerClient'
import React from 'react'

export default async function page() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return <div>User not found</div>
  }




  return (
    <div>initial setup</div>
  )
}
