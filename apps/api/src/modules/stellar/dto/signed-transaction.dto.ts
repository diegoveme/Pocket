import { ApiProperty } from '@nestjs/swagger';
import { IsBase64, IsString, MaxLength } from 'class-validator';

/** A transaction the API prepared, sent back after the user signed it. */
export class SignedTransactionDto {
  @ApiProperty({ description: 'Signed transaction envelope, base64 XDR' })
  @IsString()
  @IsBase64()
  @MaxLength(20_000)
  signedXdr: string;
}
