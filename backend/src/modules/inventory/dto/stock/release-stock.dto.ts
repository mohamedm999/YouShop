import { IsInt, Min } from 'class-validator';

export class ReleaseStockDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}
