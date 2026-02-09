'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Loader2,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useConfetti } from '@/hooks/useConfetti'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  whatsappNumber?: string | null
  city?: string | null
  _count?: { orders: number }
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
}

interface InvoiceItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  productId?: string | null
}

interface InvoiceDetail {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  customerAddress: string | null
  status: string
  subtotal: number
  tax: number
  shippingCost: number
  discount: number
  total: number
  amountPaid: number
  notes: string | null
  issueDate: string
  dueDate: string | null
  paidDate: string | null
  items: InvoiceItem[]
}

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const { success } = useConfetti()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)

  // Customer info
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Product search
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])

  // Invoice details
  const [dueDate, setDueDate] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('DRAFT')

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([])

  // Amounts
  const [tax, setTax] = useState(0)
  const [shippingCost, setShippingCost] = useState(0)
  const [discount, setDiscount] = useState(0)

  // Fetch invoice on mount
  useEffect(() => {
    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/invoices/${params.id}`)
      const data = await res.json()

      if (data.success && data.invoice) {
        const inv = data.invoice as InvoiceDetail
        setInvoice(inv)

        // Pre-fill form
        setCustomerName(inv.customerName || '')
        setCustomerEmail(inv.customerEmail || '')
        setCustomerPhone(inv.customerPhone || '')
        setCustomerAddress(inv.customerAddress || '')
        setDueDate(inv.dueDate ? inv.dueDate.split('T')[0] : '')
        setIssueDate(inv.issueDate ? inv.issueDate.split('T')[0] : '')
        setNotes(inv.notes || '')
        setStatus(inv.status)
        setTax(inv.tax || 0)
        setShippingCost(inv.shippingCost || 0)
        setDiscount(inv.discount || 0)

        // Map items
        if (inv.items && inv.items.length > 0) {
          setItems(inv.items.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            productId: item.productId,
          })))
        } else {
          setItems([{ description: '', quantity: 1, unitPrice: 0, total: 0 }])
        }
      } else {
        toast.error(data.error || 'Facture non trouvée')
        router.push('/admin/invoices')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast.error('Erreur lors du chargement de la facture')
      router.push('/admin/invoices')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }

    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }

    setItems(newItems)
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal + tax + shippingCost - discount

  // Search customers
  const searchCustomers = async (query: string) => {
    setCustomerSearch(query)
    if (query.length < 2) {
      setCustomerResults([])
      return
    }

    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}&limit=10`)
      if (!res.ok) throw new Error('Erreur de recherche')
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      setCustomerResults(data.customers || [])
    } catch (err) {
      console.error('Customer search error:', err)
    }
  }

  // Select customer
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerName(customer.name)
    setCustomerEmail(customer.email || '')
    setCustomerPhone(customer.phone)
    setCustomerResults([])
    setCustomerSearch('')
  }

  // Search products
  const searchProducts = async (query: string) => {
    setProductSearch(query)
    if (query.length < 2) {
      setProductResults([])
      return
    }

    try {
      const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(query)}&limit=10`)
      if (!res.ok) throw new Error('Erreur de recherche')
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      setProductResults(data.products || [])
    } catch (err) {
      console.error('Product search error:', err)
    }
  }

  // Add product to items
  const addProductToItems = (product: Product) => {
    const existingIndex = items.findIndex(item => item.productId === product.id)

    if (existingIndex >= 0) {
      const newItems = [...items]
      newItems[existingIndex].quantity += 1
      newItems[existingIndex].total = newItems[existingIndex].quantity * newItems[existingIndex].unitPrice
      setItems(newItems)
    } else {
      setItems([
        ...items.filter(item => item.description.trim() !== '' || item.productId),
        {
          description: product.name,
          quantity: 1,
          unitPrice: product.price,
          total: product.price,
          productId: product.id,
        }
      ])
    }

    setProductResults([])
    setProductSearch('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName) {
      toast.error('Le nom du client est requis')
      return
    }

    if (items.length === 0 || items.every(item => !item.description)) {
      toast.error('Ajoutez au moins un article')
      return
    }

    const validItems = items.filter(item => item.description.trim() !== '')

    if (validItems.length === 0) {
      toast.error('Ajoutez au moins un article valide')
      return
    }

    try {
      setSaving(true)

      const res = await fetch(`/api/admin/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          customerAddress: customerAddress || null,
          items: validItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            productId: item.productId || null,
          })),
          tax,
          shippingCost,
          discount,
          notes: notes || null,
          dueDate: dueDate || null,
          issueDate: issueDate || null,
          status,
        }),
      })

      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error('Réponse invalide du serveur')
      }

      if (data.success) {
        success()
        toast.success('Facture mise à jour avec succès')
        router.push(`/admin/invoices/${params.id}`)
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Facture non trouvée</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Modifier Facture {invoice.invoiceNumber}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Modifiez les détails de la facture
          </p>
        </div>
        <Link
          href={`/admin/invoices/${params.id}`}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </Link>
      </div>

      {/* Warning about payments */}
      {invoice.amountPaid > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-orange-400 font-medium">Attention : Paiements existants</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Cette facture a déjà reçu {formatCurrency(invoice.amountPaid)} de paiements.
              Modifier le total peut affecter le solde restant.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informations Client</h2>
          </div>

          {/* Customer Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Rechercher un client existant
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => searchCustomers(e.target.value)}
                placeholder="Rechercher par nom, téléphone ou email..."
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {customerResults.length > 0 && (
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {customerResults.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => selectCustomer(customer)}
                    className="w-full p-4 bg-gray-100 dark:bg-dark-900 hover:bg-gray-200 dark:hover:bg-dark-700 rounded-lg text-left transition-all duration-200 border border-gray-200 dark:border-dark-700 hover:border-blue-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{customer.name}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </span>
                          )}
                          {customer.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Nom du client <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="jean@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Téléphone</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="+225 XX XX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Date d'échéance</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Adresse complète</label>
            <textarea
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Adresse du client..."
            />
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Articles</h2>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Ligne manuelle</span>
            </button>
          </div>

          {/* Product Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => searchProducts(e.target.value)}
              placeholder="Rechercher un produit à ajouter..."
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {productResults.length > 0 && (
            <div className="mb-4 space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-dark-700 rounded-lg">
              {productResults.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProductToItems(product)}
                  className="w-full p-3 bg-gray-100 dark:bg-dark-900 hover:bg-gray-200 dark:hover:bg-dark-700 text-left transition-all duration-200 border-b border-gray-200 dark:border-dark-700 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {product.sku} - Stock: {product.stock}</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{product.price.toLocaleString()} CFA</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Description de l'article..."
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    min="1"
                    placeholder="Qté"
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="Prix unit."
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <div className="px-3 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white text-sm">
                    {formatCurrency(item.total)}
                  </div>
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Montants</h2>

          <div className="space-y-3 max-w-md ml-auto">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
              <span className="text-gray-900 dark:text-white font-semibold">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-500 dark:text-gray-400">Taxe</label>
              <input
                type="number"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-32 px-3 py-1 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded text-gray-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-500 dark:text-gray-400">Frais de livraison</label>
              <input
                type="number"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-32 px-3 py-1 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded text-gray-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-500 dark:text-gray-400">Remise</label>
              <input
                type="number"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-32 px-3 py-1 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded text-gray-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-dark-700">
              <span className="text-gray-900 dark:text-white font-semibold text-lg">Total</span>
              <span className="text-primary-400 font-bold text-xl">{formatCurrency(total)}</span>
            </div>

            {/* Payment info */}
            {invoice.amountPaid > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700 space-y-2">
                <div className="flex items-center justify-between text-green-400">
                  <span>Déjà payé</span>
                  <span>{formatCurrency(invoice.amountPaid)}</span>
                </div>
                <div className={`flex items-center justify-between font-semibold ${
                  total - invoice.amountPaid > 0 ? 'text-orange-400' : 'text-green-400'
                }`}>
                  <span>Nouveau solde</span>
                  <span>{formatCurrency(Math.max(0, total - invoice.amountPaid))}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white/80 dark:bg-dark-800 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations Complémentaires</h2>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Notes ou conditions de paiement..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="DRAFT">Brouillon</option>
                <option value="SENT">Envoyée</option>
                <option value="PARTIAL">Acompte versé</option>
                <option value="PAID">Payée</option>
                <option value="OVERDUE">En retard</option>
                <option value="CANCELLED">Annulée</option>
                <option value="REFUNDED">Remboursée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Date d'émission</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href={`/admin/invoices/${params.id}`}
            className="px-6 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
