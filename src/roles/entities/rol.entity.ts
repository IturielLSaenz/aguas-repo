import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('rol')
export class Rol {
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  idRol: number;

  @Column({ name: 'nombre_rol', length: 50, unique: true })
  nombreRol: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios: Usuario[];
}
