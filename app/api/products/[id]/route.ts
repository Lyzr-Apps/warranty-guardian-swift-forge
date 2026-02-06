import { NextRequest, NextResponse } from 'next/server'
import { productsStore } from '@/lib/productsStore'

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params

    const product = productsStore.update(id, {
      ...(body.brand && { brand: body.brand }),
      ...(body.product_name && { product_name: body.product_name }),
      ...(body.purchase_date && { purchase_date: body.purchase_date }),
      ...(body.invoice_id && { invoice_id: body.invoice_id }),
      ...(body.warranty_end_date && { warranty_end_date: body.warranty_end_date }),
      ...(body.warranty_period_months && { warranty_period_months: body.warranty_period_months }),
      ...(body.status_color && { status_color: body.status_color }),
      ...(body.status_message && { status_message: body.status_message }),
      ...(body.days_remaining !== undefined && { days_remaining: body.days_remaining }),
      ...(body.overall_confidence !== undefined && { overall_confidence: body.overall_confidence }),
      ...(body.verification_required !== undefined && { verification_required: body.verification_required }),
      ...(body.fields_to_verify !== undefined && { fields_to_verify: body.fields_to_verify }),
      ...(body.alert_trigger !== undefined && { alert_trigger: body.alert_trigger })
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      product
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update product',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const deleted = productsStore.delete(id)

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete product',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
