import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const hash = await bcrypt.hash(password, 10)
  return Response.json({ hash })
}