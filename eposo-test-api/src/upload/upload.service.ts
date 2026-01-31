import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiateUploadDto } from './dto/initiate-upload.dto';
import { createReadStream, createWriteStream, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';

const uploadDir = join(process.cwd(), 'uploads');
const chunksDir = join(uploadDir, 'chunks');

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  async initiateUpload(dto: InitiateUploadDto) {
    const totalChunks = Math.ceil(dto.totalSize / (5 * 1024 * 1024)); // 5MB chunks

    const upload = await this.prisma.upload.create({
      data: {
        filename: dto.filename,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        totalSize: BigInt(dto.totalSize),
        totalChunks,
        userId: dto.userId || null,
      },
    });

    return {
      uploadId: upload.id,
      totalChunks,
    };
  }

  async saveChunk(uploadId: string, chunkIndex: number, size: number) {
    const upload = await this.prisma.upload.findUnique({
      where: { id: uploadId },
      include: { chunks: true },
    });

    if (!upload) {
      throw new NotFoundException('Upload not found');
    }

    // Check if chunk already exists
    const existingChunk = upload.chunks.find(
      (chunk) => chunk.chunkIndex === chunkIndex,
    );

    if (existingChunk) {
      return {
        success: true,
        message: 'Chunk already uploaded',
        uploadedChunks: upload.uploadedChunks,
        totalChunks: upload.totalChunks,
      };
    }

    // Save chunk record
    await this.prisma.uploadChunk.create({
      data: {
        uploadId,
        chunkIndex,
        size,
      },
    });

    // Update upload progress
    const updatedUpload = await this.prisma.upload.update({
      where: { id: uploadId },
      data: {
        uploadedChunks: upload.uploadedChunks + 1,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      uploadedChunks: updatedUpload.uploadedChunks,
      totalChunks: updatedUpload.totalChunks,
    };
  }

  async getUploadStatus(uploadId: string) {
    const upload = await this.prisma.upload.findUnique({
      where: { id: uploadId },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
    });

    if (!upload) {
      throw new NotFoundException('Upload not found');
    }

    return {
      uploadId: upload.id,
      filename: upload.originalName,
      totalSize: upload.totalSize.toString(),
      totalChunks: upload.totalChunks,
      uploadedChunks: upload.uploadedChunks,
      uploadedChunkIndices: upload.chunks.map((chunk) => chunk.chunkIndex),
      status: upload.status,
      createdAt: upload.createdAt,
      updatedAt: upload.updatedAt,
      completedAt: upload.completedAt,
    };
  }

  async completeUpload(uploadId: string) {
    const upload = await this.prisma.upload.findUnique({
      where: { id: uploadId },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
    });

    if (!upload) {
      throw new NotFoundException('Upload not found');
    }

    if (upload.uploadedChunks !== upload.totalChunks) {
      throw new Error(
        `Upload incomplete: ${upload.uploadedChunks}/${upload.totalChunks} chunks uploaded`,
      );
    }

    // Merge chunks into final file
    const finalFilePath = join(uploadDir, upload.filename);
    const writeStream = createWriteStream(finalFilePath);

    try {
      for (let i = 0; i < upload.totalChunks; i++) {
        const chunkPath = join(chunksDir, `${uploadId}_chunk_${i}`);
        
        if (!existsSync(chunkPath)) {
          throw new Error(`Chunk ${i} not found`);
        }

        const readStream = createReadStream(chunkPath);
        await pipeline(readStream, writeStream, { end: false });
      }

      writeStream.end();

      // Wait for write stream to finish
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Delete chunk files
      for (let i = 0; i < upload.totalChunks; i++) {
        const chunkPath = join(chunksDir, `${uploadId}_chunk_${i}`);
        if (existsSync(chunkPath)) {
          unlinkSync(chunkPath);
        }
      }

      // Update upload status
      await this.prisma.upload.update({
        where: { id: uploadId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Upload completed successfully',
        filePath: finalFilePath,
      };
    } catch (error) {
      // Update status to failed
      await this.prisma.upload.update({
        where: { id: uploadId },
        data: {
          status: 'failed',
        },
      });

      throw new Error(`Failed to merge chunks: ${error.message}`);
    }
  }
}