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

interface StreamSettings {
  sessionId?: string;
  saveDetections: boolean;
  confidenceThreshold: number;
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
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Cleanup client settings
    const settings = this.clientSettings.get(client.id);
    if (settings?.sessionId) {
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
    @MessageBody() data: { sessionId?: string; cameraSource?: string },
  ) {
    try {
      // Create a new session if not provided
      let sessionId = data.sessionId;

      if (!sessionId) {
        const session = await this.prisma.detectionSession.create({
          data: {
            cameraSource: data.cameraSource,
          },
        });
        sessionId = session.id;
      }

      // Update client settings
      const settings = this.clientSettings.get(client.id);
      if (settings) {
        settings.sessionId = sessionId;
      }

      this.logger.log(`Stream started for client ${client.id}, session: ${sessionId}`);

      client.emit('stream_started', { sessionId });
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

      // Save detection if enabled
      if (settings?.saveDetections) {
        await this.detectionService.create({
          frameWidth: result.frameWidth,
          frameHeight: result.frameHeight,
          processingTimeMs: result.processingTimeMs,
          sessionId: settings.sessionId,
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
              totalPureCount: { increment: result.pureCount },
              totalImpureCount: { increment: result.impureCount },
            },
          });
        }
      }

      // Emit result to client
      this.logger.debug(`Sending detection result: ${result.boundingBoxes.length} boxes, pure=${result.pureCount}, impure=${result.impureCount}`);
      client.emit('detection_result', result);
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
    @MessageBody() data: { saveDetections?: boolean; confidenceThreshold?: number },
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
      duration:
        updatedSession.endTime && updatedSession.startTime
          ? updatedSession.endTime.getTime() - updatedSession.startTime.getTime()
          : 0,
    };
  }
}
