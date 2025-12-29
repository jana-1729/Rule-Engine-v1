import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  appId: z.string(),
  integrationId: z.string(),
  definition: z.object({
    version: z.string(),
    action: z.string(),
    fieldMappings: z.record(z.any()),
    conditions: z.array(z.any()).optional(),
  }),
  enabled: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📥 Received workflow data:', JSON.stringify(body, null, 2));
    
    const data = createWorkflowSchema.parse(body);
    console.log('✅ Validated data:', JSON.stringify(data, null, 2));

    // Verify app belongs to this account
    const app = await prisma.app.findFirst({
      where: {
        id: data.appId,
        accountId: session.accountId,
      },
    });

    if (!app) {
      console.error('❌ App not found:', data.appId);
      return NextResponse.json(
        { error: 'App not found or unauthorized' },
        { status: 404 }
      );
    }
    console.log('✅ App found:', app.id);

    // Verify integration exists
    console.log('🔍 Looking for integration with ID:', data.integrationId);
    const integration = await prisma.integration.findUnique({
      where: { id: data.integrationId },
    });

    if (!integration) {
      console.error('❌ Integration not found with ID:', data.integrationId);
      console.log('🔍 Checking all integrations...');
      const allIntegrations = await prisma.integration.findMany({
        select: { id: true, slug: true, name: true },
      });
      console.log('Available integrations:', JSON.stringify(allIntegrations, null, 2));
      
      return NextResponse.json(
        { error: 'Integration not found. Please ensure the integration is properly configured.' },
        { status: 404 }
      );
    }
    console.log('✅ Integration found:', integration.slug);

    // Create workflow
    const workflow = await prisma.workflow.create({
      data: {
        appId: data.appId,
        integrationId: data.integrationId,
        name: data.name,
        description: data.description,
        definition: data.definition,
        enabled: data.enabled,
      },
      include: {
        integration: true,
        app: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        workflow,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Workflow creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflows = await prisma.workflow.findMany({
      where: {
        app: {
          accountId: session.accountId,
        },
      },
      include: {
        integration: true,
        app: true,
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      workflows,
    });
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}
