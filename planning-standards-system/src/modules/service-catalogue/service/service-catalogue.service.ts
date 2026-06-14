import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Service } from '../database/service.entity';
import { ServiceVersion } from '../database/service-version.entity';
import { IntakeField } from '../database/service-intake-field.entity';
import { NaFlag } from '../database/service-na-flag.entity';
import { ServiceStatus, ReferralStatus } from '../enums';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { CreateIntakeFieldDto } from '../dto/create-intake-field.dto';
import { UpdateIntakeFieldDto } from '../dto/update-intake-field.dto';
import { CreateNaFlagDto } from '../dto/create-na-flag.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { RequestContext } from '../../../common/context/request-context';

@Injectable()
export class ServiceCatalogueService {
    constructor(
        @InjectRepository(Service, 'catalogue_db')
        private readonly serviceRepo: Repository<Service>,

        @InjectRepository(ServiceVersion, 'catalogue_db')
        private readonly versionRepo: Repository<ServiceVersion>,

        @InjectRepository(IntakeField, 'catalogue_db')
        private readonly intakeFieldRepo: Repository<IntakeField>,

        @InjectRepository(NaFlag, 'catalogue_db')
        private readonly naFlagRepo: Repository<NaFlag>,

        private readonly http: HttpService,
        private readonly config: ConfigService,
    ) { }

    async findAll(
        office: string,
        filters: {
            classification?: string;
            status?: string;
            search?: string;
            include_archived?: boolean;
            period_id?: string;
        },
        pagination: PaginationDto = new PaginationDto(),
        role: string = 'Admin',
        isCrossOffice: boolean = false,
    ): Promise<{ data: Service[]; total: number; page: number; limit: number }> {
        const query = this.serviceRepo
            .createQueryBuilder('service')
            .leftJoinAndSelect('service.na_flags', 'na_flag', 'na_flag.removed_at IS NULL');

        // Cross-office roles (SUPER_ADMIN, OPCR_EVALUATOR) see services across
        // all offices. Everyone else is scoped to their own office.
        if (isCrossOffice) {
            query.where('1=1');
        } else {
            query.where('service.office = :office', { office });
        }

        // Task 2: Staff role auto-filters inactive and N/A services
        if (role === 'Staff') {
            query.andWhere('service.status = :activeStatus', { activeStatus: ServiceStatus.ACTIVE });
            query.andWhere('NOT EXISTS (SELECT 1 FROM na_flag nf WHERE nf.service_id = service.id AND nf.removed_at IS NULL)');
        } else {
            if (!filters.include_archived) {
                query.andWhere('service.status = :status', { status: ServiceStatus.ACTIVE });
            }

            if (filters.classification) {
                query.andWhere('service.classification = :classification', { classification: filters.classification });
            }

            if (filters.status && filters.include_archived) {
                query.andWhere('service.status = :statusFilter', { statusFilter: filters.status });
            }
        }

        if (filters.search) {
            query.andWhere('LOWER(service.name) LIKE LOWER(:search)', { search: `%${filters.search}%` });
        }

        const allowedSortFields = ['name', 'classification', 'status', 'created_at', 'sla_target_value'];
        const sortBy = allowedSortFields.includes(pagination.sort_by) ? pagination.sort_by : 'created_at';

        const [data, total] = await query
            .orderBy(`service.${sortBy}`, pagination.sort_order)
            .skip((pagination.page - 1) * pagination.limit)
            .take(pagination.limit)
            .getManyAndCount();

        return { data, total, page: pagination.page, limit: pagination.limit };
    }

    async findOne(id: string, office: string, isCrossOffice: boolean = false): Promise<Service> {
        return this.findOneOrFail(id, office, isCrossOffice);
    }

    async create(office: string, dto: CreateServiceDto, actor: string): Promise<Service> {
        const exists = await this.serviceRepo.findOne({
            where: { office, name: dto.name, with_referral: dto.with_referral ?? ReferralStatus.WITH },
        });
        if (exists) {
            throw new ConflictException(
                `Service "${dto.name}" with the same referral status already exists in this office`,
            );
        }
        const service = this.serviceRepo.create({ ...dto, office, created_by: actor });
        const saved = await this.serviceRepo.save(service);
        this.logAudit({
            event: 'SERVICE_CREATED',
            actor_id: actor,
            office_id: office,
            target_entity: 'service',
            target_id: saved.id,
        });
        return saved;
    }

    async update(id: string, office: string, dto: UpdateServiceDto, actor: string): Promise<Service> {
        const service = await this.findOneOrFail(id, office);

        const trackedFields = [
            'name', 'classification', 'sla_target_value', 'sla_target_unit',
            'responsible_unit', 'required_documents', 'processing_steps', 'expected_output',
        ];

        const versionRows: Partial<ServiceVersion>[] = [];
        for (const field of trackedFields) {
            if (dto[field] !== undefined) {
                const oldVal = service[field];
                const newVal = dto[field];
                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    versionRows.push({
                        service_id: service.id,
                        field_changed: field,
                        old_value: oldVal != null ? JSON.stringify(oldVal) : null,
                        new_value: newVal != null ? JSON.stringify(newVal) : null,
                        changed_by: actor,
                    });
                }
            }
        }

        if (versionRows.length > 0) {
            await this.versionRepo.save(versionRows.map((row) => this.versionRepo.create(row)));
        }

        const slaChanged = dto.sla_target_value !== undefined && service.sla_target_value !== dto.sla_target_value;

        Object.assign(service, dto);
        const saved = await this.serviceRepo.save(service);

        this.logAudit({
            event: 'SERVICE_UPDATED',
            actor_id: actor,
            office_id: office,
            target_entity: 'service',
            target_id: saved.id,
        });

        if (slaChanged) {
            this.logAudit({
                event: 'SERVICE_SLA_UPDATED',
                actor_id: actor,
                office_id: office,
                target_entity: 'service',
                target_id: saved.id,
                metadata: { new_sla: dto.sla_target_value },
            });
        }
        return saved;
    }

    async archive(id: string, office: string, actor: string): Promise<Service> {
        const service = await this.findOneOrFail(id, office);
        if (service.status === ServiceStatus.ARCHIVED) {
            throw new ConflictException('Service is already archived');
        }
        service.status = ServiceStatus.ARCHIVED;
        service.archived_at = new Date();
        service.archived_by = actor;
        const saved = await this.serviceRepo.save(service);
        this.logAudit({
            event: 'SERVICE_ARCHIVED',
            actor_id: actor,
            office_id: office,
            target_entity: 'service',
            target_id: saved.id,
        });
        return saved;
    }

    async activate(id: string, office: string, actor: string): Promise<Service> {
        const service = await this.findOneOrFail(id, office);
        if (service.status === ServiceStatus.ACTIVE) {
            throw new ConflictException('Service is already active');
        }
        const oldStatus = service.status;
        service.status = ServiceStatus.ACTIVE;
        service.archived_at = null;
        service.archived_by = null;
        await this.versionRepo.save(
            this.versionRepo.create({
                service_id: service.id,
                field_changed: 'status',
                old_value: oldStatus,
                new_value: ServiceStatus.ACTIVE,
                changed_by: actor,
            }),
        );
        return this.serviceRepo.save(service);
    }

    async deactivate(id: string, office: string, actor: string): Promise<Service> {
        const service = await this.findOneOrFail(id, office);
        if (service.status === ServiceStatus.INACTIVE) {
            throw new ConflictException('Service is already inactive');
        }
        const oldStatus = service.status;
        service.status = ServiceStatus.INACTIVE;
        await this.versionRepo.save(
            this.versionRepo.create({
                service_id: service.id,
                field_changed: 'status',
                old_value: oldStatus,
                new_value: ServiceStatus.INACTIVE,
                changed_by: actor,
            }),
        );
        return this.serviceRepo.save(service);
    }

    async getIntakeFields(service_id: string, office: string): Promise<IntakeField[]> {
        await this.findOneOrFail(service_id, office);
        return this.intakeFieldRepo.find({
            where: { service_id, is_active: true },
            order: { display_order: 'ASC' },
        });
    }

    async createIntakeField(service_id: string, office: string, dto: CreateIntakeFieldDto): Promise<IntakeField> {
        await this.findOneOrFail(service_id, office);

        const exists = await this.intakeFieldRepo.findOne({
            where: { service_id, label: dto.label, field_type: dto.field_type, is_active: true },
        });
        if (exists) {
            throw new ConflictException(
                `Intake field "${dto.label}" of type "${dto.field_type}" already exists for this service`,
            );
        }

        const field = this.intakeFieldRepo.create({ ...dto, service_id });
        return this.intakeFieldRepo.save(field);
    }

    async updateIntakeField(service_id: string, office: string, field_id: string, dto: UpdateIntakeFieldDto): Promise<IntakeField> {
        await this.findOneOrFail(service_id, office);
        const field = await this.intakeFieldRepo.findOne({ where: { id: field_id, service_id, is_active: true } });
        if (!field) throw new NotFoundException(`Intake field ${field_id} not found`);
        Object.assign(field, dto);
        return this.intakeFieldRepo.save(field);
    }

    async removeIntakeField(service_id: string, office: string, field_id: string): Promise<{ message: string }> {
        await this.findOneOrFail(service_id, office);
        const field = await this.intakeFieldRepo.findOne({ where: { id: field_id, service_id } });
        if (!field) throw new NotFoundException(`Intake field ${field_id} not found`);
        field.is_active = false;
        await this.intakeFieldRepo.save(field);
        return { message: `Intake field ${field_id} deactivated` };
    }

    async createNaFlag(service_id: string, office: string, dto: CreateNaFlagDto, actor: string): Promise<NaFlag> {
        await this.findOneOrFail(service_id, office);

        if (!dto.reason || dto.reason.trim().length === 0) {
            throw new BadRequestException('reason is required and cannot be blank');
        }

        // Block if service is part of a Locked commitment for this period (HTTP 422)
        try {
            const commitmentUrl = this.config.get<string>('COMMITMENT_URL') || 'http://localhost:3002';
            const response = await firstValueFrom(
                this.http.get(`${commitmentUrl}/api/commitments`, {
                    headers: { 'x-office': office },
                    params: { period_id: dto.period_id, status: 'Locked' },
                }),
            );
            const commitments = response.data?.data ?? response.data ?? [];
            const isLocked = commitments.some((c: any) =>
                c.items?.some((item: any) => item.service_id === service_id),
            );
            if (isLocked) {
                throw new UnprocessableEntityException(
                    'Cannot flag this service as N/A — it is already part of a Locked commitment for this period.',
                );
            }
        } catch (err) {
            if (err instanceof UnprocessableEntityException) throw err;
        }

        const exists = await this.naFlagRepo.findOne({
            where: { service_id, period_id: dto.period_id, removed_at: IsNull() },
        });
        if (exists) throw new ConflictException('NA flag already exists for this period');

        const flag = this.naFlagRepo.create({ ...dto, service_id, flagged_by: actor });
        const saved = await this.naFlagRepo.save(flag);
        this.logAudit({
            event: 'SERVICE_NA_FLAGGED',
            actor_id: actor,
            office_id: office,
            target_entity: 'na_flag',
            target_id: saved.id,
            metadata: { service_id, reason: dto.reason },
        });
        return saved;
    }

    async getNaFlags(service_id: string, office: string): Promise<NaFlag[]> {
        await this.findOneOrFail(service_id, office);
        return this.naFlagRepo.find({ where: { service_id } });
    }

    async getNaFlagsByOfficeAndPeriod(office: string, period_id: string): Promise<NaFlag[]> {
        return this.naFlagRepo
            .createQueryBuilder('nf')
            .innerJoin('nf.service', 'service')
            .where('service.office = :office', { office })
            .andWhere('nf.period_id = :period_id', { period_id })
            .andWhere('nf.removed_at IS NULL')
            .getMany();
    }

    async removeNaFlag(service_id: string, office: string, flag_id: string): Promise<{ message: string }> {
        await this.findOneOrFail(service_id, office);
        const flag = await this.naFlagRepo.findOne({ where: { id: flag_id, service_id } });
        if (!flag) throw new NotFoundException(`NA flag ${flag_id} not found`);
        flag.removed_at = new Date();
        await this.naFlagRepo.save(flag);
        return { message: `NA flag ${flag_id} lifted` };
    }

    // Task 3: Unflag endpoint — remove active N/A flag for a service for a given period
    async unflagService(service_id: string, office: string, period_id: string): Promise<{ message: string }> {
        await this.findOneOrFail(service_id, office);

        if (!period_id) {
            throw new BadRequestException('period_id query param is required');
        }

        const flag = await this.naFlagRepo.findOne({
            where: { service_id, period_id, removed_at: IsNull() },
        });

        if (!flag) throw new NotFoundException(`No active N/A flag found for this service and period`);

        flag.removed_at = new Date();
        await this.naFlagRepo.save(flag);

        return { message: `N/A flag removed for service ${service_id}` };
    }

    // Bulk remove all N/A flags for a period — called when a period is completed
    async removeNaFlagsByPeriod(period_id: string): Promise<{ removed: number }> {
        const flags = await this.naFlagRepo.find({
            where: { period_id, removed_at: IsNull() },
        });

        if (flags.length === 0) return { removed: 0 };

        const now = new Date();
        for (const flag of flags) {
            flag.removed_at = now;
        }
        await this.naFlagRepo.save(flags);

        return { removed: flags.length };
    }

    private async findOneOrFail(id: string, office: string, isCrossOffice: boolean = false): Promise<Service> {
        const service = await this.serviceRepo.findOne({ where: { id } });
        if (!service) throw new NotFoundException(`Service ${id} not found`);
        if (!isCrossOffice && service.office !== office) {
            throw new ForbiddenException('You cannot access services from another office');
        }
        return service;
    }

    private logAudit(payload: {
        event: string;
        actor_id: string;
        office_id: string;
        target_entity?: string;
        target_id?: string;
        metadata?: any;
    }) {
        const url = this.config.get<string>('COMMITMENT_URL') || 'http://localhost:4002';
        const ctx = RequestContext.get();
        this.http.post(`${url}/api/audit-events`, {
            ...payload,
            actor_role: ctx?.actorRole,
            actor_username: ctx?.actorUsername,
            ip_address: ctx?.clientIp,
            service_name: 'pss-service-catalogue',
        }, {
            headers: { 'x-office': payload.office_id, 'x-role': 'Admin' },
        }).subscribe({
            error: (err) => console.error('Failed to send audit log:', err.message),
        });
    }
}