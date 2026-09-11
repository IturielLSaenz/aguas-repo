import { Evidencia } from '../entities/evidencia.entity';

export class EvidenciaResponseDto {
  idEvidencia: number;
  tipoEvidencia: string;
  archivo: string;
  formato: string;
  descripcion: string;

  static fromEntity(evidencia: Evidencia): EvidenciaResponseDto {
    const dto = new EvidenciaResponseDto();
    dto.idEvidencia = evidencia.idEvidencia;
    dto.tipoEvidencia = evidencia.tipoEvidencia;
    dto.archivo = evidencia.archivo;
    dto.formato = evidencia.formato;
    dto.descripcion = evidencia.descripcion;
    return dto;
  }
}
