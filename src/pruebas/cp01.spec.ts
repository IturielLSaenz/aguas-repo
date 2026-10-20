// CP_01 - Consulta del detalle de un reporte (HU07)
// Autor: Ituriel Liebes Sáenz
//
// Prueba ReportesService.findOneRaw, que lee un reporte de la base de datos.
// La base de datos se simula con un "mock": no se necesita MySQL ni el servidor.
import { NotFoundException } from '@nestjs/common';
import { ReportesService } from '../reportes/reportes.service';
import type { JwtPayload } from '../auth/jwt';

const usuarioApp: JwtPayload = {
  sub: '3', correo: 'ana.torres@yahoo.com', rol: 'usuario',
  type: 'access', iat: 0, exp: 0,
};

function crearServicio(filas: Record<string, unknown>[]) {
  const pool = { query: jest.fn().mockResolvedValue([filas]) };
  const servicio = new ReportesService(
    {} as any, pool as any, {} as any, {} as any, {} as any, {} as any, {} as any,
  );
  return { servicio, pool };
}

describe('CP_01_HU07 - Consulta del detalle de un reporte', () => {
  it('Éxito: un usuario consulta un reporte verificado y recibe sus datos', async () => {
    const { servicio, pool } = crearServicio([{
      id_reporte: 1, id_usuario: 1, u_nombre: 'María', u_apellido: 'López',
      descripcion: 'SMS de paquete retenido en aduana',
      telefono_estafador: '5587654321', enlace_sospechoso: 'https://dhl-aduana-pago.com',
      empresa_suplantada: 'DHL', estado: 'verificado',
      evidencia_principal: 'uploads/evidencias/rep1_sms.jpg',
      fecha_reporte: '2026-10-18T19:15:06Z',
    }]);

    const reporte = await servicio.findOneRaw(1, usuarioApp);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(reporte.idReporte).toBe(1);
    expect(reporte.telefonoEstafador).toBe('5587654321');
    expect(reporte.empresaSuplantada).toBe('DHL');
    expect(reporte.estado).toBe('verificado');
  });

  it('Fallido: un usuario intenta ver un reporte pendiente de otra persona y recibe "no encontrado"', async () => {
    const { servicio } = crearServicio([{
      id_reporte: 4, id_usuario: 1, u_nombre: 'María', u_apellido: 'López',
      estado: 'pendiente',
    }]);

    await expect(servicio.findOneRaw(4, usuarioApp)).rejects.toThrow(NotFoundException);
  });
});
