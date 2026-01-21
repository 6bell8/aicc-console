'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { getDynNodes } from '@/app/lib/api/dynnode';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton'; //

function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-4 w-28 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DynNodeListPage() {
  const q = useQuery({
    queryKey: ['dynnode', 'list'],
    queryFn: getDynNodes,
  });

  const items = q.data?.items ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">동적노드 게시판</h1>
        <Link href="/board/dynnode/new">
          <Button variant="outline">새 글</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-white">
        {q.isLoading ? (
          <ListSkeleton rows={8} />
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">게시글이 없습니다.</div>
        ) : (
          <div className="divide-y">
            {items.map((p) => (
              <Link key={p.id} href={`/board/dynnode/${encodeURIComponent(p.id)}`} className="block p-4 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-xs text-slate-500 truncate">{p.summary ?? p.id}</div>
                  </div>
                  <div className="text-xs text-slate-500 shrink-0">{new Date(p.updatedAt).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
