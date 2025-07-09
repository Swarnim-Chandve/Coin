-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "coinAddress" TEXT NOT NULL,
    "zoraUrl" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL
);
