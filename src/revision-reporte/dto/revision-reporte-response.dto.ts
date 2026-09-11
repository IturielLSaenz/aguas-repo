import { RevisionReporte } from '../entities/revision-reporte.entity';

export class RevisionReporteResponseDto {
  idRevision: number;
  fechaRevision: string;
  resultado: string;
  comentario: string;

  static fromEntity(revision: RevisionReporte): RevisionReporteResponseDto {
    const dto = new RevisionReporteResponseDto();
    dto.idRevision = revision.idRevision;
    dto.fechaRevision = revision.fechaRevision?.toISOString();
    dto.resultado = revision.resultado;
    dto.comentario = revision.comentario;
    return dto;
  }
}
