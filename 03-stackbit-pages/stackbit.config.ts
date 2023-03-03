import { defineStackbitConfig } from '@stackbit/types';

export const config = defineStackbitConfig({
  stackbitVersion: '~0.6.0',
  ssgName: 'nextjs',
  cmsName: 'git',
  nodeVersion: '16',
  models: {
    page: {
      type: 'page',
      urlPath: '/{slug}',
      filePath: '{slug}.json',
      hideContent: true,
      fields: [{ name: 'title', type: 'string', required: true }],
    },
  },
  pagesDir: 'content/pages',
  pageLayoutKey: 'type',
  objectTypeKey: 'type',
});

export default config;
