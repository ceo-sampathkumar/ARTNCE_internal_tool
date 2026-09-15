import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';

export async function GET(request) {
  if (!isDatabaseConfigured() || !prisma) {
    return NextResponse.json({
      dbConnected: false,
      quotes: [],
      message: 'Database not configured. Operating in browser localStorage mode.',
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const quotes = await prisma.calculationQuote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });

    return NextResponse.json({
      dbConnected: true,
      quotes,
    });
  } catch (error) {
    console.error('Error fetching quotes from database:', error);
    return NextResponse.json(
      { dbConnected: false, quotes: [], error: error.message },
      { status: 200 }
    );
  }
}

export async function POST(request) {
  if (!isDatabaseConfigured() || !prisma) {
    return NextResponse.json(
      {
        dbConnected: false,
        message: 'DATABASE_URL is not configured. Saved in browser storage.',
      },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();

    const {
      title,
      clientName,
      status = 'draft',
      width,
      height,
      unit = 'ft',
      widthFt,
      heightFt,
      areaSqFt,
      perimeterFt,
      subtotalCost,
      transportCost,
      totalCost,
      costPerSqFt,
      pricingMethod = 'markup',
      pricingMarkupPct,
      pricingMarginPct,
      profit,
      sellingPrice,
      breakdownSnapshot,
      settingsSnapshot,
      notes,
    } = body;

    const newQuote = await prisma.calculationQuote.create({
      data: {
        title: title || `Quote ${new Date().toLocaleDateString('en-IN')}`,
        clientName: clientName || null,
        status: status || 'draft',
        width: Number(width),
        height: Number(height),
        unit: unit || 'ft',
        widthFt: Number(widthFt),
        heightFt: Number(heightFt),
        areaSqFt: Number(areaSqFt),
        perimeterFt: Number(perimeterFt),
        subtotalCost: Number(subtotalCost),
        transportCost: Number(transportCost),
        totalCost: Number(totalCost),
        costPerSqFt: Number(costPerSqFt),
        pricingMethod: pricingMethod || 'markup',
        pricingMarkupPct: pricingMarkupPct !== undefined ? Number(pricingMarkupPct) : null,
        pricingMarginPct: pricingMarginPct !== undefined ? Number(pricingMarginPct) : null,
        profit: Number(profit),
        sellingPrice: Number(sellingPrice),
        breakdownSnapshot: breakdownSnapshot || {},
        settingsSnapshot: settingsSnapshot || {},
        notes: notes || null,
      },
    });

    return NextResponse.json({
      dbConnected: true,
      success: true,
      quote: newQuote,
    });
  } catch (error) {
    console.error('Error saving quote to database:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
