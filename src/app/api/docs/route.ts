/**
 * API Documentation Endpoint
 * Serves the OpenAPI/Swagger specification
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

export async function GET() {
  return NextResponse.json(swaggerSpec);
}

