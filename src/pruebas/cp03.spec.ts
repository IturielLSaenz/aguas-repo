// CP_03 - Consulta de la evidencia de un reporte (HU05)
// Autor: Rafael Antonio Carrión Ortega
//
// Prueba EvidenciaService.findByReporte, que lee las evidencias de un reporte.
// La base de datos se simula con un "mock": no se necesita MySQL ni el servidor.
import { NotFoundException } from '@nestjs/common';
import { EvidenciaService } from '../evidencia/evidencia.service';
import type { JwtPayload } from '../auth/jwt';

const usuarioApp: JwtPayload = {
  sub: '2', correo: 'jorge.hdz@outlook.com', rol: 'usuario',
  type: 'access', iat: 0, exp: 0,
};

function crearServicio(reporte: unknown, filasEvidencia: Record<string, unknown>[]) {
  const reporteRepository = { findOne: jest.fn().mockResolvedValue(reporte) };
  const pool = { query: jest.fn().mockResolvedValue([filasEvidencia]) };
  const servicio = new EvidenciaService({} as any, reporteRepository as any, pool as any);
  return { servicio, pool };
}

describe('CP_03_HU05 - Consulta de la evidencia de un reporte', () => {
  it('Éxito: un usuario consulta la evidencia de un reporte verificado', async () => {
    const { servicio, pool } = crearServicio(
      { idReporte: 1, estado: 'verificado', usuario: { idUsuario: 1 } },
      [
        { id_evidencia: 1, tipo_evidencia: 'imagen', archivo: 'uploads/evidencias/rep1_sms.jpg', formato: 'jpg' },
        { id_evidencia: 2, tipo_evidencia: 'imagen', archivo: 'uploads/evidencias/rep1_pagina.png', formato: 'png' },
      ],
    );

    const evidencias = await servicio.findByReporte(1, usuarioApp);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(evidencias).toHaveLength(2);
    expect(evidencias[0].archivoUrl).toBe('uploads/evidencias/rep1_sms.jpg');
    expect(evidencias[1].formato).toBe('png');
  });

  it('Fallido: un usuario pide la evidencia de un reporte que no existe y recibe "no encontrado"', async () => {
    const { servicio, pool } = crearServicio(null, []);

    await expect(servicio.findByReporte(999, usuarioApp)).rejects.toThrow(NotFoundException);
    expect(pool.query).not.toHaveBeenCalled();
  });
});
