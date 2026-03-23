import { NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'

export async function GET() {
  return NextResponse.json({ division: CONFIG.division, rangos: CONFIG.rangos, especialidades: CONFIG.especialidades })
}
