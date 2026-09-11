import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('notificacion')
export class Notificacion {
  @PrimaryGeneratedColumn({ name: 'id_notificacion' })
  idNotificacion: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.notificaciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column('text')
  mensaje: string;

  @CreateDateColumn({ name: 'fecha_notificacion' })
  fechaNotificacion: Date;

  @Column({ default: false })
  leida: boolean;
}
