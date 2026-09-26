-- =====================================================================
-- ESQUEMA DE BASE DE DATOS (MySQL 8+) - Proyecto "Aguas!" (4Fantasticos)
-- Basado en el ERD dibujado por el equipo (Rol, Usuario, Notificacion,
-- Tipo_fraude, Reporte, Bitacora, Evidencia, Revision_reporte)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS aguas_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE aguas_db;

-- ---------------------------------------------------------------------
-- ROL
-- ---------------------------------------------------------------------
CREATE TABLE rol (
    id_rol       INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol   VARCHAR(50) NOT NULL UNIQUE,   -- usuario, moderador, administrador
    descripcion  VARCHAR(255)
) ENGINE=InnoDB;

INSERT INTO rol (nombre_rol, descripcion) VALUES
    ('usuario',        'Puede crear y consultar reportes'),
    ('moderador',       'Puede revisar y aprobar/rechazar reportes'),
    ('administrador',  'Gestiona cuentas, roles y estadísticas globales');

-- ---------------------------------------------------------------------
-- USUARIO  (Rol 1 --- N Usuario)
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    correo          VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,   -- hash bcrypt (campo "contraseña" en el diagrama)
    telefono        VARCHAR(20),
    id_rol          INT NOT NULL,
    fecha_registro  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- NOTIFICACION  (Usuario 1 --- N Notificacion)
-- ---------------------------------------------------------------------
CREATE TABLE notificacion (
    id_notificacion     INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario          INT NOT NULL,
    mensaje             TEXT NOT NULL,
    fecha_notificacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leida               BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ---------------------------------------------------------------------
-- REPORTE  (Usuario 1 --- N Reporte)
-- El proyecto ya solo maneja phishing/spoofing: no existe más el concepto
-- de "tipo de fraude" como catálogo (por eso ya no hay tabla tipo_fraude
-- ni columna id_tipo_fraude aquí).
-- ---------------------------------------------------------------------
CREATE TABLE reporte (
    id_reporte          INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario          INT NOT NULL,   -- quién reporta
    -- Opcional: nace vacía en el paso 1 (datos del estafador) y se llena
    -- en el paso 2, junto con la evidencia. Sigue siendo opcional incluso
    -- en el paso 2.
    descripcion         TEXT NULL,
    telefono_estafador  VARCHAR(20),    -- paso 1
    enlace_sospechoso   VARCHAR(255),   -- paso 1
    fecha_reporte       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    empresa_suplantada  VARCHAR(150),
    estado              VARCHAR(20) DEFAULT 'pendiente',  -- pendiente, verificado, rechazado
    evidencia_principal VARCHAR(255),   -- ruta/URL de la evidencia de portada, mostrada en el buscador sin JOIN a Evidencia
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- BITACORA  (Reporte 1 --- N Bitacora)
-- id_usuario: agregado sobre el diagrama original para cumplir NF04
-- ("las modificaciones deberán quedar registradas con fecha, usuario
-- y acción realizada"). Nulleable por si alguna acción es del sistema.
-- ---------------------------------------------------------------------
CREATE TABLE bitacora (
    id_bitacora  INT AUTO_INCREMENT PRIMARY KEY,
    id_reporte   INT NOT NULL,
    id_usuario   INT NULL,           -- quién ejecutó la acción (moderador/admin)
    fecha_hora   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accion       VARCHAR(100) NOT NULL,
    descripcion  TEXT,
    FOREIGN KEY (id_reporte) REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- EVIDENCIA  (Reporte 1 --- N Evidencia)
-- ---------------------------------------------------------------------
CREATE TABLE evidencia (
    id_evidencia    INT AUTO_INCREMENT PRIMARY KEY,
    id_reporte      INT NOT NULL,
    tipo_evidencia  VARCHAR(50),      -- imagen, pdf
    archivo         VARCHAR(255) NOT NULL,   -- ruta o URL del archivo
    formato         VARCHAR(20),
    descripcion     VARCHAR(255),
    FOREIGN KEY (id_reporte) REFERENCES reporte(id_reporte) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- REVISION_REPORTE  (Bitacora 1 --- N Revision_reporte)
-- ---------------------------------------------------------------------
CREATE TABLE revision_reporte (
    id_revision     INT AUTO_INCREMENT PRIMARY KEY,
    id_bitacora     INT NOT NULL,
    fecha_revision  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado       VARCHAR(20),   -- verificado, rechazado
    comentario      TEXT,
    FOREIGN KEY (id_bitacora) REFERENCES bitacora(id_bitacora) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ÍNDICES para búsqueda pública (RF04) y filtros del panel
-- ---------------------------------------------------------------------
CREATE INDEX idx_reporte_estado    ON reporte(estado);
CREATE INDEX idx_reporte_empresa   ON reporte(empresa_suplantada);
CREATE INDEX idx_bitacora_reporte  ON bitacora(id_reporte);
