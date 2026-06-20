import { NextResponse } from 'next/server'

// This route exists only to prevent Next.js from trying to
// statically generate /offline during build
// The actual offline page is served by the Service Worker

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return new NextResponse('Offline page is served by Service Worker', {
    status: 404,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
