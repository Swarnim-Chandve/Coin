/*
  Warnings:

  - You are about to alter the column `timestamp` on the `Memory` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "coinAddress" TEXT NOT NULL,
    "zoraUrl" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL
);
INSERT INTO "new_Memory" ("coinAddress", "description", "id", "image", "owner", "timestamp", "title", "zoraUrl") SELECT "coinAddress", "description", "id", "image", "owner", "timestamp", "title", "zoraUrl" FROM "Memory";
DROP TABLE "Memory";
ALTER TABLE "new_Memory" RENAME TO "Memory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
