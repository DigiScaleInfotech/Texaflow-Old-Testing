import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSubscriptionPlanSchema1689067800000
  implements MigrationInterface
{
  name = "UpdateSubscriptionPlanSchema1689067800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update any existing records to have a default price of 0
    await queryRunner.query(`
      UPDATE "subscription_plans" 
      SET "price" = 0 
      WHERE "price" IS NULL
    `);

    // Then make the price column required with a default value
    await queryRunner.query(`
      ALTER TABLE "subscription_plans" 
      ALTER COLUMN "price" SET DEFAULT 0,
      ALTER COLUMN "price" TYPE numeric(10,2)
    `);

    // Set default values for other columns
    await queryRunner.query(`
      ALTER TABLE "subscription_plans" 
      ALTER COLUMN "billingCycle" SET DEFAULT 'monthly',
      ALTER COLUMN "isActive" SET DEFAULT true,
      ALTER COLUMN "durationMonths" SET DEFAULT 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the changes if needed
    await queryRunner.query(`
      ALTER TABLE "subscription_plans" 
      ALTER COLUMN "price" DROP DEFAULT,
      ALTER COLUMN "billingCycle" DROP DEFAULT,
      ALTER COLUMN "isActive" DROP DEFAULT,
      ALTER COLUMN "durationMonths" DROP DEFAULT
    `);
  }
}
