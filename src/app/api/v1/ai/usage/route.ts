import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/ai/usage
 * 
 * Get AI usage statistics
 * Query params:
 * - accountId: Filter by account (optional)
 * - feature: Filter by feature (optional)
 * - days: Number of days to look back (default: 7)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const feature = searchParams.get('feature');
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query filters
    const where: any = {
      createdAt: {
        gte: startDate
      }
    };

    if (accountId) {
      where.accountId = accountId;
    }

    if (feature) {
      where.feature = feature;
    }

    // Get usage records
    const usageRecords = await prisma.ai_usage.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000 // Limit to last 1000 records
    });

    // Calculate totals
    const totalTokens = usageRecords.reduce((sum, record) => sum + record.tokens, 0);
    const totalCost = usageRecords.reduce((sum, record) => sum + record.cost, 0);

    // Group by feature
    const byFeature = usageRecords.reduce((acc, record) => {
      if (!acc[record.feature]) {
        acc[record.feature] = {
          tokens: 0,
          cost: 0,
          count: 0
        };
      }
      acc[record.feature].tokens += record.tokens;
      acc[record.feature].cost += record.cost;
      acc[record.feature].count += 1;
      return acc;
    }, {} as Record<string, { tokens: number; cost: number; count: number }>);

    // Group by day
    const byDay = usageRecords.reduce((acc, record) => {
      const day = record.createdAt.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = {
          tokens: 0,
          cost: 0,
          count: 0
        };
      }
      acc[day].tokens += record.tokens;
      acc[day].cost += record.cost;
      acc[day].count += 1;
      return acc;
    }, {} as Record<string, { tokens: number; cost: number; count: number }>);

    return NextResponse.json({
      summary: {
        totalTokens,
        totalCost,
        totalRequests: usageRecords.length,
        averageCostPerRequest: usageRecords.length > 0 ? totalCost / usageRecords.length : 0,
        period: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days
        }
      },
      byFeature,
      byDay,
      recentRequests: usageRecords.slice(0, 10).map(record => ({
        feature: record.feature,
        tokens: record.tokens,
        cost: record.cost,
        timestamp: record.createdAt.toISOString()
      }))
    });

  } catch (error: any) {
    console.error('Error fetching AI usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI usage', details: error.message },
      { status: 500 }
    );
  }
}

