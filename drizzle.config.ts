import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  // Listed rather than globbed: a schema.ts that holds no table can reach
  // React Native through a barrel, which drizzle-kit cannot bundle.
  schema: [
    './src/modules/folders/schema.ts',
    './src/modules/highlights/schema.ts',
    './src/modules/journal/schema.ts',
    './src/modules/notes/schema.ts',
    './src/modules/reflections/schema.ts',
  ],
  out: './src/modules/db/migrations',
});
