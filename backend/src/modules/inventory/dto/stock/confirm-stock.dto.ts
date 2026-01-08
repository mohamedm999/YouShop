import { IsInt, Min } from 'class-validator';

export class ConfirmStockDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}
