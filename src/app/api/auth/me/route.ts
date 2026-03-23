import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized } from '@/lib/auth'
import { getDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  const u = getUser(req)
  if (!u) return unauthorized()
  const { users } = await getDB()
  const user = users.get(u.id)
  if (!user) return unauthorized()
  const { passwordHash: _, ...safe } = user
  return NextResponse.json(safe)
}
