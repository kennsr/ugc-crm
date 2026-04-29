import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDriveClient } from '@/lib/drive';
import { Readable } from 'stream';

function mapValue(col: string, val: unknown): string {
  if (val === null) return 'NULL';
  if (col.endsWith('At') || col === 'updatedAt') {
    if (!val) return 'NULL';
    return `'${new Date(val as string).toISOString()}'`;
  }
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return `'${String(val).replace(/'/g, "''")}'`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;

    const configs = await prisma.config.findMany({ where: { workspaceId } });
    const configMap: Record<string, string> = {};
    configs.forEach((c) => { configMap[c.key] = c.value; });

    const accessToken = configMap['google_drive_access_token'];
    if (!accessToken) return NextResponse.json({ error: 'not connected' }, { status: 400 });

    const refreshToken = configMap['google_drive_refresh_token'];
    const rootFolderId = configMap['google_drive_root_folder_id'];

    const drive = getDriveClient(accessToken, refreshToken);

    // Find or create backup folder inside the root folder
    let backupFolderId: string | null = null;
    if (rootFolderId) {
      const existing = await drive.files.list({
        q: `'${rootFolderId}' in parents and name='_ugc_backup' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      });
      if (existing.data.files?.length) {
        backupFolderId = existing.data.files[0].id!;
      } else {
        const created = await drive.files.create({
          requestBody: {
            name: '_ugc_backup',
            mimeType: 'application/vnd.google-apps.folder',
            parents: [rootFolderId],
          },
          fields: 'id',
        });
        backupFolderId = created.data.id!;
      }
    }

    // Generate SQL backup
    const lines: string[] = [
      `-- UGC CRM Database Backup`,
      `-- Workspace: ${workspaceId}`,
      `-- Generated: ${new Date().toISOString()}`,
      ``,
    ];

    const tables = [
      { name: 'Campaign', rows: await prisma.campaign.findMany({ where: { workspaceId } }) },
      { name: 'Account', rows: await prisma.account.findMany({ where: { workspaceId } }) },
      { name: 'Video', rows: await prisma.video.findMany({ where: { workspaceId } }) },
      { name: 'Config', rows: await prisma.config.findMany({ where: { workspaceId } }) },
    ];

    for (const table of tables) {
      if (!table.rows.length) continue;
      const cols = Object.keys(table.rows[0]);

      lines.push(`-- Table: ${table.name} (${table.rows.length} rows)`);
      for (const row of table.rows) {
        const colNames = cols.join(', ');
        const values = cols.map((col) => mapValue(col, (row as Record<string, unknown>)[col])).join(', ');
        lines.push(`INSERT INTO "${table.name}" (${colNames}) VALUES (${values});`);
      }
      lines.push('');
    }

    const sql = lines.join('\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `ugc_backup_${timestamp}.sql`;

    const uploaded = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: 'text/plain',
        parents: backupFolderId ? [backupFolderId] : undefined,
      },
      media: {
        body: Readable.from(sql),
      },
      fields: 'id, webViewLink',
    });

    await prisma.config.upsert({
      where: { workspaceId_key: { workspaceId, key: 'last_backup_at' } },
      create: { workspaceId, key: 'last_backup_at', value: new Date().toISOString() },
      update: { value: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, fileId: uploaded.data.id, webViewLink: uploaded.data.webViewLink });
  } catch (err) {
    console.error('Backup error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
