import { NextRequest, NextResponse } from 'next/server'
import { productsStore } from '@/lib/productsStore'

// GET /api/products - Fetch all products
export async function GET() {
  try {
    const products = productsStore.getAll()

    return NextResponse.json({
      success: true,
      products
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const product = productsStore.create({
      brand: body.brand,
      product_name: body.product_name,
      purchase_date: body.purchase_date,
      invoice_id: body.invoice_id,
      warranty_end_date: body.warranty_end_date,
      warranty_period_months: body.warranty_period_months,
      status_color: body.status_color,
      status_message: body.status_message,
      days_remaining: body.days_remaining,
      overall_confidence: body.overall_confidence,
      verification_required: body.verification_required,
      fields_to_verify: body.fields_to_verify || [],
      alert_trigger: body.alert_trigger || false
    })

    return NextResponse.json({
      success: true,
      product
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
