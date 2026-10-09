export function readStorage(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch (error) {
    console.warn(`No se pudo leer el almacenamiento local (${key}):`, error);
    return null;
  }
}

export function writeStorage(key: string, value: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`No se pudo guardar en el almacenamiento local (${key}):`, error);
    return false;
  }
}

export function readStoredJson<T>(key: string, validate: (value: unknown) => value is T): T | null {
  const raw = readStorage(key);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (validate(value)) return value;
    console.warn(`Datos locales inválidos (${key}).`);
  } catch (error) {
    console.warn(`Datos locales dañados (${key}):`, error);
  }
  return null;
}
