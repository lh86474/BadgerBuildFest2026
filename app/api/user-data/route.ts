import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DatabricksStorageService } from '../../../lib/server/databricks-storage';
import type { HealthData } from '../../../lib/health';

export const dynamic = 'force-dynamic';

const storage = new DatabricksStorageService();

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to access your cloud records.' },
        { status: 401 }
      );
    }

    if (!storage.isConfigured()) {
      return NextResponse.json({
        data: null,
        source: 'unconfigured',
        message: 'Databricks storage credentials not configured.',
      });
    }

    const data = await storage.getUserHealthData(userId);
    return NextResponse.json({
      data,
      source: data ? 'databricks-delta-lake' : 'empty',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve user data';
    console.error('[API /api/user-data GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to sync logs with Databricks.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = body.data as HealthData;

    if (!data || !Array.isArray(data.logs)) {
      return NextResponse.json({ error: 'Invalid health data payload.' }, { status: 400 });
    }

    // Tag the user record and child collections with their verified Clerk account ID
    data.user = {
      id: userId,
      name: data.user?.name || 'PCOS Journal User',
    };
    if (Array.isArray(data.logs)) {
      data.logs = data.logs.map((l) => ({ ...l, userId }));
    }
    if (Array.isArray(data.medications)) {
      data.medications = data.medications.map((m) => ({ ...m, userId }));
    }
    if (Array.isArray(data.labs)) {
      data.labs = data.labs.map((l) => ({ ...l, userId }));
    }

    if (!storage.isConfigured()) {
      return NextResponse.json({
        success: false,
        warning: 'Databricks SQL is not fully configured (token or warehouse missing). Stored locally in browser.',
        synced: false,
      });
    }

    const saveResult = await storage.saveUserHealthData(userId, data);

    return NextResponse.json({
      success: saveResult.success,
      destination: 'databricks-delta-lake',
      status: saveResult.status,
      error: saveResult.error,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save health data';
    console.error('[API /api/user-data POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
