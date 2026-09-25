import { Evidencia } from '../entities/evidencia.entity';

export class EvidenciaResponseDto {
  idEvidencia: number;
  tipoEvidencia: string;
  archivoUrl: string;
  formato: string;

  static fromEntity(evidencia: Evidencia): EvidenciaResponseDto {
    const dto = new EvidenciaResponseDto();
    dto.idEvidencia = evidencia.idEvidencia;
    dto.tipoEvidencia = evidencia.tipoEvidencia;
    dto.archivoUrl = evidencia.archivo;
    dto.formato = evidencia.formato;
    return dto;
  }
}
