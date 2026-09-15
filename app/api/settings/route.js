import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { DEFAULT_SETTINGS, DEFAULT_PRICING } from '@/lib/calculator';

export async function GET() {
  if (!isDatabaseConfigured() || !prisma) {
    return NextResponse.json({
      dbConnected: false,
      settings: DEFAULT_SETTINGS,
      pricing: DEFAULT_PRICING,
      message: 'Database not configured. Operating in browser localStorage mode.',
    });
  }

  try {
    const settingsRecord = await prisma.costSettings.findFirst({
      where: { isDefault: true },
      include: { extraComponents: true },
      orderBy: { updatedAt: 'desc' },
    });

    const pricingRecord = await prisma.pricingPreset.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      dbConnected: true,
      settings: settingsRecord || DEFAULT_SETTINGS,
      pricing: pricingRecord || DEFAULT_PRICING,
    });
  } catch (error) {
    console.error('Error fetching settings from database:', error);
    return NextResponse.json(
      {
        dbConnected: false,
        settings: DEFAULT_SETTINGS,
        pricing: DEFAULT_PRICING,
        error: error.message,
      },
      { status: 200 } // Return 200 with fallback so UI doesn't crash
    );
  }
}

export async function POST(request) {
  if (!isDatabaseConfigured() || !prisma) {
    return NextResponse.json(
      {
        dbConnected: false,
        message: 'DATABASE_URL is not configured. Saved settings locally in browser.',
      },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();
    const { settings, pricing } = body;

    let savedSettings = null;
    let savedPricing = null;

    if (settings) {
      // Find existing default or create new
      const existing = await prisma.costSettings.findFirst({
        where: { isDefault: true },
      });

      const {
        currencySymbol,
        decimals,
        canvasEnabled,
        canvasPrintRate,
        stretchEnabled,
        stretchMode,
        combinedRate,
        stretchOnlyRate,
        beamRate,
        beamFormula,
        beamThreshold,
        frameEnabled,
        frameRate,
        frameType,
        transportPercent,
        extraComponents = [],
      } = settings;

      if (existing) {
        // Update
        savedSettings = await prisma.costSettings.update({
          where: { id: existing.id },
          data: {
            currencySymbol: currencySymbol ?? '₹',
            decimals: Number(decimals ?? 0),
            canvasEnabled: Boolean(canvasEnabled),
            canvasPrintRate: Number(canvasPrintRate ?? 150),
            stretchEnabled: Boolean(stretchEnabled),
            stretchMode: stretchMode ?? 'combined',
            combinedRate: Number(combinedRate ?? 85.714),
            stretchOnlyRate: Number(stretchOnlyRate ?? 85.714),
            beamRate: Number(beamRate ?? 85.714),
            beamFormula: beamFormula ?? 'shorter',
            beamThreshold: Number(beamThreshold ?? 3),
            frameEnabled: Boolean(frameEnabled),
            frameRate: Number(frameRate ?? 171.429),
            frameType: frameType ?? 'Black Floater Frame',
            transportPercent: Number(transportPercent ?? 2),
            // Replace extra components
            extraComponents: {
              deleteMany: {},
              create: (extraComponents || []).map((c) => ({
                name: c.name || 'Component',
                unit: c.unit || 'unit',
                quantity: Number(c.quantity ?? 1),
                rate: Number(c.rate ?? 0),
                enabled: c.enabled !== false,
              })),
            },
          },
          include: { extraComponents: true },
        });
      } else {
        // Create new default
        savedSettings = await prisma.costSettings.create({
          data: {
            name: 'Default Artnce Benchmark',
            isDefault: true,
            currencySymbol: currencySymbol ?? '₹',
            decimals: Number(decimals ?? 0),
            canvasEnabled: Boolean(canvasEnabled),
            canvasPrintRate: Number(canvasPrintRate ?? 150),
            stretchEnabled: Boolean(stretchEnabled),
            stretchMode: stretchMode ?? 'combined',
            combinedRate: Number(combinedRate ?? 85.714),
            stretchOnlyRate: Number(stretchOnlyRate ?? 85.714),
            beamRate: Number(beamRate ?? 85.714),
            beamFormula: beamFormula ?? 'shorter',
            beamThreshold: Number(beamThreshold ?? 3),
            frameEnabled: Boolean(frameEnabled),
            frameRate: Number(frameRate ?? 171.429),
            frameType: frameType ?? 'Black Floater Frame',
            transportPercent: Number(transportPercent ?? 2),
            extraComponents: {
              create: (extraComponents || []).map((c) => ({
                name: c.name || 'Component',
                unit: c.unit || 'unit',
                quantity: Number(c.quantity ?? 1),
                rate: Number(c.rate ?? 0),
                enabled: c.enabled !== false,
              })),
            },
          },
          include: { extraComponents: true },
        });
      }
    }

    if (pricing) {
      const existingPricing = await prisma.pricingPreset.findFirst();
      if (existingPricing) {
        savedPricing = await prisma.pricingPreset.update({
          where: { id: existingPricing.id },
          data: {
            method: pricing.method ?? 'markup',
            markupPercent: Number(pricing.markupPercent ?? 40),
            marginPercent: Number(pricing.marginPercent ?? 30),
          },
        });
      } else {
        savedPricing = await prisma.pricingPreset.create({
          data: {
            method: pricing.method ?? 'markup',
            markupPercent: Number(pricing.markupPercent ?? 40),
            marginPercent: Number(pricing.marginPercent ?? 30),
          },
        });
      }
    }

    return NextResponse.json({
      dbConnected: true,
      success: true,
      settings: savedSettings,
      pricing: savedPricing,
    });
  } catch (error) {
    console.error('Error saving settings to database:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
