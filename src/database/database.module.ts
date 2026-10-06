import { Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { createPool } from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

export const DB_POOL = 'DB_POOL';

// La conexión a la base de datos de Aguas.
// NOTA: ajusta usuario/password a los de TU MySQL (los mismos de tu .env).
const DATABASE_URL = 'mysql://aguas_app:MegaTera77@localhost:3306/aguas_db';

@Module({
  providers: [
    {
      provide: DB_POOL,
      useFactory: () => {
        console.log('Conectando a ' + DATABASE_URL);
        return createPool({ uri: DATABASE_URL });
      },
    },
  ],
  exports: [DB_POOL],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  onModuleDestroy() {
    return this.pool.end();
  }
}