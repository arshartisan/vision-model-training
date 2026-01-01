import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { InferenceService } from '../inference/inference.service';
import { DetectionService } from './detection.service';
import { PrismaService } from '../prisma/prisma.service';
import { ROIService, ROIConfig } from '../roi/roi.service';
import { BatchService } from '../batch/batch.service';

interface StreamSettings {
  sessionId?: string;
  currentBatchId?: string;
  currentBatchNumber: number;
  saveDetections: boolean;
  confidenceThreshold: number;
  roi: ROIConfig;
}

@WebSocketGateway({
  namespace: '/detection',
  cors: {
    origin: process.env.WS_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class DetectionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DetectionGateway.name);
  private clientSettings = new Map<string, StreamSettings>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly inferenceService: InferenceService,
    private readonly detectionService: DetectionService,
    private readonly prisma: PrismaService,
    private readonly roiService: ROIService,
    private readonly batchService: BatchService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Send connection status
    const modelStatus = this.inferenceService.getModelStatus();
    client.emit('connection_status', {
      connected: true,
      modelLoaded: modelStatus.loaded,
    });

    // Initialize default settings for this client
    this.clientSettings.set(client.id, {
      saveDetections: true,
      confidenceThreshold: 0.5,
      currentBatchNumber: 0,
      roi: this.roiService.getDefaultROI(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Cleanup client settings
    const settings = this.clientSettings.get(client.id);
    if (settings?.sessionId) {
      // End current batch if active
      if (settings.currentBatchId) {
        this.batchService.endBatch(settings.currentBatchId).catch((err) => {
          this.logger.error(`Failed to end batch: ${err.message}`);
        });
      }
      // End session if active
      this.endSession(settings.sessionId).catch((err) => {
        this.logger.error(`Failed to end session: ${err.message}`);
      });
    }
    this.clientSettings.delete(client.id);
  }

  @SubscribeMessage('start_stream')
  async handleStartStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId?: string; cameraSource?: string; roi?: ROIConfig },
  ) {
    try {
      // Create a new session if not provided
      let sessionId = data.sessionId;
      const roi = data.roi || this.roiService.getDefaultROI();

      if (!sessionId) {
        const session = await this.prisma.detectionSession.create({
          data: {
            cameraSource: data.cameraSource,
            roiX: roi.x,
            roiY: roi.y,
            roiWidth: roi.width,
            roiHeight: roi.height,
          },
        });
        sessionId = session.id;
      }

      // Update client settings
      const settings = this.clientSettings.get(client.id);
      if (settings) {
        settings.sessionId = sessionId;
        settings.roi = roi;
        settings.currentBatchNumber = 0;
      }

      this.logger.log(`Stream started for client ${client.id}, session: ${sessionId}`);

      client.emit('stream_started', { sessionId, roi });
    } catch (error) {
      this.logger.error(`Failed to start stream: ${error.message}`);
      client.emit('error', {
        code: 'START_STREAM_ERROR',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('stop_stream')
  async handleStopStream(@ConnectedSocket() client: Socket) {
    try {
      const settings = this.clientSettings.get(client.id);
      let summary: Awaited<ReturnType<typeof this.endSession>> | null = null;

      // End current batch if active
      if (settings?.currentBatchId) {
        await this.batchService.endBatch(settings.currentBatchId);
        settings.currentBatchId = undefined;
      }

      if (settings?.sessionId) {
        summary = await this.endSession(settings.sessionId);
        settings.sessionId = undefined;
      }

      this.logger.log(`Stream stopped for client ${client.id}`);

      client.emit('stream_stopped', {
        sessionId: settings?.sessionId,
        summary,
      });
    } catch (error) {
      this.logger.error(`Failed to stop stream: ${error.message}`);
      client.emit('error', {
        code: 'STOP_STREAM_ERROR',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('start_batch')
  async handleStartBatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roi?: ROIConfig },
  ) {
    try {
      const settings = this.clientSettings.get(client.id);

      if (!settings?.sessionId) {
        client.emit('error', {
          code: 'NO_SESSION',
          message: 'No active session. Please start stream first.',
        });
        return;
      }

      // End previous batch if exists
      if (settings.currentBatchId) {
        const endedBatch = await this.batchService.endBatch(settings.currentBatchId);
        client.emit('batch_ended', endedBatch);
      }

      // Update ROI if provided
      if (data.roi && this.roiService.validateROI(data.roi)) {
        settings.roi = data.roi;
      }

      // Create new batch
      const batch = await this.batchService.createBatch(
        settings.sessionId,
        settings.roi,
      );

      settings.currentBatchId = batch.id;
      settings.currentBatchNumber = batch.batchNumber;

      this.logger.log(`Batch #${batch.batchNumber} started for client ${client.id}`);

      client.emit('batch_started', {
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        roi: settings.roi,
      });
    } catch (error) {
      this.logger.error(`Failed to start batch: ${error.message}`);
      client.emit('error', {
        code: 'START_BATCH_ERROR',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('end_batch')
  async handleEndBatch(@ConnectedSocket() client: Socket) {
    try {
      const settings = this.clientSettings.get(client.id);

      if (!settings?.currentBatchId) {
        client.emit('error', {
          code: 'NO_BATCH',
          message: 'No active batch to end.',
        });
        return;
      }

      const batch = await this.batchService.endBatch(settings.currentBatchId);

      this.logger.log(`Batch #${batch.batchNumber} ended for client ${client.id}`);

      settings.currentBatchId = undefined;

      client.emit('batch_ended', batch);
    } catch (error) {
      this.logger.error(`Failed to end batch: ${error.message}`);
      client.emit('error', {
        code: 'END_BATCH_ERROR',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('update_roi')
  handleUpdateROI(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roi: ROIConfig },
  ) {
    const settings = this.clientSettings.get(client.id);

    if (!settings) {
      client.emit('error', {
        code: 'NO_SETTINGS',
        message: 'Client settings not found.',
      });
      return;
    }

    if (!this.roiService.validateROI(data.roi)) {
      client.emit('error', {
        code: 'INVALID_ROI',
        message: 'Invalid ROI configuration.',
      });
      return;
    }

    settings.roi = data.roi;

    this.logger.log(`ROI updated for client ${client.id}`);

    client.emit('roi_updated', { roi: settings.roi });
  }

  @SubscribeMessage('frame')
  async handleFrame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { data: string; timestamp: number },
  ) {
    try {
      // Decode base64 image
      const imageBuffer = Buffer.from(data.data, 'base64');

      // Run inference
      const result = await this.inferenceService.runInference(imageBuffer);

      // Get client settings
      const settings = this.clientSettings.get(client.id);

      // Calculate ROI-filtered statistics
      const roiStats = this.roiService.calculateROIStats(
        result.boundingBoxes,
        settings?.roi || this.roiService.getDefaultROI(),
      );

      // Mark bounding boxes with ROI status
      const boundingBoxesWithROI = this.roiService.markBoxesWithROI(
        result.boundingBoxes,
        settings?.roi || this.roiService.getDefaultROI(),
      );

      // Save detection if enabled
      if (settings?.saveDetections && settings?.currentBatchId) {
        await this.detectionService.create({
          frameWidth: result.frameWidth,
          frameHeight: result.frameHeight,
          processingTimeMs: result.processingTimeMs,
          sessionId: settings.sessionId,
          batchId: settings.currentBatchId,
          roiPureCount: roiStats.pureCount,
          roiImpureCount: roiStats.impureCount,
          roiTotalCount: roiStats.totalCount,
          roiPurityPercentage: roiStats.purityPercentage,
          boundingBoxes: result.boundingBoxes.map((box) => ({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            classId: box.classId,
            className: box.className,
            confidence: box.confidence,
          })),
        });

        // Update session stats
        if (settings.sessionId) {
          await this.prisma.detectionSession.update({
            where: { id: settings.sessionId },
            data: {
              totalFrames: { increment: 1 },
              totalPureCount: { increment: roiStats.pureCount },
              totalImpureCount: { increment: roiStats.impureCount },
            },
          });
        }

        // Update batch snapshot (SET current frame counts, not accumulate)
        await this.batchService.setCurrentBatchSnapshot(
          settings.currentBatchId,
          roiStats.pureCount,
          roiStats.impureCount,
          roiStats.totalCount,
        );

        // Get and emit current batch stats
        const batchStats = await this.batchService.getCurrentBatchStats(
          settings.currentBatchId,
        );
        if (batchStats) {
          client.emit('batch_stats_updated', batchStats);
        }
      }

      // Build enhanced result with ROI info
      const enhancedResult = {
        ...result,
        roiPureCount: roiStats.pureCount,
        roiImpureCount: roiStats.impureCount,
        roiTotalCount: roiStats.totalCount,
        roiPurityPercentage: roiStats.purityPercentage,
        boundingBoxes: boundingBoxesWithROI,
        roi: settings?.roi || this.roiService.getDefaultROI(),
        currentBatchId: settings?.currentBatchId,
        currentBatchNumber: settings?.currentBatchNumber || 0,
      };

      // Emit result to client
      this.logger.debug(
        `Sending detection result: ${result.boundingBoxes.length} boxes, ` +
        `ROI: ${roiStats.pureCount} pure, ${roiStats.impureCount} impure`,
      );
      client.emit('detection_result', enhancedResult);
    } catch (error) {
      this.logger.error(`Frame processing error: ${error.message}`);
      client.emit('error', {
        code: 'FRAME_PROCESSING_ERROR',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('update_settings')
  handleUpdateSettings(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      saveDetections?: boolean;
      confidenceThreshold?: number;
    },
  ) {
    const settings = this.clientSettings.get(client.id);
    if (settings) {
      if (data.saveDetections !== undefined) {
        settings.saveDetections = data.saveDetections;
      }
      if (data.confidenceThreshold !== undefined) {
        settings.confidenceThreshold = data.confidenceThreshold;
      }
    }

    client.emit('settings_updated', settings);
  }

  @SubscribeMessage('get_batch_history')
  async handleGetBatchHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { limit?: number },
  ) {
    try {
      const settings = this.clientSettings.get(client.id);

      if (!settings?.sessionId) {
        client.emit('error', {
          code: 'NO_SESSION',
          message: 'No active session.',
        });
        return;
      }

      const batches = await this.batchService.getRecentBatches(
        settings.sessionId,
        data.limit || 10,
      );

      client.emit('batch_history', { batches });
    } catch (error) {
      this.logger.error(`Failed to get batch history: ${error.message}`);
      client.emit('error', {
        code: 'BATCH_HISTORY_ERROR',
        message: error.message,
      });
    }
  }

  private async endSession(sessionId: string) {
    const session = await this.prisma.detectionSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
      },
    });

    // Calculate average purity
    const totalCount = session.totalPureCount + session.totalImpureCount;
    const avgPurity =
      totalCount > 0 ? (session.totalPureCount / totalCount) * 100 : 100;

    const updatedSession = await this.prisma.detectionSession.update({
      where: { id: sessionId },
      data: { avgPurityPercent: avgPurity },
    });

    return {
      sessionId: updatedSession.id,
      totalFrames: updatedSession.totalFrames,
      totalPure: updatedSession.totalPureCount,
      totalImpure: updatedSession.totalImpureCount,
      avgPurity: updatedSession.avgPurityPercent,
      totalBatches: updatedSession.totalBatches,
      duration:
        updatedSession.endTime && updatedSession.startTime
          ? updatedSession.endTime.getTime() - updatedSession.startTime.getTime()
          : 0,
    };
  }
}
