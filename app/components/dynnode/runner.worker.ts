// app/components/dynnode/runner.worker.ts
export {}; // TS에서 모듈로 인식시키기

type RunMsg = {
  type: 'RUN';
  code: string;
  ctxText: string; // JSON 텍스트
  timeoutMs: number;
};

type StopMsg = { type: 'STOP' };
type InMsg = RunMsg | StopMsg;

type OutMsg =
  | { type: 'LOG'; level: 'log' | 'info' | 'warn' | 'error'; text: string; ts: string }
  | { type: 'RESULT'; value: any; ts: string }
  | { type: 'ERROR'; message: string; stack?: string; ts: string }
  | { type: 'DONE'; ts: string };

const nowIso = () => new Date().toISOString();

function post(m: OutMsg) {
  // @ts-ignore
  postMessage(m);
}

/**
 * stringify 안전버전: circular/func/bigint 대응
 */
function safeStringify(value: any) {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    value,
    (_k, v) => {
      if (typeof v === 'object' && v !== null) {
        if (seen.has(v)) return '[Circular]';
        seen.add(v);
      }
      if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`;
      if (typeof v === 'bigint') return `${v.toString()}n`;
      return v;
    },
    2,
  );
}

function formatArgs(args: any[]) {
  return args
    .map((a) => {
      if (typeof a === 'string') return a;
      try {
        return safeStringify(a);
      } catch {
        return String(a);
      }
    })
    .join(' ');
}

let stopFlag = false;

/**
 * console.* 가로채서 UI 로그로 전달
 */
function installConsoleHijack() {
  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  (['log', 'info', 'warn', 'error'] as const).forEach((level) => {
    console[level] = (...args: any[]) => {
      post({ type: 'LOG', level, text: formatArgs(args), ts: nowIso() });
      // 필요하면 아래 주석 해제해서 DevTools에도 출력 가능
      // original[level](...args);
    };
  });

  return () => {
    console.log = original.log;
    console.info = original.info;
    console.warn = original.warn;
    console.error = original.error;
  };
}

/**
 * 전역 주입: wrapped 코드에서 globalThis로 꺼내 쓰게끔
 */
function installGlobals(ctx: any, api: any) {
  (globalThis as any).ctx = ctx;
  (globalThis as any).api = api;

  // 레시피에서 쓰고 싶은 것들
  (globalThis as any).userMap = api.userMap;
  (globalThis as any).log = (...a: any[]) => console.log(...a);
  (globalThis as any).info = (...a: any[]) => console.info(...a);
  (globalThis as any).warn = (...a: any[]) => console.warn(...a);
  (globalThis as any).error = (...a: any[]) => console.error(...a);
}

function cleanupGlobals() {
  try {
    delete (globalThis as any).ctx;
    delete (globalThis as any).api;
    delete (globalThis as any).userMap;
    delete (globalThis as any).log;
    delete (globalThis as any).info;
    delete (globalThis as any).warn;
    delete (globalThis as any).error;
  } catch {}
}

/**
 * api 구성
 * - 지금은 RUN마다 map이 새로 만들어져 실행마다 초기화됩니다.
 *   (원하면 "파일 상단 sharedMap"으로 바꿔서 실행 간 유지도 가능)
 */
function makeApi() {
  const map = new Map<string, unknown>();

  const userMap = {
    put: (key: string, value: unknown) => {
      map.set(String(key), value);
      console.info(`[userMap.put] ${key}`);
      return value;
    },
    get: (key: string) => {
      const v = map.get(String(key));
      console.info(`[userMap.get] ${key} => ${typeof v}`);
      return v;
    },
    has: (key: string) => map.has(String(key)),
    del: (key: string) => map.delete(String(key)),
    clear: () => map.clear(),
    keys: () => Array.from(map.keys()),
  };

  return {
    userMap,
    checkStopped: () => {
      if (stopFlag) throw new Error('stopped');
    },
  };
}

/**
 * ✅ 핵심:
 * - "use strict"에서도 userMap/log 등을 바로 쓰게 하려면
 *   wrapped 안에서 const userMap = globalThis.userMap; 처럼 "식별자"를 만들어줘야 합니다.
 */
// @ts-ignore
self.onmessage = async (e: MessageEvent<InMsg>) => {
  const msg = e.data;

  if (msg.type === 'STOP') {
    stopFlag = true;
    return;
  }

  stopFlag = false;

  const restoreConsole = installConsoleHijack();

  const timer = setTimeout(() => {
    stopFlag = true;
    post({ type: 'ERROR', message: `timeout: ${msg.timeoutMs}ms`, ts: nowIso() });
    post({ type: 'DONE', ts: nowIso() });
    // 무한루프 같은 건 worker 내부에서 완전 종료 불가 → 메인에서 terminate/recreate가 안전
  }, msg.timeoutMs);

  try {
    const ctx = msg.ctxText?.trim() ? JSON.parse(msg.ctxText) : {};
    const api = makeApi();

    installGlobals(ctx, api);

    const wrapped = `
"use strict";
const __G = globalThis;

// ✅ 레시피용 "글로벌처럼 보이는 식별자" 제공 (main 내부에서도 접근 가능)
const userMap = __G.userMap;
const log = __G.log;
const info = __G.info;
const warn = __G.warn;
const error = __G.error;

// (선택) ctx도 main 밖에서 그냥 쓰고 싶으면
const ctx = __G.ctx;

// 사용자 코드(여기서 main이 정의됨)
${msg.code}

// main 실행 (없으면 null)
return (typeof main === "function") ? main(__G.ctx, __G.api) : null;
`;

    // eslint-disable-next-line no-new-func
    const runner = new Function(wrapped);
    const value = await runner();

    post({ type: 'RESULT', value, ts: nowIso() });
  } catch (err: any) {
    post({
      type: 'ERROR',
      message: err?.message ?? String(err),
      stack: err?.stack,
      ts: nowIso(),
    });
  } finally {
    clearTimeout(timer);
    restoreConsole();
    cleanupGlobals();
    post({ type: 'DONE', ts: nowIso() });
  }
};
