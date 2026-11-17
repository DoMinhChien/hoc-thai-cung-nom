import { describe, expect, it } from 'vitest';
import { bundle, fakeContent, manifest, units } from '@/test/content-fixtures';
import { ContentError, createContentClient } from './content-client';

const files = () => ({
  'manifest.json': manifest(),
  'units.json': units,
  'unit-u01.json': bundle,
});

describe('content client (T7.1)', () => {
  it('đọc manifest → units.json / unit-<id>.json theo hash, validate bằng schema core', async () => {
    const { client, urls } = fakeContent(files());

    expect(await client.units()).toEqual(units);
    expect(await client.unit('u01')).toEqual(bundle);
    expect(urls()).toEqual([
      '/content/manifest.json',
      '/content/units.json?v=bbbbbbbbbbbbbbbb',
      '/content/manifest.json',
      '/content/unit-u01.json?v=aaaaaaaaaaaaaaaa',
    ]);
  });

  it('manifest revalidate (no-cache); file cùng hash dùng lại bộ nhớ', async () => {
    const { client, fetch, urls } = fakeContent(files());
    await client.unit('u01');
    await client.unit('u01');

    expect(urls().filter((u) => u.startsWith('/content/unit-'))).toHaveLength(1);
    expect(fetch.mock.calls[0]?.[1]).toEqual({ cache: 'no-cache' });
  });

  it('gọi đồng thời dùng chung một request manifest và một request file', async () => {
    const { client, urls } = fakeContent(files());
    await Promise.all([client.unit('u01'), client.unit('u01'), client.units()]);
    expect(urls().filter((u) => u.endsWith('manifest.json'))).toHaveLength(1);
    expect(urls().filter((u) => u.startsWith('/content/unit-'))).toHaveLength(1);
  });

  it('content đổi → manifest.version đổi → chỉ file đổi được tải lại', async () => {
    const content = fakeContent(files());
    await content.client.units();
    await content.client.unit('u01');

    const changed = { ...bundle, words: [] };
    content.files['manifest.json'] = manifest('0000000000000002', 'cccccccccccccccc');
    content.files['unit-u01.json'] = changed;

    expect(await content.client.unit('u01')).toEqual(changed);
    await content.client.units();
    expect(content.urls().filter((u) => !u.endsWith('manifest.json'))).toEqual([
      '/content/units.json?v=bbbbbbbbbbbbbbbb',
      '/content/unit-u01.json?v=aaaaaaaaaaaaaaaa',
      '/content/unit-u01.json?v=cccccccccccccccc',
    ]);
  });

  it('unit không có trong manifest → not-found', async () => {
    const { client } = fakeContent(files());
    await expect(client.unit('u99')).rejects.toMatchObject({
      name: 'ContentError',
      kind: 'not-found',
      file: 'unit-u99.json',
    });
  });

  it('JSON sai schema → invalid (kèm đường dẫn trường); lỗi không bị giữ trong cache', async () => {
    const content = fakeContent({ ...files(), 'unit-u01.json': { ...bundle, lessons: 'x' } });
    const error = await content.client.unit('u01').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ContentError);
    expect(error).toMatchObject({ kind: 'invalid', message: expect.stringContaining('lessons') });

    content.files['unit-u01.json'] = bundle;
    expect(await content.client.unit('u01')).toEqual(bundle);
  });

  it('HTTP lỗi → http; mất mạng → network', async () => {
    const { client } = fakeContent({ 'manifest.json': manifest() });
    await expect(client.units()).rejects.toMatchObject({ kind: 'http', message: /404/ });

    const offline = createContentClient({
      baseUrl: '/content/',
      fetch: () => Promise.reject(new TypeError('Failed to fetch')),
    });
    await expect(offline.units()).rejects.toMatchObject({ kind: 'network', file: 'manifest.json' });
  });

  it('body không phải JSON → invalid', async () => {
    const client = createContentClient({
      baseUrl: '/content/',
      fetch: async () => new Response('<html>'),
    });
    await expect(client.units()).rejects.toMatchObject({ kind: 'invalid' });
  });
});
