import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SocialMediaService } from '@/lib/social';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get period from query params
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'week') as 'week' | 'month';

    // Fetch recap data
    const recapData = await SocialMediaService.getRecapData(userId, period);
    
    // Log recap view
    // In a real implementation, this would save to the database
    console.log(`Recap viewed by user ${userId} for period: ${period}`);

    return NextResponse.json({
      success: true,
      data: recapData
    });
  } catch (error) {
    console.error('Error fetching recap data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recap data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { platform, metrics } = body;

    // In a real implementation, this would save metrics to the database
    // For now, we'll just log it
    console.log(`Saving metrics for user ${userId}:`, { platform, metrics });

    return NextResponse.json({
      success: true,
      message: 'Metrics saved successfully'
    });
  } catch (error) {
    console.error('Error saving metrics:', error);
    return NextResponse.json(
      { error: 'Failed to save metrics' },
      { status: 500 }
    );
  }
}