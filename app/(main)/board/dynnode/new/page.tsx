'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { createDynNode } from '@/app/lib/api/dynnode';

export default function DynNodeNewPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [code, setCode] = useState(
    '// main(ctx, api) 형태로 작성해 보세요\nfunction main(ctx, api) {\n  api.log("hello");\n  return { ok: true, ctx };\n}\n',
  );
  const [sampleCtx, setSampleCtx] = useState('{\n  "name": "봉춘"\n}\n');

  const m = useMutation({
    mutationFn: () =>
      createDynNode({
        title: title.trim() || '제목 없음',
        summary: summary.trim() || null,
        code,
        sampleCtx,
        tags: [],
        status: 'DRAFT',
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['dynnode', 'list'] });
      router.push(`/board/dynnode`);
    },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">새 글</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/board/dynnode')} disabled={m.isPending}>
            취소
          </Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>
            저장
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        <input className="h-10 rounded-md border px-3" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />
        <input className="h-10 rounded-md border px-3" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="요약(선택)" />

        <div className="grid gap-2">
          <div className="text-sm font-semibold">코드</div>
          <textarea className="min-h-[220px] rounded-md border p-3 font-mono text-sm" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <div className="text-sm font-semibold">샘플 ctx(JSON)</div>
          <textarea
            className="min-h-[120px] rounded-md border p-3 font-mono text-sm"
            value={sampleCtx}
            onChange={(e) => setSampleCtx(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
