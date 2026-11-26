import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";
import { BillType } from "../entities/bill.entity";

export class AddBillNumberColumn1717151100000 implements MigrationInterface {
  name = "AddBillNumberColumn1717151100000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column exists before trying to add it
    const bills = await queryRunner.getTable("bills");
    const billNumberColumn = bills?.findColumnByName("billNumber");

    if (!billNumberColumn) {
      // Only add the column if it doesn't exist
      await queryRunner.addColumn(
        "bills",
        new TableColumn({
          name: "billNumber",
          type: "varchar",
          isNullable: true,
        })
      );
      console.log("Added billNumber column to bills table");
    } else {
      console.log("billNumber column already exists, skipping");
    }

    // 2. Fetch all existing bills
    const existingBills = await queryRunner.query(
      `SELECT id, "billType", "issueDate", "organizationId" FROM "bills"`
    );

    // 3. Update each bill with a generated bill number
    for (const bill of existingBills) {
      const prefix = bill.billType === BillType.SALES ? "S" : "P";
      const issueDate = new Date(bill.issueDate);
      const year = issueDate.getFullYear();
      const month = String(issueDate.getMonth() + 1).padStart(2, "0");

      // Format: [S/P]-YYYYMM-XXXX (e.g., S-202405-0001)
      const yearMonthPrefix = `${prefix}-${year}${month}-`;

      // Get current max sequence number for this type and month
      const maxResult = await queryRunner.query(
        `SELECT MAX(CAST(SUBSTRING("billNumber" FROM '${yearMonthPrefix}(\\d+)') AS INTEGER)) as max_seq 
                 FROM "bills" 
                 WHERE "billNumber" LIKE '${yearMonthPrefix}%' AND "organizationId" = $1`,
        [bill.organizationId]
      );

      let sequenceNumber = 1;
      if (maxResult && maxResult.length > 0 && maxResult[0].max_seq) {
        sequenceNumber = parseInt(maxResult[0].max_seq) + 1;
      }

      // Format with leading zeros
      const billNumber = `${yearMonthPrefix}${String(sequenceNumber).padStart(
        4,
        "0"
      )}`;

      // Update the bill
      await queryRunner.query(
        `UPDATE "bills" SET "billNumber" = $1 WHERE id = $2`,
        [billNumber, bill.id]
      );
    }

    // 4. Now make the column NOT NULL
    await queryRunner.query(
      `ALTER TABLE "bills" ALTER COLUMN "billNumber" SET NOT NULL`
    );

    // 5. Add unique constraint if needed
    await queryRunner.query(
      `ALTER TABLE "bills" ADD CONSTRAINT "UQ_bills_billNumber" UNIQUE ("billNumber")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if the column exists before trying to drop it
    const bills = await queryRunner.getTable("bills");
    const billNumberColumn = bills?.findColumnByName("billNumber");

    if (billNumberColumn) {
      await queryRunner.dropColumn("bills", "billNumber");
    }

    // Remove the unique constraint first
    await queryRunner.query(
      `ALTER TABLE "bills" DROP CONSTRAINT "UQ_bills_billNumber"`
    );
  }
}
