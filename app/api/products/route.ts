import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/products - Fetch all products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      products: products.map(p => ({
        id: p.id,
        brand: p.brand,
        product_name: p.product_name,
        purchase_date: p.purchase_date,
        invoice_id: p.invoice_id,
        warranty_end_date: p.warranty_end_date,
        warranty_period_months: p.warranty_period_months,
        status_color: p.status_color,
        status_message: p.status_message,
        days_remaining: p.days_remaining,
        overall_confidence: p.overall_confidence,
        verification_required: p.verification_required,
        fields_to_verify: p.fields_to_verify,
        alert_trigger: p.alert_trigger,
        created_at: p.created_at.toISOString()
      }))
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

    const product = await prisma.product.create({
      data: {
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
      }
    })

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        brand: product.brand,
        product_name: product.product_name,
        purchase_date: product.purchase_date,
        invoice_id: product.invoice_id,
        warranty_end_date: product.warranty_end_date,
        warranty_period_months: product.warranty_period_months,
        status_color: product.status_color,
        status_message: product.status_message,
        days_remaining: product.days_remaining,
        overall_confidence: product.overall_confidence,
        verification_required: product.verification_required,
        fields_to_verify: product.fields_to_verify,
        alert_trigger: product.alert_trigger,
        created_at: product.created_at.toISOString()
      }
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
