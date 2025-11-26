// app/api/robots/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: "Robots API endpoint",
    timestamp: new Date().toISOString()
  });
}
