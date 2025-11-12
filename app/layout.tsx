import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
title: 'Prospector-api - Business Data Enrichment',
description: 'Extract business data from Google Places and enrich with email addresses'
}

export default function RootLayout({
children,
}: {
children: React.ReactNode
}) {
return (
<html lang="en">
<body>{children}</body>
</html>
)
}
