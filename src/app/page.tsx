import { createClient } from '@/lib/supabase/server'
import HomeClient from '@/components/public/HomeClient'

export default async function Home() {
  const supabase = await createClient()

  // Fetch products
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('available', true)
    .eq('deleted', false)
    .order('name')

  if (error) {
    console.error('Error fetching products:', error)
  }

  // Fetch about section header
  const { data: aboutSection } = await supabase
    .from('about_section')
    .select('*')
    .eq('active', true)
    .single()

  // Fetch about items
  const { data: aboutItems } = await supabase
    .from('about_items')
    .select('*')
    .eq('active', true)
    .order('display_order')

  return (
    <HomeClient
      products={products || []}
      aboutSection={aboutSection}
      aboutItems={aboutItems || []}
    />
  )
}
