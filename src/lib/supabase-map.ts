import { supabase, hasSupabase } from './supabase-client'

// SupabaseMap<K, T>
// K = nombre del campo que actúa como clave primaria (ej: 'id', 'codigo')
// T = tipo del objeto almacenado
// El Map siempre usa `string` como clave real, no el literal K
export class SupabaseMap<K extends string, T extends Record<string, any>> extends Map<string, T> {
  private table: string
  private keyField: K

  private constructor(table: string, keyField: K) {
    super()
    this.table = table
    this.keyField = keyField
  }

  static async create<K extends string, T extends Record<string, any>>(
    table: string,
    keyField: K,
    initialData: (T & Record<K, string>)[] = []
  ): Promise<SupabaseMap<K, T>> {
    const map = new SupabaseMap<K, T>(table, keyField)
    if (hasSupabase && supabase) {
      try {
        const { data, error } = await (supabase as any).from(table).select('*')
        if (error) {
          console.error(`[SupabaseMap] Error loading ${table}:`, error.message)
        }
        if (data && Array.isArray(data) && data.length) {
          data.forEach((row: any) => {
            if (row && row[keyField]) {
              Map.prototype.set.call(map, String(row[keyField]), row as T)
            }
          })
        } else {
          for (const row of initialData) {
            if (row && row[keyField]) {
              await map.upsertRow(String(row[keyField]), row)
              Map.prototype.set.call(map, String(row[keyField]), row)
            }
          }
        }
      } catch (err) {
        console.error(`[SupabaseMap] Failed to initialize ${table}:`, err)
      }
    } else {
      for (const row of initialData) {
        if (row && row[keyField]) {
          Map.prototype.set.call(map, String(row[keyField]), row)
        }
      }
    }
    return map
  }

  private async upsertRow(key: string, value: T) {
    if (!hasSupabase || !supabase) return
    try {
      const insertValues = { ...value }
      if (!(this.keyField in insertValues)) {
        ;(insertValues as any)[this.keyField] = key
      }
      const { error } = await (supabase as any)
        .from(this.table)
        .upsert(insertValues, { onConflict: this.keyField })
      if (error) console.error(`[SupabaseMap] upsert ${this.table} error`, error.message)
    } catch (err) {
      console.error(`[SupabaseMap] upsert failed:`, err)
    }
  }

  private async removeRow(key: string) {
    if (!hasSupabase || !supabase) return
    try {
      const { error } = await (supabase as any)
        .from(this.table)
        .delete()
        .eq(this.keyField, key)
      if (error) console.error(`[SupabaseMap] delete ${this.table} error`, error.message)
    } catch (err) {
      console.error(`[SupabaseMap] delete failed:`, err)
    }
  }

  override set(key: string, value: T): this {
    super.set(key, value)
    void this.upsertRow(key, value)
    return this
  }

  override delete(key: string): boolean {
    const result = super.delete(key)
    void this.removeRow(key)
    return result
  }

  override clear(): void {
    super.clear()
    if (hasSupabase && supabase) {
      void (async () => {
        try {
          const { error } = await (supabase as any).from(this.table).delete()
          if (error) console.error(`[SupabaseMap] clear ${this.table} error`, error.message)
        } catch (err) {
          console.error(`[SupabaseMap] clear failed:`, err)
        }
      })()
    }
  }
}
