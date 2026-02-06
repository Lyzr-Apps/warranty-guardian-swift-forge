// Shared in-memory product store
// In production, replace this with a proper database (PostgreSQL + Prisma)

export interface Product {
  id: string
  brand: string
  product_name: string
  purchase_date: string
  invoice_id: string
  warranty_end_date: string
  warranty_period_months: number
  status_color: 'GREEN' | 'YELLOW' | 'RED'
  status_message: string
  days_remaining: number
  overall_confidence: number
  verification_required: boolean
  fields_to_verify: string[]
  alert_trigger: boolean
  created_at: string
}

class ProductsStore {
  private products: Map<string, Product> = new Map()

  getAll(): Product[] {
    return Array.from(this.products.values()).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  getById(id: string): Product | undefined {
    return this.products.get(id)
  }

  create(product: Omit<Product, 'id' | 'created_at'>): Product {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newProduct: Product = {
      ...product,
      id,
      created_at: new Date().toISOString()
    }
    this.products.set(id, newProduct)
    return newProduct
  }

  update(id: string, updates: Partial<Product>): Product | null {
    const existing = this.products.get(id)
    if (!existing) return null

    const updated = { ...existing, ...updates }
    this.products.set(id, updated)
    return updated
  }

  delete(id: string): boolean {
    return this.products.delete(id)
  }
}

// Singleton instance
export const productsStore = new ProductsStore()
