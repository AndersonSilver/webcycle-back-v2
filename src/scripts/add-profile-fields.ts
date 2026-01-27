import { AppDataSource } from '../config/database.config';

async function addProfileFields() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const queryRunner = AppDataSource.createQueryRunner();
    
    await queryRunner.query(`
      DO $$ 
      BEGIN
          -- Telefone
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'phone') THEN
              ALTER TABLE users ADD COLUMN phone VARCHAR;
              RAISE NOTICE 'Coluna phone adicionada';
          ELSE
              RAISE NOTICE 'Coluna phone já existe';
          END IF;

          -- Documento
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'document') THEN
              ALTER TABLE users ADD COLUMN document VARCHAR;
              RAISE NOTICE 'Coluna document adicionada';
          ELSE
              RAISE NOTICE 'Coluna document já existe';
          END IF;

          -- Endereço - Rua
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_street') THEN
              ALTER TABLE users ADD COLUMN address_street VARCHAR;
              RAISE NOTICE 'Coluna address_street adicionada';
          ELSE
              RAISE NOTICE 'Coluna address_street já existe';
          END IF;

          -- Endereço - Número
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_number') THEN
              ALTER TABLE users ADD COLUMN address_number VARCHAR;
              RAISE NOTICE 'Coluna address_number adicionada';
          ELSE
              RAISE NOTICE 'Coluna address_number já existe';
          END IF;

          -- Endereço - Complemento
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_complement') THEN
              ALTER TABLE users ADD COLUMN address_complement VARCHAR;
              RAISE NOTICE 'Coluna address_complement adicionada';
          ELSE
              RAISE NOTICE 'Coluna address_complement já existe';
          END IF;

          -- Endereço - Bairro
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_neighborhood') THEN
              ALTER TABLE users ADD COLUMN address_neighborhood VARCHAR;
              RAISE NOTICE 'Coluna address_neighborhood adicionada';
          ELSE
              RAISE NOTICE 'Coluna address_neighborhood já existe';
          END IF;

          -- Endereço - Cidade
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_city') THEN
              ALTER TABLE users ADD COLUMN address_city VARCHAR;
              RAISE NOTICE 'Coluna address_city adicionada';
          ELSE
              RAISE NOTICE 'Coluna address_city já existe';
          END IF;

          -- Endereço - Estado
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_state') THEN
              ALTER TABLE users ADD COLUMN address_state VARCHAR;
              RAISE NOTICE 'Coluna address_state adicionada';
          ELSE
              RAISE NOTICE 'Coluna address_state já existe';
          END IF;

          -- Endereço - CEP
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_zip_code') THEN
              ALTER TABLE users ADD COLUMN address_zip_code VARCHAR;
              RAISE NOTICE 'Coluna address_zip_code adicionada';
          ELSE
              RAISE NOTICE 'Coluna address_zip_code já existe';
          END IF;
      END $$;
    `);

    console.log('✅ Campos de perfil adicionados com sucesso!');
    await queryRunner.release();
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar campos:', error);
    process.exit(1);
  }
}

addProfileFields();

