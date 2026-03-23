import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden } from '@/lib/auth'
import { getDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()
  const { users } = await getDB()
  return NextResponse.json(Array.from(users.values()).map(({ passwordHash: _, ...safe }) => safe))
}
