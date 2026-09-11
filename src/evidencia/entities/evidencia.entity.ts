import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reporte } from '../../reportes/entities/reporte.entity';

@Entity('evidencia')
export class Evidencia {
  @PrimaryGeneratedColumn({ name: 'id_evidencia' })
  idEvidencia: number;

  @ManyToOne(() => Reporte, (reporte) => reporte.evidencias, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_reporte' })
  reporte: Reporte;

  @Column({ name: 'tipo_evidencia', length: 50, nullable: true })
  tipoEvidencia: string;

  @Column({ length: 255 })
  archivo: string;

  @Column({ length: 20, nullable: true })
  formato: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;
}
