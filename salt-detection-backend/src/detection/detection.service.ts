import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDetectionDto } from './dto/create-detection.dto';
import {
  DetectionFilterDto,
  PaginatedDetectionResponse,
} from './dto/detection-filter.dto';
import { Detection, BoundingBox } from '@prisma/client';

type DetectionWithBoxes = Detection & { boundingBoxes: BoundingBox[] };

@Injectable()
export class DetectionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDetectionDto): Promise<DetectionWithBoxes> {
    // classId 0 = impure, classId 1 = pure (matching Python model)
    const impureCount = dto.boundingBoxes.filter((b) => b.classId === 0).length;
    const pureCount = dto.boundingBoxes.filter((b) => b.classId === 1).length;
    const totalCount = dto.boundingBoxes.length;
    const purityPercentage = totalCount > 0 ? (pureCount / totalCount) * 100 : 100;

    return this.prisma.detection.create({
      data: {
        frameWidth: dto.frameWidth,
        frameHeight: dto.frameHeight,
        processingTimeMs: dto.processingTimeMs,
        pureCount,
        impureCount,
        totalCount,
        purityPercentage,
        sessionId: dto.sessionId,
        batchId: dto.batchId,
        roiPureCount: dto.roiPureCount ?? 0,
        roiImpureCount: dto.roiImpureCount ?? 0,
        roiTotalCount: dto.roiTotalCount ?? 0,
        roiPurityPercentage: dto.roiPurityPercentage,
        boundingBoxes: {
          create: dto.boundingBoxes.map((box) => ({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            classId: box.classId,
            className: box.className,
            confidence: box.confidence,
          })),
        },
      },
      include: {
        boundingBoxes: true,
      },
    });
  }

  async findAll(
    filter: DetectionFilterDto,
  ): Promise<PaginatedDetectionResponse<DetectionWithBoxes>> {
    const { page = 1, limit = 20, startDate, endDate, minPurity, maxPurity, sessionId } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    if (minPurity !== undefined || maxPurity !== undefined) {
      where.purityPercentage = {};
      if (minPurity !== undefined) where.purityPercentage.gte = minPurity;
      if (maxPurity !== undefined) where.purityPercentage.lte = maxPurity;
    }

    if (sessionId) {
      where.sessionId = sessionId;
    }

    const [data, total] = await Promise.all([
      this.prisma.detection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: { boundingBoxes: true },
      }),
      this.prisma.detection.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<DetectionWithBoxes> {
    const detection = await this.prisma.detection.findUnique({
      where: { id },
      include: { boundingBoxes: true },
    });

    if (!detection) {
      throw new NotFoundException(`Detection with ID ${id} not found`);
    }

    return detection;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    await this.prisma.detection.delete({
      where: { id },
    });

    return { success: true };
  }

  async getRecentDetections(limit: number = 10): Promise<DetectionWithBoxes[]> {
    return this.prisma.detection.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: { boundingBoxes: true },
    });
  }
}
