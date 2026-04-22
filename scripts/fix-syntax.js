const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/campaigns/route.ts',
  'src/app/api/videos/route.ts',
  'src/app/api/config/route.ts',
  'src/app/api/auth/invite/route.ts',
  'src/app/api/auth/invite/accept/route.ts',
  'src/app/api/auth/workspace/route.ts',
  'src/app/api/auth/members/route.ts',
  'src/app/import/page.tsx',
  'src/app/callback/route.ts',
].map(f => path.join(process.cwd(), f));

files.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    fs.writeFileSync(f, content);
    console.log('OK:', f);
  } else {
    console.log('MISSING:', f);
  }
});
