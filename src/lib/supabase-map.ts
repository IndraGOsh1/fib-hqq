import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)!

let _client: ReturnType<typeof createClient> | null = null
function getClient() {
  if (!_client) _client = createClient(supabaseUrl, supabaseKey)
  return _client
}

export class SupabaseMap<K extends string, V extends Record<string, any>> implements Map<string, V> {
  private table: string
  private pkField: K
  private cache: Map<string, V>

  private constructor(table: string, pkField: K, initial: Map<string, V>) {
    this.table   = table
    this.pkField = pkField
    this.cache   = initial
  }

  static async create<K extends string, V extends Record<string, any>>(
    table: string,
    pkField: K,
    initialData: V[] = [],
  ): Promise<Map<string, V>> {
    const client = getClient()

    const { data, error } = await client.from(table).select('*')
    if (error) {
      console.error(`[SupabaseMap] Error loading ${table}:`, error.message)
      const fallback = new Map<string, V>()
      initialData.forEach(item => fallback.set(String(item[pkField]), item))
      return fallback
    }

    const map = new Map<string, V>()

    if (data.length === 0 && initialData.length > 0) {
      for (const item of initialData) {
        const { error: insertErr } = await (client.from(table) as any).insert(item as any)
        if (!insertErr) map.set(String(item[pkField]), item)
      }
    } else {
      ;(data as V[]).forEach((row) => map.set(String(row[pkField]), row))
    }

    return new SupabaseMap<K, V>(table, pkField, map) as unknown as Map<string, V>
  }

  get size() { return this.cache.size }

  has(key: string): boolean { return this.cache.has(key) }

  get(key: string): V | undefined { return this.cache.get(key) }

  set(key: string, value: V): this {
    this.cache.set(key, value)
    const client = getClient()
    ;(client.from(this.table) as any).upsert(value as any).then(({ error }: any) => {
      if (error) console.error(`[SupabaseMap] upsert error on ${this.table}:`, error.message)
    })
    return this
  }

  delete(key: string): boolean {
    const existed = this.cache.delete(key)
    if (existed) {
      const client = getClient()
      ;(client.from(this.table) as any).delete().eq(this.pkField, key).then(({ error }: any) => {
        if (error) console.error(`[SupabaseMap] delete error on ${this.table}:`, error.message)
      })
    }
    return existed
  }

  clear(): void {
    this.cache.clear()
    const client = getClient()
    ;(client.from(this.table) as any).delete().neq(this.pkField, '').then(({ error }: any) => {
      if (error) console.error(`[SupabaseMap] clear error on ${this.table}:`, error.message)
    })
  }

  forEach(cb: (value: V, key: string, map: Map<string, V>) => void): void {
    this.cache.forEach(cb as any)
  }

  keys():   IterableIterator<string>       { return this.cache.keys() }
  values(): IterableIterator<V>            { return this.cache.values() }
  entries(): IterableIterator<[string, V]> { return this.cache.entries() }

  [Symbol.iterator](): IterableIterator<[string, V]> { return this.cache[Symbol.iterator]() }
  get [Symbol.toStringTag]() { return 'SupabaseMap' }
}