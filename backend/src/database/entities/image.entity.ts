import { EImage } from 'picsur-shared/dist/entities/image.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class EImageBackend implements EImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    nullable: false,
  })
  user_id: string;

  @Column({
    nullable: false,
  })
  created: Date;

  @Column({
    nullable: false,
    default: 'image',
  })
  file_name: string;

  @Column({
    nullable: true,
    select: false,
  })
  delete_key?: string;
}
