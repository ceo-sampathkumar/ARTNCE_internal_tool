-- =============================================================================
-- ARTNCE Painting Cost Calculator - PostgreSQL Database Schema
-- =============================================================================

-- Enable UUID generation extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Table: cost_settings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "cost_settings" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(255) NOT NULL DEFAULT 'Default Artnce Benchmark',
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "currencySymbol" VARCHAR(10) NOT NULL DEFAULT '₹',
    "decimals" INTEGER NOT NULL DEFAULT 0,

    -- Canvas Print
    "canvasEnabled" BOOLEAN NOT NULL DEFAULT true,
    "canvasPrintRate" DOUBLE PRECISION NOT NULL DEFAULT 150.0,

    -- Stretching & Structural Support
    "stretchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "stretchMode" VARCHAR(50) NOT NULL DEFAULT 'combined', -- 'combined' or 'separate'
    "combinedRate" DOUBLE PRECISION NOT NULL DEFAULT 85.714,
    "stretchOnlyRate" DOUBLE PRECISION NOT NULL DEFAULT 85.714,
    "beamRate" DOUBLE PRECISION NOT NULL DEFAULT 85.714,
    "beamFormula" VARCHAR(50) NOT NULL DEFAULT 'shorter', -- 'shorter', 'longer', 'width', 'height', 'none'
    "beamThreshold" DOUBLE PRECISION NOT NULL DEFAULT 3.0,

    -- External Frame
    "frameEnabled" BOOLEAN NOT NULL DEFAULT true,
    "frameRate" DOUBLE PRECISION NOT NULL DEFAULT 171.429,
    "frameType" VARCHAR(255) NOT NULL DEFAULT 'Black Floater Frame',

    -- Transportation
    "transportPercent" DOUBLE PRECISION NOT NULL DEFAULT 2.0,

    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Table: extra_components
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "extra_components" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "settingId" VARCHAR(255) REFERENCES "cost_settings"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(50) NOT NULL DEFAULT 'unit',
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_extra_components_setting_id" ON "extra_components"("settingId");

-- -----------------------------------------------------------------------------
-- Table: pricing_presets
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "pricing_presets" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "method" VARCHAR(50) NOT NULL DEFAULT 'markup', -- 'markup' or 'margin'
    "markupPercent" DOUBLE PRECISION NOT NULL DEFAULT 40.0,
    "marginPercent" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Table: calculation_quotes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "calculation_quotes" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" VARCHAR(255),
    "clientName" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'quoted', 'in_production', 'completed'

    -- Input dimensions
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "unit" VARCHAR(10) NOT NULL DEFAULT 'ft',
    "widthFt" DOUBLE PRECISION NOT NULL,
    "heightFt" DOUBLE PRECISION NOT NULL,
    "areaSqFt" DOUBLE PRECISION NOT NULL,
    "perimeterFt" DOUBLE PRECISION NOT NULL,

    -- Costing Results
    "subtotalCost" DOUBLE PRECISION NOT NULL,
    "transportCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "costPerSqFt" DOUBLE PRECISION NOT NULL,

    -- Pricing Results
    "pricingMethod" VARCHAR(50) NOT NULL DEFAULT 'markup',
    "pricingMarkupPct" DOUBLE PRECISION,
    "pricingMarginPct" DOUBLE PRECISION,
    "profit" DOUBLE PRECISION NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,

    -- Snapshots
    "breakdownSnapshot" JSONB NOT NULL,
    "settingsSnapshot" JSONB NOT NULL,

    "notes" TEXT,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_calculation_quotes_status" ON "calculation_quotes"("status");
CREATE INDEX IF NOT EXISTS "idx_calculation_quotes_created_at" ON "calculation_quotes"("createdAt");
