CREATE TYPE "AlertFrequency" AS ENUM ('DAILY', 'THRESHOLD');

CREATE TYPE "AlertSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'UNSUBSCRIBED');

CREATE TABLE "AlertSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "status" "AlertSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "frequency" "AlertFrequency" NOT NULL DEFAULT 'DAILY',
    "threshold_pct" DOUBLE PRECISION,
    "consent_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "confirmation_token_hash" TEXT,
    "unsubscribe_token" TEXT NOT NULL,
    "source" TEXT,
    "last_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AlertSubscription_email_key" ON "AlertSubscription"("email");
CREATE UNIQUE INDEX "AlertSubscription_email_hash_key" ON "AlertSubscription"("email_hash");
CREATE UNIQUE INDEX "AlertSubscription_unsubscribe_token_key" ON "AlertSubscription"("unsubscribe_token");
CREATE INDEX "AlertSubscription_status_frequency_idx" ON "AlertSubscription"("status", "frequency");
CREATE INDEX "AlertSubscription_confirmation_token_hash_idx" ON "AlertSubscription"("confirmation_token_hash");
