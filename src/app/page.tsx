import { createClient } from '@/lib/supabase/server'
import HomeClient from '@/components/public/HomeClient'

export default async function Home() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('available', true)
    .eq('deleted', false)
    .order('name')

  if (error) {
    console.error('Error fetching products:', error)
  }

  return <HomeClient products={products || []} />
}
