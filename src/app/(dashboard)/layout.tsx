import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { NewTransactionButton } from '@/components/transactions/TransactionFormModal'
import { getAccountsAndCategories } from '@/actions/transactions'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const [{ data: { user } }, { accounts, categories }] = await Promise.all([
    supabase.auth.getUser(),
    getAccountsAndCategories(),
  ])

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          email={user?.email}
          actions={<NewTransactionButton accounts={accounts} categories={categories} />}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-12">
          {children}
        </main>
        <NewTransactionButton accounts={accounts} categories={categories} variant="fab" />
      </div>
    </div>
  )
}
