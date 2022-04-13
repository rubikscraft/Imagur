import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EarlyConfigModule } from '../../config/early/earlyconfig.module';
import { ESysPreferenceBackend } from '../../models/entities/syspreference.entity';
import { PreferenceDefaultsService } from './preferencedefaults.service';
import { SysPreferenceService } from './syspreferencedb.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ESysPreferenceBackend]),
    EarlyConfigModule,
  ],
  providers: [SysPreferenceService, PreferenceDefaultsService],
  exports: [SysPreferenceService],
})
export class SysPreferenceModule {}