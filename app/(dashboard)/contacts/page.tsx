import { Suspense } from 'react'
import { getContacts } from '@/lib/actions/contact'
import { ContactsClient } from '@/components/contacts/contacts-client'

export const metadata = {
  title: 'Contacts | AvisLoop',
  description: 'Manage your customer contacts',
}

async function ContactsContent() {
  const { contacts } = await getContacts()
  return <ContactsClient initialContacts={contacts} />
}

export default function ContactsPage() {
  return (
    <div className="container py-6">
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Loading contacts...</p>
          </div>
        </div>
      }>
        <ContactsContent />
      </Suspense>
    </div>
  )
}
