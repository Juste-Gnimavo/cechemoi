import { FinancialFamily, FinancialReportData, ReportFilters } from '../types'
import { fetchOnlineSalesReport } from './online-sales'
import { fetchCustomOrdersReport } from './custom-orders'
import { fetchInvoicesReport } from './invoices'
import { fetchTransactionsReport } from './transactions'
import { fetchRefundsReport } from './refunds'
import { fetchExpensesReport } from './expenses'

export async function fetchReport(
  family: FinancialFamily,
  filters: ReportFilters
): Promise<FinancialReportData> {
  switch (family) {
    case 'online-sales':
      return fetchOnlineSalesReport(filters)
    case 'custom-orders':
      return fetchCustomOrdersReport(filters)
    case 'invoices':
      return fetchInvoicesReport(filters)
    case 'transactions':
      return fetchTransactionsReport(filters)
    case 'refunds':
      return fetchRefundsReport(filters)
    case 'expenses':
      return fetchExpensesReport(filters)
    default:
      throw new Error(`Famille de rapport inconnue: ${family}`)
  }
}

export {
  fetchOnlineSalesReport,
  fetchCustomOrdersReport,
  fetchInvoicesReport,
  fetchTransactionsReport,
  fetchRefundsReport,
  fetchExpensesReport,
}
