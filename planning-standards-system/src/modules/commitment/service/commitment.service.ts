import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Commitment } from '../database/commitment.entity';
import { CommitmentItem } from '../database/commitment-item.entity';
import { CommitmentVersion } from '../database/commitment-version.entity';
import { CommitmentStatus } from '../enums';
import { CreateCommitmentDto } from '../dto/create-commitment.dto';
import { UpdateCommitmentDto } from '../dto/update-commitment.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { AuditService } from './audit.service';

@Injectable()
export class CommitmentService {
    constructor(
        @InjectRepository(Commitment, 'commitment_db')
        private readonly commitmentRepo: Repository<Commitment>,

        @InjectRepository(CommitmentItem, 'commitment_db')
        private readonly itemRepo: Repository<CommitmentItem>,

        @InjectRepository(CommitmentVersion, 'commitment_db')
        private readonly versionRepo: Repository<CommitmentVersion>,

        private readonly http: HttpService,
        private readonly config: ConfigService,
        private readonly auditService: AuditService,
    ) { }

    private async validatePeriodExists(period_id: string): Promise<void> {
        const baseUrl = this.config.get<string>('KPI_SLA_URL');
        try {
            await firstValueFrom(
                this.http.get(`${baseUrl}/api/periods/${period_id}`),
            );
        } catch {
            throw new NotFoundException(`Period ${period_id} not found in kpi-sla service`);
        }
    }

    private async validateServiceExists(service_id: string, office: string): Promise<void> {
        const baseUrl = this.config.get<string>('SERVICE_CATALOGUE_URL');
        try {
            await firstValueFrom(
                this.http.get(`${baseUrl}/api/services/${service_id}`, {
                    headers: { 'x-mock-office': office },
                }),
            );
        } catch {
            throw new NotFoundException(`Service ${service_id} not found in service-catalogue`);
        }
    }

    private async validateKpiExists(kpi_id: string, office: string): Promise<void> {
        const baseUrl = this.config.get<string>('KPI_SLA_URL');
        try {
            await firstValueFrom(
                this.http.get(`${baseUrl}/api/kpis?include_inactive=false`, {
                    headers: { 'x-mock-office': office },
                }),
            );
        } catch {

        }
    }

    async createCommitment(
        office: string,
        actor: string,
        dto: CreateCommitmentDto,
    ): Promise<Commitment> {
        await this.validatePeriodExists(dto.period_id);

        const existingDraft = await this.commitmentRepo.findOne({
            where: { office, period_id: dto.period_id, status: CommitmentStatus.DRAFT },
        });

        if (existingDraft) {
            throw new ConflictException(
                `A Draft commitment already exists for this office and period (${existingDraft.id}). ` +
                `Update the existing draft instead.`,
            );
        }

        if (dto.items?.length > 0) {
            const invalidItems = dto.items
                .map((item, index) => ({ item, index }))
                .filter(({ item }) => item.target_value !== undefined && item.target_value !== null && item.target_value < 0);

            if (invalidItems.length > 0) {
                const failedIndexes = invalidItems.map(({ index }) => `item[${index}]`).join(', ');
                throw new BadRequestException(
                    `target_value must be a positive number. Invalid items: ${failedIndexes}`,
                );
            }
        }

        const commitment = this.commitmentRepo.create({
            office,
            period_id: dto.period_id,
            status: CommitmentStatus.DRAFT,
            version_number: 1,
            created_by: actor,
        });

        const saved = await this.commitmentRepo.save(commitment);

        if (dto.items?.length > 0) {
            const items = dto.items.map((itemDto) =>
                this.itemRepo.create({
                    commitment_id: saved.id,
                    service_id: itemDto.service_id,
                    kpi_id: itemDto.kpi_id,
                    target_value: itemDto.target_value ?? null,
                    unit: itemDto.unit,
                }),
            );
            await this.itemRepo.save(items);
        }

        this.auditService.log({
            event: 'COMMITMENT_CREATED',
            actor_id: actor,
            office_id: office,
            target_entity: 'commitment',
            target_id: saved.id,
            metadata: { period_id: dto.period_id, item_count: dto.items?.length ?? 0 },
        });

        return this.findOneCommitment(saved.id, office);
    }

    async findAllCommitments(
        office: string,
        filters: { period_id?: string; status?: string },
        pagination: PaginationDto = new PaginationDto(),
    ): Promise<{ data: Commitment[]; total: number; page: number; limit: number }> {
        const query = this.commitmentRepo
            .createQueryBuilder('commitment')
            .leftJoinAndSelect('commitment.items', 'items')
            .where('commitment.office = :office', { office });

        if (filters.period_id) {
            query.andWhere('commitment.period_id = :period_id', { period_id: filters.period_id });
        }
        if (filters.status) {
            query.andWhere('commitment.status = :status', { status: filters.status });
        }

        const allowedSortFields = ['created_at', 'updated_at', 'status', 'version_number'];
        const sortBy = allowedSortFields.includes(pagination.sort_by) ? pagination.sort_by : 'created_at';

        const [data, total] = await query
            .orderBy(`commitment.${sortBy}`, pagination.sort_order)
            .skip((pagination.page - 1) * pagination.limit)
            .take(pagination.limit)
            .getManyAndCount();

        return { data, total, page: pagination.page, limit: pagination.limit };
    }

    async findOneCommitment(id: string, office: string): Promise<Commitment> {
        const commitment = await this.commitmentRepo.findOne({
            where: { id },
            relations: { items: true, versions: true },
        });
        if (!commitment) throw new NotFoundException(`Commitment ${id} not found`);
        if (commitment.office !== office) {
            throw new ForbiddenException('You cannot access commitments from another office');
        }
        return commitment;
    }

    async updateCommitment(
        id: string,
        office: string,
        actor: string,
        dto: UpdateCommitmentDto,
    ): Promise<Commitment> {
        const commitment = await this.findOneCommitment(id, office);

        if (commitment.status === CommitmentStatus.LOCKED) {
            throw new ForbiddenException(
                'This commitment is locked and cannot be modified. Locked commitments are immutable.',
            );
        }

        if (dto.items?.length > 0) {
            const invalidItems = dto.items
                .map((item, index) => ({ item, index }))
                .filter(({ item }) => item.target_value !== undefined && item.target_value !== null && item.target_value < 0);

            if (invalidItems.length > 0) {
                const failedIndexes = invalidItems.map(({ index }) => `item[${index}]`).join(', ');
                throw new BadRequestException(
                    `target_value must be a positive number. Invalid items: ${failedIndexes}`,
                );
            }
        }

        await this.createVersionSnapshot(commitment, actor, 'Draft updated');

        if (dto.items) {
            await this.itemRepo.delete({ commitment_id: commitment.id });
            const items = dto.items.map((itemDto) =>
                this.itemRepo.create({
                    commitment_id: commitment.id,
                    service_id: itemDto.service_id,
                    kpi_id: itemDto.kpi_id,
                    target_value: itemDto.target_value ?? null,
                    unit: itemDto.unit,
                }),
            );
            await this.itemRepo.save(items);
        }

        commitment.version_number += 1;
        await this.commitmentRepo.save(commitment);

        return this.findOneCommitment(id, office);
    }

    async lockCommitment(id: string, office: string, actor: string): Promise<Commitment> {
        const commitment = await this.findOneCommitment(id, office);

        if (commitment.status === CommitmentStatus.LOCKED) {
            throw new ConflictException('This commitment is already locked.');
        }

        if (commitment.items.length === 0) {
            throw new BadRequestException(
                'Cannot lock: the commitment has no items. Add at least one service with a KPI target.',
            );
        }

        const invalidItems = commitment.items
            .map((item, index) => ({ item, index }))
            .filter(({ item }) =>
                item.target_value === null || item.target_value === undefined || item.target_value <= 0,
            );

        if (invalidItems.length > 0) {
            const failedDetails = invalidItems
                .map(({ item, index }) => `item[${index}] (service_id: ${item.service_id})`)
                .join(', ');
            throw new BadRequestException(
                `Cannot lock: ${invalidItems.length} item(s) have missing or invalid target values. ` +
                `Failed: ${failedDetails}`,
            );
        }

        await this.createVersionSnapshot(commitment, actor, 'Locked by admin');

        commitment.status = CommitmentStatus.LOCKED;
        commitment.locked_by = actor;
        commitment.locked_at = new Date();
        commitment.submitted_by = actor;
        commitment.submitted_at = new Date();
        commitment.version_number += 1;

        await this.commitmentRepo.save(commitment);

        this.auditService.log({
            event: 'COMMITMENT_LOCKED',
            actor_id: actor,
            office_id: office,
            target_entity: 'commitment',
            target_id: commitment.id,
            metadata: {
                period_id: commitment.period_id,
                locked_at: commitment.locked_at,
                item_count: commitment.items.length,
                source: 'PSS',
            },
        });

        return this.findOneCommitment(id, office);
    }

    async findLockedCommitments(
        office: string,
        pagination: PaginationDto = new PaginationDto(),
    ): Promise<{ data: Commitment[]; total: number; page: number; limit: number }> {
        return this.findAllCommitments(office, { status: CommitmentStatus.LOCKED }, pagination);
    }

    private async createVersionSnapshot(
        commitment: Commitment,
        actor: string,
        reason: string,
    ): Promise<CommitmentVersion> {
        const snapshot = {
            id: commitment.id,
            office: commitment.office,
            period_id: commitment.period_id,
            status: commitment.status,
            version_number: commitment.version_number,
            items: commitment.items?.map((item) => ({
                id: item.id,
                service_id: item.service_id,
                kpi_id: item.kpi_id,
                target_value: item.target_value,
                unit: item.unit,
            })) ?? [],
        };

        const version = this.versionRepo.create({
            commitment_id: commitment.id,
            version_number: commitment.version_number,
            status: commitment.status,
            revision_reason: reason,
            revised_by: actor,
            snapshot,
        });

        return this.versionRepo.save(version);
    }
}