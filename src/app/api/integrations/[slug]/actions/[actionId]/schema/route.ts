import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; actionId: string } }
) {
  try {
    const { slug, actionId } = params;

    // Fetch integration from database
    const integration = await prisma.integration.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        actions: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Parse actions from JSON
    const actions = integration.actions ? 
      (typeof integration.actions === 'string' ? 
        JSON.parse(integration.actions) : integration.actions) : 
      {};

    // Find the specific action
    const action = actions[actionId];

    if (!action) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    // Extract fields from the action definition
    const fields = action.fields || [];

    // Build schema from fields
    const schema = {
      id: action.id || actionId,
      name: action.name || actionId,
      description: action.description || '',
      fields: fields.map((field: any) => ({
        name: field.name,
        type: field.type || 'string',
        label: field.label || field.name,
        description: field.description || '',
        required: field.required || false,
        placeholder: field.placeholder || '',
        default: field.default,
        options: field.options,
      })),
    };

    return NextResponse.json({
      success: true,
      schema,
    });
  } catch (error) {
    console.error('Failed to fetch action schema:', error);
    return NextResponse.json(
      { error: 'Failed to fetch action schema' },
      { status: 500 }
    );
  }
}
