import {
  MANIFEST_FILE,
  ManifestSchema,
  UNITS_FILE,
  unitFile,
  UnitBundleSchema,
  UnitsFileSchema,
  type Manifest,
  type UnitBundle,
  type UnitSummary,
} from '@nom/core';

/** Schema Zod của core (web không phụ thuộc trực tiếp `zod`). */
interface Schema<T> {
  safeParse(
    input: unknown,
  ):
    | { success: true; data: T }
    | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };
}

/** `network`: không tải được; `http`: mã lỗi; `invalid`: JSON sai schema; `not-found`: unit không có trong manifest. */
export type ContentErrorKind = 'network' | 'http' | 'invalid' | 'not-found';

export class ContentError extends Error {
  constructor(
    readonly kind: ContentErrorKind,
    readonly file: string,
    message: string,
  ) {
    super(`${file}: ${message}`);
    this.name = 'ContentError';
  }
}

/** Đọc content do `content:build` sinh (T7.1, plan 0.7). */
export interface ContentClient {
  /** `units.json` — lộ trình `/units`. */
  units(): Promise<UnitSummary[]>;
  /** `unit-<id>.json` — tải khi mở unit. */
  unit(unitId: string): Promise<UnitBundle>;
}

export interface ContentClientOptions {
  /** Thư mục content, kết thúc bằng `/` (mặc định `<BASE_URL>content/`). */
  baseUrl: string;
  fetch?: typeof fetch;
}

/**
 * Mỗi lần đọc hỏi lại `manifest.json` (`no-cache` → trình duyệt chỉ revalidate; các lần gọi đồng thời
 * dùng chung một request). File dữ liệu tải theo `?v=<hash>` và giữ trong bộ nhớ theo hash, nên
 * content đổi (`manifest.version` đổi) thì chỉ file đổi được tải lại.
 */
export function createContentClient({
  baseUrl,
  fetch: fetchFn = globalThis.fetch.bind(globalThis),
}: ContentClientOptions): ContentClient {
  let manifestRequest: Promise<Manifest> | null = null;
  const files = new Map<string, { hash: string; data: Promise<unknown> }>();

  async function getJson<T>(
    file: string,
    url: string,
    schema: Schema<T>,
    init?: RequestInit,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetchFn(url, init);
    } catch (cause) {
      throw new ContentError('network', file, String(cause));
    }
    if (!response.ok) throw new ContentError('http', file, `HTTP ${response.status}`);
    const parsed = schema.safeParse(await response.json().catch(() => undefined));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new ContentError('invalid', file, `${issue?.path.map(String).join('.')}: ${issue?.message}`);
    }
    return parsed.data;
  }

  function manifest(): Promise<Manifest> {
    manifestRequest ??= getJson(MANIFEST_FILE, baseUrl + MANIFEST_FILE, ManifestSchema, {
      cache: 'no-cache',
    }).finally(() => {
      manifestRequest = null;
    });
    return manifestRequest;
  }

  async function load<T>(file: string, schema: Schema<T>): Promise<T> {
    const entry = (await manifest()).files[file];
    if (!entry) throw new ContentError('not-found', file, 'không có trong manifest');
    const cached = files.get(file);
    if (cached?.hash === entry.hash) return cached.data as Promise<T>;

    const data = getJson(file, `${baseUrl}${file}?v=${entry.hash}`, schema);
    files.set(file, { hash: entry.hash, data });
    // Lỗi không được giữ trong cache — lần sau thử lại.
    data.catch(() => {
      if (files.get(file)?.data === data) files.delete(file);
    });
    return data;
  }

  return {
    units: () => load(UNITS_FILE, UnitsFileSchema),
    unit: (unitId) => load(unitFile(unitId), UnitBundleSchema),
  };
}
