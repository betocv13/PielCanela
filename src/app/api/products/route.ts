import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { productFormSchema } from '@/lib/validations'

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const includeUnavailable = searchParams.get('includeUnavailable') === 'true'

    const supabase = await createClient()

    let query = supabase
      .from('products')
      .select('*')
      .eq('deleted', false)
      .order('name')

    // Only filter by available if not including unavailable (for admin)
    if (!includeUnavailable) {
      query = query.eq('available', true)
    }

    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error in products API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate the request body
    const validationResult = productFormSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const productData = validationResult.data

    // Insert the product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        description: productData.description || null,
        category: productData.category.toLowerCase(),
        base_price: productData.base_price,
        image_url: productData.image_url || null,
        available: productData.available,
        sizes: productData.sizes,
        has_temperature: productData.has_temperature || false,
        milk_options: productData.milk_options,
        addons: productData.addons,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error in create product API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
