import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

export class FilterDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  customer?: string;

  @IsOptional()
  @IsIn(['USD', 'EUR', 'GBP'])
  currency?: string;
}
