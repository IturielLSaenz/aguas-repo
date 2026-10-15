import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Reporte } from '../../reportes/entities/reporte.entity';

@Entity('notificacion')
export class Notificacion {
  @PrimaryGeneratedColumn({ name: 'id_notificacion' })
  idNotificacion: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.notificaciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Reporte, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_reporte' })
  reporte: Reporte;

  @Column({ length: 50 })
  tipo: string;

  @Column()
  titulo: string;

  @Column('text')
  mensaje: string;

  @Column('text', { nullable: true })
  motivo?: string;

  @CreateDateColumn({ name: 'fecha_notificacion' })
  fechaNotificacion: Date;

  @Column({ default: false })
  leida: boolean;
}
