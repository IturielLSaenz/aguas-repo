import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Rol } from '../../roles/entities/rol.entity';
import { Reporte } from '../../reportes/entities/reporte.entity';
import { Notificacion } from '../../notificaciones/entities/notificacion.entity';
import { Bitacora } from '../../bitacora/entities/bitacora.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ length: 150, unique: true })
  correo: string;

  // Hash bcrypt. Nunca se guarda ni se expone la contraseña en texto plano.
  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @ManyToOne(() => Rol, (rol) => rol.usuarios, { eager: false })
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro: Date;

  @OneToMany(() => Reporte, (reporte) => reporte.usuario)
  reportes: Reporte[];

  @OneToMany(() => Notificacion, (notificacion) => notificacion.usuario)
  notificaciones: Notificacion[];

  @OneToMany(() => Bitacora, (bitacora) => bitacora.usuario)
  bitacoras: Bitacora[];
}
