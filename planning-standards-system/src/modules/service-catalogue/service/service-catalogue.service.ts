import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Service } from '../database/service.entity';
import { ServiceVersion } from '../database/service-version.entity';
import { IntakeField } from '../database/service-intake-field.entity';
import { NaFlag } from '../database/service-na-flag.entity';
import { ServiceStatus } from '../enums';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { CreateIntakeFieldDto } from '../dto/create-intake-field.dto';
import { UpdateIntakeFieldDto } from '../dto/update-intake-field.dto';
import { CreateNaFlagDto } from '../dto/create-na-flag.dto';
import { PaginationDto } from '../dto/pagination.dto';

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
  ) {}

  // ─── Services ───────────────────────────────────────────────────────────

  async findAll(
    office: string,
    filters: {
      classification?: string;
      status?: string;
      search?: string;
      include_archived?: boolean;
    },
    pagination: PaginationDto = new PaginationDto(),
  ): Promise<{ data: Service[]; total: number; page: number; limit: number }> {
    const query = this.serviceRepo
      .createQueryBuilder('service')
      .leftJoinAndSelect(
        'service.na_flags',
        'na_flag',
        'na_flag.removed_at IS NULL',
      )
      .where('service.office = :office', { office });

    if (!filters.include_archived) {
      query.andWhere('service.status = :status', { status: ServiceStatus.ACTIVE });
    }

    if (filters.classification) {
      query.andWhere('service.classification = :classification', {
        classification: filters.classification,
      });
    }

    if (filters.status && filters.include_archived) {
      query.andWhere('service.status = :statusFilter', {
        statusFilter: filters.status,
      });
    }

    if (filters.search) {
      query.andWhere('LOWER(service.name) LIKE LOWER(:search)', {
        search: `%${filters.search}%`,
      });
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

  async findOne(id: string, office: string): Promise<Service> {
    return this.findOneOrFail(id, office);
  }

  async create(office: string, dto: CreateServiceDto, actor: string): Promise<Service> {
    const exists = await this.serviceRepo.findOne({
      where: { office, name: dto.name },
    });
    if (exists) {
      throw new ConflictException(`Service "${dto.name}" already exists in this office`);
    }
    const service = this.serviceRepo.create({ ...dto, office, created_by: actor });
    return this.serviceRepo.save(service);
  }

  /**
   * Update a service and log per-field audit rows.
   * Each changed field produces one service_version row.
   */
  async update(
    id: string,
    office: string,
    dto: UpdateServiceDto,
    actor: string,
  ): Promise<Service> {
    const service = await this.findOneOrFail(id, office);

    const trackedFields = [
      'name', 'classification', 'sla_target_value', 'sla_target_unit',
      'responsible_unit', 'required_documents', 'processing_steps', 'expected_output',
    ];

    // Build per-field audit rows
    const versionRows: Partial<ServiceVersion>[] = [];
    for (const field of trackedFields) {
      if (dto[field] !== undefined) {
        const oldVal = service[field];
        const newVal = dto[field];
        const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
        if (changed) {
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
      await this.versionRepo.save(
        versionRows.map((row) => this.versionRepo.create(row)),
      );
    }

    Object.assign(service, dto);
    return this.serviceRepo.save(service);
  }

  async archive(id: string, office: string, actor: string): Promise<Service> {
    const service = await this.findOneOrFail(id, office);

    if (service.status === ServiceStatus.ARCHIVED) {
      throw new ConflictException('Service is already archived');
    }

    service.status = ServiceStatus.ARCHIVED;
    service.archived_at = new Date();
    service.archived_by = actor;
    return this.serviceRepo.save(service);
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

    // Log status change
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

  // ─── Intake Fields ──────────────────────────────────────────────────────

  async getIntakeFields(service_id: string, office: string): Promise<IntakeField[]> {
    await this.findOneOrFail(service_id, office);
    return this.intakeFieldRepo.find({
      where: { service_id, is_active: true },
      order: { display_order: 'ASC' },
    });
  }

  async createIntakeField(
    service_id: string,
    office: string,
    dto: CreateIntakeFieldDto,
  ): Promise<IntakeField> {
    await this.findOneOrFail(service_id, office);
    const field = this.intakeFieldRepo.create({ ...dto, service_id });
    return this.intakeFieldRepo.save(field);
  }

  async updateIntakeField(
    service_id: string,
    office: string,
    field_id: string,
    dto: UpdateIntakeFieldDto,
  ): Promise<IntakeField> {
    await this.findOneOrFail(service_id, office);
    const field = await this.intakeFieldRepo.findOne({
      where: { id: field_id, service_id, is_active: true },
    });
    if (!field) throw new NotFoundException(`Intake field ${field_id} not found`);
    Object.assign(field, dto);
    return this.intakeFieldRepo.save(field);
  }

  async removeIntakeField(
    service_id: string,
    office: string,
    field_id: string,
  ): Promise<{ message: string }> {
    await this.findOneOrFail(service_id, office);
    const field = await this.intakeFieldRepo.findOne({
      where: { id: field_id, service_id },
    });
    if (!field) throw new NotFoundException(`Intake field ${field_id} not found`);
    field.is_active = false;
    await this.intakeFieldRepo.save(field);
    return { message: `Intake field ${field_id} deactivated` };
  }

  // ─── NA Flags ───────────────────────────────────────────────────────────

  async createNaFlag(
    service_id: string,
    office: string,
    dto: CreateNaFlagDto,
    actor: string,
  ): Promise<NaFlag> {
    await this.findOneOrFail(service_id, office);
    const exists = await this.naFlagRepo.findOne({
      where: { service_id, period_id: dto.period_id, removed_at: IsNull() },
    });
    if (exists) throw new ConflictException('NA flag already exists for this period');
    const flag = this.naFlagRepo.create({ ...dto, service_id, flagged_by: actor });
    return this.naFlagRepo.save(flag);
  }

  async getNaFlags(service_id: string, office: string): Promise<NaFlag[]> {
    await this.findOneOrFail(service_id, office);
    return this.naFlagRepo.find({ where: { service_id } });
  }

  async removeNaFlag(
    service_id: string,
    office: string,
    flag_id: string,
  ): Promise<{ message: string }> {
    await this.findOneOrFail(service_id, office);
    const flag = await this.naFlagRepo.findOne({
      where: { id: flag_id, service_id },
    });
    if (!flag) throw new NotFoundException(`NA flag ${flag_id} not found`);
    flag.removed_at = new Date();
    await this.naFlagRepo.save(flag);
    return { message: `NA flag ${flag_id} lifted` };
  }

  // ─── Internal ───────────────────────────────────────────────────────────

  private async findOneOrFail(id: string, office: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    if (service.office !== office) {
      throw new ForbiddenException('You cannot access services from another office');
    }
    return service;
  }
}