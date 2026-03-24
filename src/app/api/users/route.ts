import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden } from '@/lib/auth'
import { DB } from '@/lib/db'

export async function GET(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  if (!['command_staff','supervisory'].includes(u.rol)) return forbidden()
  return NextResponse.json(Array.from(DB.users.values()).map(({ passwordHash:_, ...safe }) => safe))
}
