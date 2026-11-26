import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCustomerNameColumn1722394562000
  implements MigrationInterface
{
  name = "UpdateCustomerNameColumn1722394562000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First check if the name column exists
    const columnExists = await queryRunner.hasColumn("customers", "name");

    if (!columnExists) {
      // Add name column as nullable first
      await queryRunner.query(
        `ALTER TABLE "customers" ADD "name" varchar(100)`
      );

      // Update existing rows to set name to a default value where it's NULL
      await queryRunner.query(`
                UPDATE "customers"
                SET "name" = 'Customer ' || id::text
                WHERE "name" IS NULL
            `);

      // Now make the column NOT NULL after all rows have values
      await queryRunner.query(
        `ALTER TABLE "customers" ALTER COLUMN "name" SET NOT NULL`
      );
    } else {
      // Column already exists, just ensure all records have a value
      await queryRunner.query(`
                UPDATE "customers"
                SET "name" = 'Customer ' || id::text
                WHERE "name" IS NULL
            `);

      // Now make the column NOT NULL if it isn't already
      await queryRunner.query(
        `ALTER TABLE "customers" ALTER COLUMN "name" SET NOT NULL`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // If needed to revert, make the column nullable again
    await queryRunner.query(
      `ALTER TABLE "customers" ALTER COLUMN "name" DROP NOT NULL`
    );
  }
}
