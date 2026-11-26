import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class CreateStockTransactions1720000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "stock_transactions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "product_id",
            type: "uuid",
          },
          {
            name: "organization_id",
            type: "uuid",
          },
          {
            name: "previous_quantity",
            type: "int",
            default: 0,
          },
          {
            name: "new_quantity",
            type: "int",
            default: 0,
          },
          {
            name: "change_amount",
            type: "int",
          },
          {
            name: "transaction_type",
            type: "varchar",
            length: "50",
          },
          {
            name: "reference_type",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "reference_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "notes",
            type: "text",
            isNullable: true,
          },
          {
            name: "created_by",
            type: "uuid",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true
    );

    // Add indexes
    await queryRunner.createIndex(
      "stock_transactions",
      new TableIndex({
        name: "IDX_STOCK_TRX_PRODUCT",
        columnNames: ["product_id"],
      })
    );

    await queryRunner.createIndex(
      "stock_transactions",
      new TableIndex({
        name: "IDX_STOCK_TRX_ORGANIZATION",
        columnNames: ["organization_id"],
      })
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      "stock_transactions",
      new TableForeignKey({
        columnNames: ["product_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "products",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "stock_transactions",
      new TableForeignKey({
        columnNames: ["organization_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "organizations",
      })
    );

    await queryRunner.createForeignKey(
      "stock_transactions",
      new TableForeignKey({
        columnNames: ["created_by"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("stock_transactions");
  }
}
