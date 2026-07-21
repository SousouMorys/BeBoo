-- Preserve historic incorrect attempts without inventing a correct emotion.
-- New writes require this value at the API boundary; historic correct rows can
-- safely be backfilled because the selected emotion was the correct one.
ALTER TABLE "CheckInResult" ADD COLUMN "correctEmotionId" TEXT;

UPDATE "CheckInResult"
SET "correctEmotionId" = "emotionId"
WHERE "correct" = TRUE;

-- CreateTable
CREATE TABLE "ReadLog" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckInResult_childId_attempt_correctEmotionId_idx"
ON "CheckInResult"("childId", "attempt", "correctEmotionId");

-- CreateIndex
CREATE INDEX "CheckInResult_childId_correct_correctEmotionId_idx"
ON "CheckInResult"("childId", "correct", "correctEmotionId");

-- CreateIndex
CREATE INDEX "ReadLog_childId_createdAt_idx" ON "ReadLog"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "ReadLog_childId_storyId_idx" ON "ReadLog"("childId", "storyId");

-- AddForeignKey
ALTER TABLE "ReadLog" ADD CONSTRAINT "ReadLog_childId_fkey"
FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadLog" ADD CONSTRAINT "ReadLog_storyId_fkey"
FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
