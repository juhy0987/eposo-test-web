import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { InitiateUploadDto } from './dto/initiate-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadDir = join(process.cwd(), 'uploads');
const chunksDir = join(uploadDir, 'chunks');

// Ensure upload directories exist
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}
if (!existsSync(chunksDir)) {
  mkdirSync(chunksDir, { recursive: true });
}

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('initiate')
  async initiateUpload(@Body() dto: InitiateUploadDto) {
    try {
      const upload = await this.uploadService.initiateUpload(dto);
      return upload;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to initiate upload',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('chunk/:uploadId')
  @UseInterceptors(
    FileInterceptor('chunk', {
      storage: diskStorage({
        destination: chunksDir,
        filename: (req, file, callback) => {
          const uploadId = req.params.uploadId;
          const chunkIndex = req.body.chunkIndex;
          callback(null, `${uploadId}_chunk_${chunkIndex}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max chunk size
      },
    }),
  )
  async uploadChunk(
    @Param('uploadId') uploadId: string,
    @Body('chunkIndex') chunkIndex: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No chunk file provided');
    }

    const chunkIndexNum = parseInt(chunkIndex, 10);
    if (isNaN(chunkIndexNum)) {
      throw new BadRequestException('Invalid chunk index');
    }

    try {
      const result = await this.uploadService.saveChunk(
        uploadId,
        chunkIndexNum,
        file.size,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to save chunk',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status/:uploadId')
  async getUploadStatus(@Param('uploadId') uploadId: string) {
    try {
      const status = await this.uploadService.getUploadStatus(uploadId);
      if (!status) {
        throw new HttpException('Upload not found', HttpStatus.NOT_FOUND);
      }
      return status;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get upload status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('complete/:uploadId')
  async completeUpload(
    @Param('uploadId') uploadId: string,
    @Body() dto: CompleteUploadDto,
  ) {
    try {
      const result = await this.uploadService.completeUpload(uploadId);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to complete upload',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}