import { MigrationInterface, QueryRunner } from "typeorm";

export class InitBaseline1788238812643 implements MigrationInterface {
    name = 'InitBaseline1788238812643'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "service_modes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_919c37f8b0566c87b380c56a7c9" UNIQUE ("name"), CONSTRAINT "PK_2ea5096199142285f61b7963f30" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "service_service_modes" ("service_id" uuid NOT NULL, "mode_id" uuid NOT NULL, CONSTRAINT "PK_df5724a2d06a979d9763059c76d" PRIMARY KEY ("service_id", "mode_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bc5157e37742869304d0b56855" ON "service_service_modes"  ("service_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e690d8f0143280dfd00e1ae0c8" ON "service_service_modes"  ("mode_id") `);
        await queryRunner.query(`ALTER TABLE "service" ADD "service_mode" character varying(150)`);
        await queryRunner.query(`CREATE TYPE "public"."service_with_referral_enum" AS ENUM('With', 'Without', 'N/A')`);
        await queryRunner.query(`ALTER TABLE "service" ADD "with_referral" "public"."service_with_referral_enum" NOT NULL DEFAULT 'With'`);
        await queryRunner.query(`ALTER TABLE "service" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX "public"."idx_service_classification"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "classification"`);
        await queryRunner.query(`DROP TYPE "public"."service_classification_enum"`);
        await queryRunner.query(`ALTER TABLE "service" ADD "classification" character varying(150)`);
        await queryRunner.query(`CREATE INDEX "idx_service_mode" ON "service"  ("service_mode") `);
        await queryRunner.query(`CREATE INDEX "idx_service_classification" ON "service"  ("classification") `);
        await queryRunner.query(`ALTER TABLE "service" ADD CONSTRAINT "uq_service_office_name_mode" UNIQUE ("office", "name", "service_mode")`);
        await queryRunner.query(`ALTER TABLE "service_service_modes" ADD CONSTRAINT "FK_bc5157e37742869304d0b568550" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "service_service_modes" ADD CONSTRAINT "FK_e690d8f0143280dfd00e1ae0c8f" FOREIGN KEY ("mode_id") REFERENCES "service_modes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_service_modes" DROP CONSTRAINT "FK_e690d8f0143280dfd00e1ae0c8f"`);
        await queryRunner.query(`ALTER TABLE "service_service_modes" DROP CONSTRAINT "FK_bc5157e37742869304d0b568550"`);
        await queryRunner.query(`ALTER TABLE "service" DROP CONSTRAINT "uq_service_office_name_mode"`);
        await queryRunner.query(`DROP INDEX "public"."idx_service_classification"`);
        await queryRunner.query(`DROP INDEX "public"."idx_service_mode"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "classification"`);
        await queryRunner.query(`CREATE TYPE "public"."service_classification_enum" AS ENUM('Simple', 'Complex', 'Highly Technical')`);
        await queryRunner.query(`ALTER TABLE "service" ADD "classification" "public"."service_classification_enum" NOT NULL DEFAULT 'Simple'`);
        await queryRunner.query(`CREATE INDEX "idx_service_classification" ON "service" USING btree ("classification") `);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "with_referral"`);
        await queryRunner.query(`DROP TYPE "public"."service_with_referral_enum"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "service_mode"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e690d8f0143280dfd00e1ae0c8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bc5157e37742869304d0b56855"`);
        await queryRunner.query(`DROP TABLE "service_service_modes"`);
        await queryRunner.query(`DROP TABLE "service_modes"`);
    }

}
