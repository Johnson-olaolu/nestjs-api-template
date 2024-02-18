import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<Data> {
  @ApiProperty()
  status: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data?: Data;
}
