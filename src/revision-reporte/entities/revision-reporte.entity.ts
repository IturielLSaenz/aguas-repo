import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Bitacora } from '../../bitacora/entities/bitacora.entity';

@Entity('revision_reporte')
export class RevisionReporte {
  @PrimaryGeneratedColumn({ name: 'id_revision' })
  idRevision: number;

  @ManyToOne(() => Bitacora, (bitacora) => bitacora.revisiones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_bitacora' })
  bitacora: Bitacora;

  @CreateDateColumn({ name: 'fecha_revision' })
  fechaRevision: Date;

  @Column({ length: 20, nullable: true })
  resultado: string;

  @Column('text', { nullable: true })
  comentario: string;
}
