import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateSaleNotificationSettingsToRecipients1700000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Se existir configuração antiga, migrar para registros individuais
    const rows = await queryRunner.query(
      `SELECT recipient_emails, active FROM sale_notification_settings ORDER BY updated_at DESC LIMIT 1`
    );

    if (!rows || rows.length === 0) {
      return;
    }

    const { recipient_emails, active } = rows[0] || {};
    if (!recipient_emails) {
      return;
    }

    const emails = String(recipient_emails)
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);

    for (const email of emails) {
      await queryRunner.query(
        `INSERT INTO sale_notification_recipients (id, email, active, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (email) DO NOTHING`,
        [email, active !== undefined ? active : true]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover todos os recipients migrados
    await queryRunner.query(`DELETE FROM sale_notification_recipients`);
  }
}

