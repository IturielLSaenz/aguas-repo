// CP_02 - Historial de reportes propios (HU10)
// Autor: Enrique López Gallo Pérez
//
// Prueba ReportesService.findMios, que lee los reportes del usuario que inició sesión.
// La base de datos se simula con un "mock": no se necesita MySQL ni el servidor.
import { ReportesService } from '../reportes/reportes.service';
import { EstadoReporte } from '../reportes/entities/reporte.entity';

function crearServicio(filas: Record<string, unknown>[]) {
  const pool = { query: jest.fn().mockResolvedValue([filas]) };
  const servicio = new ReportesService(
    {} as any, pool as any, {} as any, {} as any, {} as any, {} as any, {} as any,
  );
  return { servicio, pool };
}

describe('CP_02_HU10 - Historial de reportes propios', () => {
  it('Éxito: el usuario consulta sus reportes rechazados y solo recibe los suyos con ese estado', async () => {
    const { servicio, pool } = crearServicio([{
      id_reporte: 5, id_usuario: 2, u_nombre: 'Jorge', u_apellido: 'Hernández',
      descripcion: 'Promoción de Amazon', empresa_suplantada: 'Amazon',
      estado: 'rechazado', fecha_reporte: '2026-10-18T19:15:06Z',
    }]);

    const reportes = await servicio.findMios(2, EstadoReporte.RECHAZADO);

    const [sql, parametros] = pool.query.mock.calls[0];
    expect(sql).toContain('r.id_usuario = ?');
    expect(sql).toContain('r.estado = ?');
    expect(parametros).toEqual([2, 'rechazado']);
    expect(reportes).toHaveLength(1);
    expect(reportes[0].idReporte).toBe(5);
    expect(reportes[0].estado).toBe('rechazado');
  });

  it('Fallido: un usuario que no ha enviado reportes recibe una lista vacía', async () => {
    const { servicio } = crearServicio([]);

    const reportes = await servicio.findMios(3, EstadoReporte.VERIFICADO);

    expect(reportes).toEqual([]);
  });
});
