ALTER TABLE "AlertSubscription"
ADD COLUMN "tco_alerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "tco_pro_interest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "last_tco_alert_cutoff" TEXT;

CREATE INDEX "AlertSubscription_status_tco_alerts_idx"
ON "AlertSubscription"("status", "tco_alerts");
