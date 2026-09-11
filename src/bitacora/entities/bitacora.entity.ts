import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reporte } from '../../reportes/entities/reporte.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { RevisionReporte } from '../../revision-reporte/entities/revision-reporte.entity';

@Entity('bitacora')
export class Bitacora {
  @PrimaryGeneratedColumn({ name: 'id_bitacora' })
  idBitacora: number;

  @ManyToOne(() => Reporte, (reporte) => reporte.bitacoras, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_reporte' })
  reporte: Reporte;

  // Nulleable: puede ser null si la acción la generó el sistema, o si el
  // usuario que la ejecutó fue borrado (ON DELETE SET NULL).
  @ManyToOne(() => Usuario, (usuario) => usuario.bitacoras, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario | null;

  @CreateDateColumn({ name: 'fecha_hora' })
  fechaHora: Date;

  @Column({ length: 100 })
  accion: string;

  @Column('text', { nullable: true })
  descripcion: string;

  @OneToMany(() => RevisionReporte, (revision) => revision.bitacora)
  revisiones: RevisionReporte[];
}
