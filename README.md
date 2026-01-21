# aicc-console

AICC 콘솔 형태의 포트폴리오 프로젝트입니다.  
캠페인/모니터링/동적노드(러너) 흐름을 중심으로 구현합니다.

---

## Tech Stack
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui
- @tanstack/react-query
- zod + react-hook-form
- Web Worker (동적노드 러너)

---

## Routes (App)
- `/login` : 로그인 (Role 포함)
- `/dashboard` : 대시보드/차트
- `/campaigns` : 캠페인 목록
- `/campaigns/[id]` : 캠페인 상세
- `/monitoring` : 모니터링(캠페인 리스트/상태/제어)
- `/board` : 게시판(보드)
- `/board/dynnode/new` : 동적노드 작성
- `/board/dynnode/[id]` : 동적노드 상세/실행

----

## API (Route Handlers)
> `route.ts` 기반으로 엔드포인트를 구성합니다.

- `api/campaigns/route.ts`
- `api/campaigns/[id]/route.ts`
- `api/dynnode/route.ts`
- `api/dynnode/[id]/route.ts`

- `api/monitoring/summary/route.ts`
- `api/monitoring/run/[runId]/route.ts`
- `api/monitoring/campaigns/[id]/stop/route.ts`  ← 캠페인 중지 액션 엔드포인트

내부 상태/스토어:
- `api/_store/campaignStore.ts`

---

## Directory Map

```txt
aicc-console
├─ app
│  ├─ (auth)
│  │  └─ login
│  │     ├─ page.tsx
│  │     └─ layout.tsx
│  └─ (main)
│     ├─ board
│     │  ├─ dynnode
│     │  │  ├─ [id]/page.tsx
│     │  │  └─ new/page.tsx
│     │  └─ page.tsx
│     ├─ campaigns
│     │  └─ [id]
│     │     ├─ CampaignDetailClient.tsx
│     │     └─ page.tsx
│     ├─ monitoring
│     │  ├─ CampaignListClient.tsx
│     │  └─ page.tsx
│     ├─ dashboard
│     │  ├─ DashboardCharts.tsx
│     │  └─ page.tsx
│     └─ layout.tsx
│
├─ api
│  ├─ _store/campaignStore.ts
│  ├─ campaigns
│  │  ├─ [id]/route.ts
│  │  └─ route.ts
│  ├─ dynnode
│  │  ├─ [id]/route.ts
│  │  └─ route.ts
│  └─ monitoring
│     ├─ campaigns/[id]/stop/route.ts
│     ├─ run/[runId]/route.ts
│     └─ summary/route.ts
│
├─ components
│  ├─ auth
│  │  ├─ AuthGuard.tsx
│  │  └─ RequireAuth.tsx
│  ├─ dynnode
│  │  ├─ DynnodeRunner.tsx
│  │  └─ runner.worker.ts
│  ├─ layout/sidebar.tsx
│  └─ ui
│     ├─ alert-dialog.tsx
│     ├─ badge.tsx
│     ├─ button.tsx
│     ├─ card.tsx
│     ├─ collapsible.tsx
│     ├─ input.tsx
│     ├─ list.tsx
│     ├─ select.tsx
│     ├─ separator.tsx
│     ├─ skeleton.tsx
│     ├─ textarea.tsx
│     ├─ toaster.tsx
│     ├─ use-toast.ts
│     ├─ utils.ts
│     └─ visually-hidden.tsx
│
├─ lib
│  ├─ api
│  │  ├─ campaigns.ts
│  │  └─ dynnode.ts
│  ├─ auth
│  │  ├─ storage.tsx
│  │  ├─ types.tsx
│  │  └─ useMe.tsx
│  ├─ dynnode/store.ts
│  ├─ monitoring/store.ts
│  ├─ schemas/campaigns.tsx
│  ├─ types
│  │  ├─ campaign.tsx
│  │  └─ dynnode.ts
│  ├─ styles.ts
│  └─ ui.ts
│
├─ data
│  ├─ campaigns.json
│  ├─ dynnode.json
│  └─ monitoring.json
│
├─ mocks
├─ scenarios
├─ globals.css
├─ layout.tsx
├─ page.tsx
├─ providers.tsx
└─ favicon.ico / icon.svg
```

---

## Current Status
- 인증/보호 라우팅: `RequireAuth`, 로그인 플로우 구성
- 캠페인/모니터링/대시보드 기본 화면 구성
- 동적노드 러너: Web Worker 기반 실행 구조 진행 중

---

## Next Actions (Top Priority)
1) **모니터링 화면 ‘캠페인 중지’ 버튼 동작 연결**
   - `api/monitoring/campaigns/[id]/stop/route.ts` 호출 연결
   - 성공/실패 토스트 + UI 상태 반영(로딩/비활성/상태 업데이트)

2) 모니터링 차트/요약 데이터 폴리싱
   - `api/monitoring/summary/route.ts` 응답 스키마 고정
   - `DashboardCharts.tsx` 시각 요소 정리

3) 동적노드 게시판에 러너 결합
   - `DynnodeRunner.tsx`를 `/board/dynnode/*` 흐름에 자연스럽게 연결

---

## Git Workflow

> 여러 작업 환경(노트북/데스크탑 등)에서 동일한 규칙으로 작업하기 위한 표준 워크플로우입니다.

### Branch Strategy
- `main`: 안정(공개/배포) 기준 브랜치
- 작업 브랜치(권장): `feat/<topic>`, `fix/<topic>`, `refactor/<topic>`, `chore/<topic>`
- 날짜가 필요하면 suffix로만: `feat/<topic>-<mmdd>`

### Daily Flow
```bash
git checkout main
git pull origin main
git checkout -b feat/<topic>

# work...
git add -A
git commit -m "[add] <what changed>"
git push -u origin feat/<topic>

git checkout main
git pull origin main
git merge --no-ff feat/<topic>
git push origin main
```

### Archive (Mail/Submit ZIP)
- 파일명: `aicc-console_<MMDD>.zip` (예: `aicc-console_0116.zip`)
- `.env.local`은 기본 제외(필요하면 `.env.example` 제공)

```bash
git status
git archive -o aicc-console_$(date +%m%d).zip HEAD
```

---

## Assistant Usage Guide
- "캠페인 중지 버튼이 안 눌려요. `Monitoring/page.tsx` + 관련 mutation 코드 붙일게요. 원인 추적 후 최소 수정으로 고쳐주세요."
- "이번에 `api/monitoring/.../stop` 연결했는데 UI 반영(optimistic/refetch)을 어떤 방식이 좋은지 추천해 주세요."
- "폴더 구조 바뀌었는데 README Directory Map 업데이트 부탁드려요."
