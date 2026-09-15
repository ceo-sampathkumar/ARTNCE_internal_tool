import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';

export async function GET(request, { params }) {
  if (!isDatabaseConfigured() || !prisma) {
    return NextResponse.json(
      { dbConnected: false, error: 'Database not configured' },
      { status: 404 }
    );
  }

  try {
    const { id } = params;
    const quote = await prisma.calculationQuote.findUnique({
      where: { id },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({ dbConnected: true, quote });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!isDatabaseConfigured() || !prisma) {
    return NextResponse.json(
      { dbConnected: false, error: 'Database not configured' },
      { status: 400 }
    );
  }

  try {
    const { id } = params;
    await prisma.calculationQuote.delete({
      where: { id },
    });

    return NextResponse.json({ dbConnected: true, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
