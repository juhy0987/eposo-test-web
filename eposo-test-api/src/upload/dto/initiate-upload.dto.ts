import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class InitiateUploadDto {
  @IsString()
  filename: string;

  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  @Min(1)
  @Max(1024 * 1024 * 1024) // 1GB max
  totalSize: number;

  @IsOptional()
  @IsNumber()
  userId?: number;
}