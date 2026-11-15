/** `pnpm --filter @nom/core schema:export` — ghi JSON Schema từ Zod vào `packages/core/json-schema/`. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildJsonSchemas, JSON_SCHEMA_DIR } from './json-schema';

mkdirSync(JSON_SCHEMA_DIR, { recursive: true });
for (const [file, content] of Object.entries(buildJsonSchemas())) {
  writeFileSync(new URL(file, JSON_SCHEMA_DIR), content);
  console.log(`json-schema/${file}`);
}
