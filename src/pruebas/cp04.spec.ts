// CP_04 - Consulta de un reporte para su revisión en el panel (HU08)
// Autor: Valeria Porcayo Juárez
//
// Prueba ReportesService.findOne, que lee un reporte para que el administrador lo revise.
// La base de datos se simula con un "mock": no se necesita MySQL ni el servidor.
import { NotFoundException } from '@nestjs/common';
import { ReportesService } from '../reportes/reportes.service';

function crearServicio(reporte: unknown) {
  const repository = { findOne: jest.fn().mockResolvedValue(reporte) };
  const servicio = new ReportesService(
    repository as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any,
  );
  return { servicio, repository };
}

describe('CP_04_HU08 - Consulta de un reporte para su revisión', () => {
  it('Éxito: el administrador abre un reporte pendiente y recibe sus datos y su autor', async () => {
    const { servicio, repository } = crearServicio({
      idReporte: 3, estado: 'pendiente', empresaSuplantada: 'Mercado Libre',
      enlaceSospechoso: 'https://mercadolibre-verificacion.net',
      usuario: { idUsuario: 3, nombre: 'Ana', apellido: 'Torres' },
    });

    const reporte = await servicio.findOne(3);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { idReporte: 3 }, relations: ['usuario'],
    });
    expect(reporte.estado).toBe('pendiente');
    expect(reporte.usuario.nombre).toBe('Ana');
  });

  it('Fallido: el administrador busca un reporte que no existe y recibe "no encontrado"', async () => {
    const { servicio } = crearServicio(null);

    await expect(servicio.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
