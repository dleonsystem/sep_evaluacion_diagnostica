-- Migration: crear tabla preguntas_frecuentes
-- Uso (pgAdmin Query Tool): ejecutar este script completo

BEGIN;

CREATE TABLE IF NOT EXISTS public.preguntas_frecuentes (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	pregunta TEXT NOT NULL,
	respuesta TEXT NOT NULL,
	categoria VARCHAR(100),
	orden INT NOT NULL DEFAULT 0,
	activo BOOLEAN NOT NULL DEFAULT TRUE,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_preguntas_frecuentes_orden CHECK (orden >= 0)
);

CREATE INDEX IF NOT EXISTS idx_preguntas_frecuentes_categoria
	ON public.preguntas_frecuentes(categoria);

CREATE INDEX IF NOT EXISTS idx_preguntas_frecuentes_activo_orden
	ON public.preguntas_frecuentes(activo, orden);

CREATE OR REPLACE FUNCTION public.fn_touch_preguntas_frecuentes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
	NEW.updated_at := NOW();
	RETURN NEW;
END;
$$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_trigger
		WHERE tgname = 'trg_touch_preguntas_frecuentes'
	) THEN
		CREATE TRIGGER trg_touch_preguntas_frecuentes
			BEFORE UPDATE ON public.preguntas_frecuentes
			FOR EACH ROW EXECUTE FUNCTION public.fn_touch_preguntas_frecuentes_updated_at();
	END IF;
END;
$$;

COMMIT;