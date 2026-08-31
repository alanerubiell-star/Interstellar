const NS = 'noa-notes'

/** localStorage puede lanzar (modo privado, almacenamiento bloqueado): nunca debe tirar la app. */
export function load<T>(clave: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${NS}:${clave}`)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function save<T>(clave: string, valor: T): void {
  try {
    localStorage.setItem(`${NS}:${clave}`, JSON.stringify(valor))
  } catch {
    /* almacenamiento no disponible: la sesión sigue en memoria */
  }
}

export function clearAll(): void {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(`${NS}:`)) localStorage.removeItem(k)
    }
  } catch {
    /* ignorado */
  }
}
