import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCustomerNullNames1715145000000 implements MigrationInterface {
  name = "FixCustomerNullNames1715145000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update any NULL names to a placeholder value
    await queryRunner.query(`
            UPDATE "customers" 
            SET "name" = 'Customer ' || "id"::text 
            WHERE "name" IS NULL
        `);

    // Then make the column NOT NULL
    await queryRunner.query(`
            ALTER TABLE "customers" 
            ALTER COLUMN "name" SET NOT NULL
        `);

    console.log(
      "Successfully updated customers with NULL names and set NOT NULL constraint"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the NOT NULL constraint
    await queryRunner.query(`
            ALTER TABLE "customers" 
            ALTER COLUMN "name" DROP NOT NULL
        `);
  }
}
