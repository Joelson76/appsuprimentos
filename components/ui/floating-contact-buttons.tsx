'use client'

import { Mail, MessageCircle } from 'lucide-react'
import { Button } from './button'

export function FloatingContactButtons() {
  const whatsappNumber = '5543991679911' // +55 43 9 9167-9911
  const whatsappMessage = encodeURIComponent('Olá! Gostaria de saber mais sobre o SupriFlow.')
  const email = 'joelson76@gmail.com'
  const emailSubject = encodeURIComponent('Contato - SupriFlow')
  const emailBody = encodeURIComponent('Olá! Gostaria de saber mais sobre o SupriFlow.')

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group"
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#20BA5A] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <MessageCircle className="h-6 w-6 text-white" />
          <span className="sr-only">WhatsApp</span>
        </Button>
        <div className="absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
            WhatsApp
          </div>
        </div>
      </a>

      {/* Email Button */}
      <a
        href={`mailto:${email}?subject=${emailSubject}&body=${emailBody}`}
        className="group"
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <Mail className="h-6 w-6 text-white" />
          <span className="sr-only">Email</span>
        </Button>
        <div className="absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
            Email
          </div>
        </div>
      </a>
    </div>
  )
}
