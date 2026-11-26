import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerIdToBills1717153000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. First check if the column already exists
    const hasColumn = await queryRunner.hasColumn("bills", "customerId");

    if (!hasColumn) {
      // 2. Add the customerId column as nullable initially
      await queryRunner.query(`ALTER TABLE "bills" ADD "customerId" uuid`);

      // 3. Create an index on the new column for better query performance
      await queryRunner.query(
        `CREATE INDEX "IDX_bills_customerId" ON "bills" ("customerId")`
      );

      // 4. Get a default customer ID to use for existing records
      // Try to get one customer ID from the customer table
      const customerResult = await queryRunner.query(
        `SELECT id FROM "customers" LIMIT 1`
      );

      let defaultCustomerId = null;
      if (customerResult && customerResult.length > 0) {
        defaultCustomerId = customerResult[0].id;
      } else {
        // If no customers exist, create a default one
        const result = await queryRunner.query(
          `INSERT INTO "customers" ("name", "email", "createdAt", "updatedAt", "organizationId") 
           VALUES ('Default Customer', 'default@example.com', NOW(), NOW(), 
           (SELECT id FROM "organizations" LIMIT 1)) RETURNING "id"`
        );
        defaultCustomerId = result[0].id;
      }

      // 5. Update existing bills with the default customer ID
      if (defaultCustomerId) {
        await queryRunner.query(
          `UPDATE "bills" SET "customerId" = $1 WHERE "customerId" IS NULL`,
          [defaultCustomerId]
        );
      }

      // 6. Now make the column NOT NULL if needed
      // You can uncomment this once all bills have a customer ID
      // await queryRunner.query(`ALTER TABLE "bills" ALTER COLUMN "customerId" SET NOT NULL`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if the index exists and drop it
    const hasIndex = await queryRunner.query(
      `SELECT to_regclass('public."IDX_bills_customerId"')`
    );

    if (hasIndex[0].to_regclass) {
      await queryRunner.query(`DROP INDEX "IDX_bills_customerId"`);
    }

    // Check if the column exists and drop it
    const hasColumn = await queryRunner.hasColumn("bills", "customerId");
    if (hasColumn) {
      await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "customerId"`);
    }
  }
}
