/**
 * Define Tool v3.0 - Layout
 * ==========================
 *
 * Layout wrapper for the Define Tool v3.0 wizard.
 * Ensures proper page structure and metadata.
 */

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Define Research Question | MedAI Hub',
  description:
    'AI-powered research question formulation using PICO, SPIDER, CoCoPop, and 17+ evidence-based frameworks.',
}

export default function DefineV3Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
