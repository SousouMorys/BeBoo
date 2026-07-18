-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ReadingLevel" AS ENUM ('pre_reader', 'beginner', 'reader');

-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('writing', 'drawing', 'voicing', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "Animation" AS ENUM ('zoom_in', 'zoom_out', 'pan_lr', 'none');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('image', 'audio');

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "pinHash" TEXT NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "pronoun" TEXT NOT NULL,
    "readingLevel" "ReadingLevel" NOT NULL,
    "interests" JSONB NOT NULL,
    "companion" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "sheetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "situationCategory" TEXT NOT NULL,
    "situationText" TEXT NOT NULL,
    "characterBlock" TEXT NOT NULL,
    "bridgeQuestion" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "checkIns" BOOLEAN NOT NULL,
    "status" "StoryStatus" NOT NULL DEFAULT 'writing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "animation" "Animation" NOT NULL,
    "imageId" TEXT,
    "audioId" TEXT,
    "timings" JSONB,
    "checkIn" JSONB,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInResult" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "childId" TEXT NOT NULL,
    "emotionId" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "attempt" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckInResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmotionStat" (
    "childId" TEXT NOT NULL,
    "emotionId" TEXT NOT NULL,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "missed" INTEGER NOT NULL DEFAULT 0,
    "confusions" JSONB NOT NULL,

    CONSTRAINT "EmotionStat_pkey" PRIMARY KEY ("childId","emotionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_storyId_index_key" ON "Page"("storyId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "Media_hash_key" ON "Media"("hash");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInResult" ADD CONSTRAINT "CheckInResult_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmotionStat" ADD CONSTRAINT "EmotionStat_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
