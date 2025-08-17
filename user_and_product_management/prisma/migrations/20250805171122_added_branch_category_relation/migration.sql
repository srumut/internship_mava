-- CreateTable
CREATE TABLE "branch_categories" (
    "category_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,

    PRIMARY KEY ("category_id", "branch_id"),
    CONSTRAINT "branch_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branch_categories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
