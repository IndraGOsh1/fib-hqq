import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import type { Rol } from './db'

const SECRET = process.env.JWT_SECRET || 'fib-dev-secret-change-in-prod'

export interface JWTPayload {
  id: string; username: string; rol: Rol
  nombre: string | null; agentNumber: string | null; callsign: string | null
}

export const signToken  = (p: JWTPayload) => jwt.sign(p, SECRET, { expiresIn:'7d' })
export const verifyToken = (t: string): JWTPayload | null => { try { return jwt.verify(t, SECRET) as JWTPayload } catch { return null } }

export function getUser(req: NextRequest): JWTPayload | null {
  const h = req.headers.get('authorization') || ''
  return h.startsWith('Bearer ') ? verifyToken(h.slice(7)) : null
}

export const err         = (msg: string, status=400) => NextResponse.json({ error:msg }, { status })
export const unauthorized = ()                        => err('No autorizado', 401)
export const forbidden    = ()                        => err('Sin permisos', 403)
export const notFound     = (m='No encontrado')       => err(m, 404)
