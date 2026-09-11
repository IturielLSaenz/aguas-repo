import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { TipoFraude } from '../../tipos-fraude/entities/tipo-fraude.entity';
import { Bitacora } from '../../bitacora/entities/bitacora.entity';
import { Evidencia } from '../../evidencia/entities/evidencia.entity';

// Debe coincidir exactamente con el CHECK que se agregue en MySQL (estado)
export enum EstadoReporte {
  PENDIENTE = 'pendiente',
  VERIFICADO = 'verificado',
  RECHAZADO = 'rechazado',
}

@Entity('reporte')
export class Reporte {
  @PrimaryGeneratedColumn({ name: 'id_reporte' })
  idReporte: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.reportes)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => TipoFraude, (tipoFraude) => tipoFraude.reportes)
  @JoinColumn({ name: 'id_tipo_fraude' })
  tipoFraude: TipoFraude;

  @Column('text')
  descripcion: string;

  @CreateDateColumn({ name: 'fecha_reporte' })
  fechaReporte: Date;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  monto: number | null;

  @Column({ name: 'empresa_suplantada', length: 150, nullable: true })
  empresaSuplantada: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: EstadoReporte.PENDIENTE,
  })
  estado: EstadoReporte;

  @Column({ name: 'evidencia_principal', length: 255, nullable: true })
  evidenciaPrincipal: string;

  @OneToMany(() => Bitacora, (bitacora) => bitacora.reporte)
  bitacoras: Bitacora[];

  @OneToMany(() => Evidencia, (evidencia) => evidencia.reporte)
  evidencias: Evidencia[];
}
