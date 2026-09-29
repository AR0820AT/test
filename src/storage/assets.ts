/**
 * 图片/表情资源存储（IndexedDB）
 * localStorage 只有约 5MB，图片必须放这里（通常可达几百 MB）
 */

const DB_NAME = 'card-chat'
const DB_VERSION = 1
const STORE = 'assets'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const request = fn(db.transaction(STORE, mode).objectStore(STORE))
    request.onsuccess = () => resolve(request.result as T)
    request.onerror = () => reject(request.error)
  })
}

export function getAsset(id: string): Promise<Blob | undefined> {
  return withStore<Blob | undefined>('readonly', (store) => store.get(id))
}

export async function putAsset(id: string, blob: Blob): Promise<void> {
  await withStore('readwrite', (store) => store.put(blob, id))
}

export async function deleteAsset(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id))
}

export async function listAssetIds(): Promise<string[]> {
  const keys = await withStore<IDBValidKey[]>('readonly', (store) => store.getAllKeys())
  return keys.map(String)
}

/** 导出用：取出全部资源 [id, blob] */
export function allAssets(): Promise<Array<[string, Blob]>> {
  return openDb().then(
    (db) =>
      new Promise<Array<[string, Blob]>>((resolve, reject) => {
        const out: Array<[string, Blob]> = []
        const request = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor()
        request.onsuccess = () => {
          const cursor = request.result
          if (cursor) {
            out.push([String(cursor.key), cursor.value as Blob])
            cursor.continue()
          } else {
            resolve(out)
          }
        }
        request.onerror = () => reject(request.error)
      }),
  )
}

export async function clearAssets(): Promise<void> {
  await withStore('readwrite', (store) => store.clear())
}
