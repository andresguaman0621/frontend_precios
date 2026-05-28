import { z } from "zod";

export const priceSchema = z
  .object({
    producto_id: z.number().int().positive(),
    presentacion_id: z.number().int().positive(),
    precio_1: z.number().positive().max(9999.99).nullable(),
    precio_2: z.number().positive().max(9999.99).nullable(),
    precio_3: z.number().positive().max(9999.99).nullable(),
    observacion: z.string().max(250).default(""),
    confirmado: z.boolean().default(true),
  })
  .refine((data) => data.precio_1 != null || data.precio_2 != null || data.precio_3 != null, {
    message: "Debe ingresar al menos un precio",
  });

export type PriceFormValues = z.infer<typeof priceSchema>;

export const completeSessionSchema = z.object({
  lat_fin: z.number().min(-90).max(90).nullable(),
  lng_fin: z.number().min(-180).max(180).nullable(),
  accuracy_fin: z.number().nonnegative().nullable(),
  comentario_sesion: z.string().max(1000).default(""),
});

export type CompleteSessionValues = z.infer<typeof completeSessionSchema>;
