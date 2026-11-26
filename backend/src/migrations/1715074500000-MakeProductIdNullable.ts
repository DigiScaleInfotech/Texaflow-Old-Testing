import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeProductIdNullable1715074500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bill_items" 
            ALTER COLUMN "productId" DROP NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bill_items" 
            ALTER COLUMN "productId" SET NOT NULL
        `);
  }
}
