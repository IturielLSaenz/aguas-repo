import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Reporte } from '../../reportes/entities/reporte.entity';

@Entity('tipo_fraude')
export class TipoFraude {
  @PrimaryGeneratedColumn({ name: 'id_tipo_fraude' })
  idTipoFraude: number;

  @Column({ name: 'nombre_tipo', length: 100, unique: true })
  nombreTipo: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  @OneToMany(() => Reporte, (reporte) => reporte.tipoFraude)
  reportes: Reporte[];
}
