-- El precio se acuerda y cobra directamente entre conductor y pasajero.
-- La aplicación no calcula ni muestra una tarifa automática.
ALTER TABLE trips ALTER COLUMN fare DROP NOT NULL;
