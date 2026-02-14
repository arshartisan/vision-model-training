import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ROIConfig } from '../roi/roi.service';
import { BatchFilterDto, PaginatedBatchResponse } from './dto/batch-filter.dto';

export interface BatchSummary {
  id: string;
  batchNumber: number;
  startTime: Date;
  endTime: Date | null;
  pureCount: number;
  impureCount: number;
  unwantedCount: number;
  totalCount: number;
  purityPercentage: number | null;
  frameCount: number;
  roi: ROIConfig;
  avgWhiteness: number | null;
  avgQualityScore: number | null;
}

export interface BatchStats {
  pureCount: number;
  impureCount: number;
  unwantedCount: number;
  totalCount: number;
  purityPercentage: number;
  frameCount: number;
  avgWhiteness: number | null;
  avgQualityScore: number | null;
}

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new batch within a session
   */
  async createBatch(
    sessionId: string,
    roi: ROIConfig,
  ): Promise<BatchSummary> {
    // Get the next batch number for this session
    const lastBatch = await this.prisma.batch.findFirst({
      where: { sessionId },
      orderBy: { batchNumber: 'desc' },
    });

    const batchNumber = lastBatch ? lastBatch.batchNumber + 1 : 1;

    const batch = await this.prisma.batch.create({
      data: {
        sessionId,
        batchNumber,
        roiX: roi.x,
        roiY: roi.y,
        roiWidth: roi.width,
        roiHeight: roi.height,
      },
    });

    // Update session's total batch count
    await this.prisma.detectionSession.update({
      where: { id: sessionId },
      data: { totalBatches: { increment: 1 } },
    });

    this.logger.log(`Created batch #${batchNumber} for session ${sessionId}`);

    return this.toBatchSummary(batch);
  }

  /**
   * End the current batch - saves the current snapshot as final batch result
   */
  async endBatch(batchId: string): Promise<BatchSummary> {
    // Just set the end time - the snapshot stats are already stored
    const batch = await this.prisma.batch.update({
      where: { id: batchId },
      data: {
        endTime: new Date(),
      },
    });

    this.logger.log(
      `Ended batch #${batch.batchNumber}: ${batch.pureCount} pure, ${batch.impureCount} impure, ${batch.unwantedCount} unwanted, ${(batch.purityPercentage ?? 100).toFixed(1)}% purity`,
    );

    return this.toBatchSummary(batch);
  }

  /**
   * Get a batch by ID
   */
  async getBatch(batchId: string): Promise<BatchSummary | null> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });

    return batch ? this.toBatchSummary(batch) : null;
  }

  /**
   * Get all batches for a session
   */
  async getSessionBatches(sessionId: string): Promise<BatchSummary[]> {
    const batches = await this.prisma.batch.findMany({
      where: { sessionId },
      orderBy: { batchNumber: 'desc' },
    });

    return batches.map((batch) => this.toBatchSummary(batch));
  }

  /**
   * Get recent batches for a session (limited)
   */
  async getRecentBatches(
    sessionId: string,
    limit: number = 10,
  ): Promise<BatchSummary[]> {
    const batches = await this.prisma.batch.findMany({
      where: { sessionId },
      orderBy: { batchNumber: 'desc' },
      take: limit,
    });

    return batches.map((batch) => this.toBatchSummary(batch));
  }

  /**
   * Set current batch snapshot (overwrites with current frame's detection counts)
   * This stores the CURRENT crystals visible, not accumulated over time
   */
  async setCurrentBatchSnapshot(
    batchId: string,
    pureCount: number,
    impureCount: number,
    unwantedCount: number,
    totalCount: number,
    avgWhiteness?: number,
    avgQualityScore?: number,
  ): Promise<void> {
    // Purity excludes unwanted: pure / (pure + impure)
    const saltCount = pureCount + impureCount;
    const purityPercentage = saltCount > 0 ? (pureCount / saltCount) * 100 : 100;

    await this.prisma.batch.update({
      where: { id: batchId },
      data: {
        pureCount,        // SET, not increment
        impureCount,      // SET, not increment
        unwantedCount,    // SET, not increment
        totalCount,       // SET, not increment
        purityPercentage,
        avgWhiteness,
        avgQualityScore,
        frameCount: { increment: 1 },  // Still count frames for reference
      },
    });
  }

  /**
   * Get current running batch stats (for real-time display)
   */
  async getCurrentBatchStats(batchId: string): Promise<BatchStats | null> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        pureCount: true,
        impureCount: true,
        unwantedCount: true,
        totalCount: true,
        frameCount: true,
        avgWhiteness: true,
        avgQualityScore: true,
      },
    });

    if (!batch) return null;

    // Purity excludes unwanted: pure / (pure + impure)
    const saltCount = batch.pureCount + batch.impureCount;
    const purityPercentage =
      saltCount > 0
        ? (batch.pureCount / saltCount) * 100
        : 100;

    return {
      pureCount: batch.pureCount,
      impureCount: batch.impureCount,
      unwantedCount: batch.unwantedCount,
      totalCount: batch.totalCount,
      purityPercentage,
      frameCount: batch.frameCount,
      avgWhiteness: batch.avgWhiteness,
      avgQualityScore: batch.avgQualityScore,
    };
  }

  /**
   * Get batch trends for a session
   */
  async getBatchTrends(sessionId: string): Promise<{ batchNumber: number; purityPercentage: number }[]> {
    const batches = await this.prisma.batch.findMany({
      where: {
        sessionId,
        endTime: { not: null },
      },
      orderBy: { batchNumber: 'asc' },
      select: {
        batchNumber: true,
        purityPercentage: true,
      },
    });

    return batches.map((b) => ({
      batchNumber: b.batchNumber,
      purityPercentage: b.purityPercentage ?? 100,
    }));
  }

  /**
   * Get all batches with pagination and filtering
   */
  async findAll(filter: BatchFilterDto): Promise<PaginatedBatchResponse<BatchSummary>> {
    const { page = 1, limit = 20, startDate, endDate, sessionId } = filter;

    const where: any = {};

    if (sessionId) {
      where.sessionId = sessionId;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate);
      }
    }

    const [batches, total] = await Promise.all([
      this.prisma.batch.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.batch.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: batches.map((batch) => this.toBatchSummary(batch)),
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

  /**
   * Delete a batch by ID
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }

    await this.prisma.batch.delete({
      where: { id },
    });

    this.logger.log(`Deleted batch #${batch.batchNumber} (${id})`);

    return {
      success: true,
      message: `Batch #${batch.batchNumber} deleted successfully`,
    };
  }

  /**
   * Convert Prisma batch to BatchSummary
   */
  private toBatchSummary(batch: {
    id: string;
    batchNumber: number;
    startTime: Date;
    endTime: Date | null;
    roiX: number;
    roiY: number;
    roiWidth: number;
    roiHeight: number;
    pureCount: number;
    impureCount: number;
    unwantedCount: number;
    totalCount: number;
    purityPercentage: number | null;
    frameCount: number;
    avgWhiteness: number | null;
    avgQualityScore: number | null;
  }): BatchSummary {
    return {
      id: batch.id,
      batchNumber: batch.batchNumber,
      startTime: batch.startTime,
      endTime: batch.endTime,
      pureCount: batch.pureCount,
      impureCount: batch.impureCount,
      unwantedCount: batch.unwantedCount,
      totalCount: batch.totalCount,
      purityPercentage: batch.purityPercentage,
      frameCount: batch.frameCount,
      roi: {
        x: batch.roiX,
        y: batch.roiY,
        width: batch.roiWidth,
        height: batch.roiHeight,
      },
      avgWhiteness: batch.avgWhiteness,
      avgQualityScore: batch.avgQualityScore,
    };
  }
}
