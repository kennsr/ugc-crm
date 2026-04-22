import { PrismaClient } from '@prisma/client';

const PASSWORD = 'WfUJHjwMM5SCYLsF';
const URL = 'postgresql://postgres.vdizlbrqxjzssuqtdkhy:WfUJHjwMM5SCYLsF@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: URL } });
  
  const userId = 'b02bc95d-8a33-4bf3-80ef-e519880ff800';
  
  const existing = await prisma.workspace.findFirst({
    where: { members: { some: { userId } },
  });
  
  if (existing) {
    console.log('Workspace already exists:', existing.slug);
    await prisma.$disconnect();
    return;
  }
  
  const ws = await prisma.workspace.create({
    data: {
      name: "Ken's UGC Workspace",
      slug: 'ken-ugc',
      members: { create: { userId, role: 'admin' } },
      configs: {
        create: [
          { key: 'usd_idr_rate', value: '17000' },
          { key: 'editor_rate', value: '0.20' },
        ],
      },
    },
  });
  
  console.log('Created workspace:', ws.slug, ws.id);
  await prisma.$disconnect();
}

main().catch(console.error);
