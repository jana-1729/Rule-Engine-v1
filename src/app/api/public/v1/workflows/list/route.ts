import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiKeyService } from '@/services/api-key-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Extract and validate API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    const validation = await apiKeyService.validateKey(apiKey);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid API key' },
        { status: 401 }
      );
    }

    // Fetch workflows for this app
    const workflows = await prisma.workflows.findMany({
      where: {
        appId: validation.appId,
        enabled: true, // Only return enabled workflows
      },
      select: {
        id: true,
        name: true,
        description: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
        integration: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            category: true,
            logo: true,
          },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      workflows: workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        enabled: workflow.enabled,
        integration: workflow.integration,
        executionCount: workflow._count.executions,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

