import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProofOfDeliveryToTracking1700000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'shipping_trackings',
      new TableColumn({
        name: 'proof_of_delivery_url',
        type: 'varchar',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('shipping_trackings', 'proof_of_delivery_url');
  }
}

