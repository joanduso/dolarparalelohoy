-- CreateEnum
CREATE TYPE "RateKind" AS ENUM ('PARALELO', 'OFICIAL');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "DeclaredSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "DeclaredSourceType" AS ENUM ('P2P', 'CasaCambio', 'Calle', 'Otro');

-- CreateEnum
CREATE TYPE "DeclaredStatus" AS ENUM ('ACCEPTED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "RateStatus" AS ENUM ('OK', 'DEGRADED', 'ERROR');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "RatePoint" (
    "id" TEXT NOT NULL,
    "kind" "RateKind" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "buy" DOUBLE PRECISION NOT NULL,
    "sell" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "currency_pair" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RatePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAggregate" (
    "id" TEXT NOT NULL,
    "kind" "RateKind" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "buy_avg" DOUBLE PRECISION NOT NULL,
    "sell_avg" DOUBLE PRECISION NOT NULL,
    "buy_min" DOUBLE PRECISION NOT NULL,
    "buy_max" DOUBLE PRECISION NOT NULL,
    "sell_min" DOUBLE PRECISION NOT NULL,
    "sell_max" DOUBLE PRECISION NOT NULL,
    "sources_count" INTEGER NOT NULL,

    CONSTRAINT "DailyAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreachDaily" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "official_sell" DOUBLE PRECISION NOT NULL,
    "paralelo_sell" DOUBLE PRECISION NOT NULL,
    "gap_abs" DOUBLE PRECISION NOT NULL,
    "gap_pct" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BreachDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeclaredRate" (
    "id" TEXT NOT NULL,
    "kind" "RateKind" NOT NULL,
    "side" "DeclaredSide" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "city" TEXT,
    "source_type" "DeclaredSourceType" NOT NULL,
    "base_value_at_submit" DOUBLE PRECISION NOT NULL,
    "deviation_pct" DOUBLE PRECISION NOT NULL,
    "status" "DeclaredStatus" NOT NULL,
    "trust_score" DOUBLE PRECISION NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "user_agent_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeclaredRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "run_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3) NOT NULL,
    "status" "AuditStatus" NOT NULL,
    "errors_json" JSONB,
    "inserted_count" INTEGER NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("run_id")
);

-- CreateTable
CREATE TABLE "RatesHistory" (
    "id" TEXT NOT NULL,
    "timestampUtc" TIMESTAMP(3) NOT NULL,
    "officialBcb" DOUBLE PRECISION,
    "parallelBuy" DOUBLE PRECISION,
    "parallelSell" DOUBLE PRECISION,
    "parallelMid" DOUBLE PRECISION,
    "minBuy" DOUBLE PRECISION,
    "maxBuy" DOUBLE PRECISION,
    "minSell" DOUBLE PRECISION,
    "maxSell" DOUBLE PRECISION,
    "sampleSizeBuy" INTEGER NOT NULL,
    "sampleSizeSell" INTEGER NOT NULL,
    "sourcesUsed" TEXT[],
    "confidence" "ConfidenceLevel" NOT NULL,
    "status" "RateStatus" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "RatesHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RatePoint_kind_timestamp_idx" ON "RatePoint"("kind", "timestamp");

-- CreateIndex
CREATE INDEX "RatePoint_source_timestamp_idx" ON "RatePoint"("source", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAggregate_kind_date_key" ON "DailyAggregate"("kind", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BreachDaily_date_key" ON "BreachDaily"("date");

-- CreateIndex
CREATE INDEX "DeclaredRate_kind_created_at_idx" ON "DeclaredRate"("kind", "created_at");

-- CreateIndex
CREATE INDEX "DeclaredRate_status_created_at_idx" ON "DeclaredRate"("status", "created_at");

-- CreateIndex
CREATE INDEX "DeclaredRate_ip_hash_user_agent_hash_created_at_idx" ON "DeclaredRate"("ip_hash", "user_agent_hash", "created_at");

-- CreateIndex
CREATE INDEX "RatesHistory_timestampUtc_idx" ON "RatesHistory"("timestampUtc");
