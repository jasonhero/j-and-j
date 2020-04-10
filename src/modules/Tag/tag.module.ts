import { Module } from '@nestjs/common';
import { DateScalar } from '../../graph';
import { TagResolver } from './tag.resolver';
import { TagService } from './tag.service';

@Module({
  providers: [TagResolver, TagService],
})
export class TagModule {}
