import type { DynNodePost } from '../types/dynnode';

export async function getDynNodes(): Promise<{ items: DynNodePost[] }> {
  const res = await fetch('/api/dynnode', { cache: 'no-store' });
  if (!res.ok) throw new Error('dynnode list fetch 실패');
  return res.json();
}

export async function getDynNode(id: string): Promise<{ post: DynNodePost }> {
  const res = await fetch(`/api/dynnode/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('dynnode get fetch 실패');
  return res.json();
}

export async function createDynNode(input: Pick<DynNodePost, 'title' | 'summary' | 'code' | 'sampleCtx' | 'tags' | 'status'>) {
  const res = await fetch('/api/dynnode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('dynnode create 실패');
  return res.json() as Promise<{ post: DynNodePost }>;
}

export async function patchDynNode(id: string, patch: Partial<Pick<DynNodePost, 'title' | 'summary' | 'code' | 'sampleCtx' | 'tags' | 'status'>>) {
  const res = await fetch(`/api/dynnode/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('dynnode patch 실패');
  return res.json() as Promise<{ post: DynNodePost }>;
}

export async function deleteDynNode(id: string) {
  const res = await fetch(`/api/dynnode/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('dynnode delete 실패');
  return res.json() as Promise<{ ok: true; removed: number }>;
}
