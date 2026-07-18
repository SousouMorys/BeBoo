-- CreateTable
CREATE TABLE "FeelingLog" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "emotionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeelingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeelingLog_childId_createdAt_idx" ON "FeelingLog"("childId", "createdAt");

-- AddForeignKey
ALTER TABLE "FeelingLog" ADD CONSTRAINT "FeelingLog_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
