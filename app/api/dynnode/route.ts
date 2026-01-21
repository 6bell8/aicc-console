import { NextResponse } from 'next/server';
import { createPost, listPosts } from '@/app/lib/dynnode/store';

export async function GET() {
  const items = await listPosts();
  return NextResponse.json({ items }, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}) as any);

  if (!body?.title || typeof body.title !== 'string') {
    return NextResponse.json({ message: 'title is required' }, { status: 400 });
  }
  if (!body?.code || typeof body.code !== 'string') {
    return NextResponse.json({ message: 'code is required' }, { status: 400 });
  }

  const post = await createPost({
    title: body.title,
    summary: typeof body.summary === 'string' ? body.summary : null,
    code: body.code,
    sampleCtx: typeof body.sampleCtx === 'string' ? body.sampleCtx : '{\n  \n}\n',
    tags: Array.isArray(body.tags) ? body.tags.filter((x: any) => typeof x === 'string') : [],
    status: body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
  });

  return NextResponse.json({ post }, { status: 201 });
}
