import { ApiExtraModels, PartialType } from '@nestjs/swagger';
import { CreateBranchDto } from './create-branch.dto';

@ApiExtraModels()
export class UpdateBranchDto extends PartialType(CreateBranchDto) {}
