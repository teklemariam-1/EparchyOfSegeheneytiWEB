import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { ContactForm } from '@/features/contact/ContactForm'

export const metadata: Metadata = buildMetadata({
  title: 'Contact',
  description: 'Contact the Catholic Eparchy of Segeneyti — Chancery office, Bishop\'s secretariat, and parish finder.',
  path: '/contact',
})

const OFFICES = [
  {
    name: 'Chancery Office',
    role: 'General enquiries, canonical matters, and administrative correspondence.',
    address: 'P.O. Box 100, Segeneyti, Southern Zoba, Eritrea',
    phone: '+291-1-000000',
    email: 'chancery@eparchy.er',
    hours: 'Monday–Friday, 8:00 AM – 1:00 PM',
  },
  {
    name: "Bishop's Secretariat",
    role: 'Appointments and correspondence for the Bishop.',
    address: 'Episcopal House, Segeneyti, Eritrea',
    phone: '+291-1-000001',
    email: 'bishop@eparchy.er',
    hours: 'Monday–Friday, 9:00 AM – 12:00 PM',
  },
  {
    name: 'Caritas Office',
    role: 'Development, humanitarian assistance, and social programmes.',
    email: 'caritas@eparchy.er',
    phone: '+291-1-000002',
    address: 'Segeneyti, Eritrea',
    hours: 'Monday–Thursday, 8:00 AM – 2:00 PM',
  },
]

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact Us"
        subtitle="Reach the Chancery, Bishop's secretariat, and Eparchy offices."
        breadcrumbs={[{ label: 'Contact' }]}
      />

      <Section className="bg-white">
        <Container>
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Contact form */}
            <div className="lg:col-span-2">
              <h2 className="font-serif text-xl font-semibold text-charcoal-900 mb-6">
                Send a Message
              </h2>
              <ContactForm />
            </div>

            {/* Sidebar: office info + map */}
            <aside className="space-y-5">
              <h2 className="font-serif text-xl font-semibold text-charcoal-900">
                Office Contacts
              </h2>

              {OFFICES.map((office) => (
                <div key={office.name} className="card p-5 space-y-2">
                  <h3 className="font-serif text-base font-semibold text-charcoal-900">{office.name}</h3>
                  <p className="text-xs text-charcoal-500 leading-snug">{office.role}</p>

                  <div className="pt-2 space-y-1.5">
                    <p className="text-xs text-charcoal-600 flex items-start gap-2">
                      <svg className="h-3.5 w-3.5 text-maroon-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {office.address}
                    </p>
                    <a href={`tel:${office.phone}`} className="text-xs text-maroon-700 hover:underline flex items-center gap-2">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {office.phone}
                    </a>
                    <a href={`mailto:${office.email}`} className="text-xs text-maroon-700 hover:underline flex items-center gap-2 break-all">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {office.email}
                    </a>
                    <p className="text-xs text-charcoal-400 flex items-center gap-2">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {office.hours}
                    </p>
                  </div>
                </div>
              ))}

              {/* Google Maps embed — Segeneyti, Eritrea */}
              <div className="rounded-xl overflow-hidden border border-charcoal-100 shadow-sm">
                <iframe
                  title="Segeneyti, Eritrea map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31344.93!2d39.0363!3d14.6528!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x166ab7b22f2d91b7%3A0x1!2sSegeneyti%2C%20Eritrea!5e0!3m2!1sen!2ser!4v1"
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  aria-label="Map showing Segeneyti, Eritrea"
                />
                <div className="px-4 py-2 bg-parchment-50 border-t border-charcoal-100">
                  <p className="text-xs text-charcoal-500 text-center">
                    <span className="font-medium text-charcoal-700">Segeneyti</span>, Southern Zoba, Eritrea
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  )
}

