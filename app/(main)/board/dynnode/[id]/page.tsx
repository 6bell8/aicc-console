'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/app/components/ui/button';
import { getDynNode, patchDynNode } from '@/app/lib/api/dynnode';
import DynNodeRunner from '../../../../components/dynnode/DynnodeRunner';

export default function DynNodeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['dynnode', id],
    queryFn: () => getDynNode(id),
  });

  const post = q.data?.post;

  const [isEdit, setIsEdit] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [code, setCode] = useState('');
  const [sampleCtx, setSampleCtx] = useState('');

  // 서버 데이터 로드 시 폼 초기화
  useEffect(() => {
    if (!post) return;
    setTitle(post.title);
    setSummary(post.summary ?? '');
    setCode(post.code);
    setSampleCtx(post.sampleCtx);
  }, [post?.id]);

  const dirty = useMemo(() => {
    if (!post) return false;
    return title !== post.title || summary !== (post.summary ?? '') || code !== post.code || sampleCtx !== post.sampleCtx;
  }, [post, title, summary, code, sampleCtx]);

  const saveM = useMutation({
    mutationFn: () =>
      patchDynNode(id, {
        title: title.trim() || '제목 없음',
        summary: summary.trim() || null,
        code,
        sampleCtx,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dynnode', id] });
      qc.invalidateQueries({ queryKey: ['dynnode', 'list'] });
      setIsEdit(false);
      router.push('/board/dynnode');
    },
  });

  const onCancel = () => {
    if (!post) return;
    setTitle(post.title);
    setSummary(post.summary ?? '');
    setCode(post.code);
    setSampleCtx(post.sampleCtx);
    setIsEdit(false);
  };

  if (q.isLoading) return <div className="p-6 text-sm text-slate-500">불러오는 중…</div>;
  if (!post) return <div className="p-6 text-sm text-slate-500">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold truncate">{post.title}</h1>
          <div className="text-xs text-slate-500">updated: {new Date(post.updatedAt).toLocaleString()}</div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => router.push('/board/dynnode')}>
            목록
          </Button>

          {isEdit ? (
            <>
              <Button variant="outline" onClick={onCancel} disabled={saveM.isPending}>
                취소
              </Button>
              <Button variant={'outline'} onClick={() => saveM.mutate()} disabled={saveM.isPending || !dirty}>
                저장
              </Button>
            </>
          ) : (
            <Button variant={'outline'} onClick={() => setIsEdit(true)}>
              수정
            </Button>
          )}
        </div>
      </div>
      <DynNodeRunner code={code} onChangeCode={setCode} ctxText={sampleCtx} onChangeCtxText={setSampleCtx} />
    </div>
  );
}
