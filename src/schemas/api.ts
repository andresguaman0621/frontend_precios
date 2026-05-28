/**
 * Tipos TS que reflejan los Pydantic schemas del backend FastAPI.
 * Decimal del backend llega como string en JSON → tipamos como `string` y parseamos en límite.
 * datetime → string ISO 8601.
 */

// ===== Auth =====

export interface LoginRequest {
  username: string;
  password: string;
  scope: "mobile" | "admin";
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  scope: "mobile" | "admin";
  expires_in: number;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: "bearer";
  scope: "mobile" | "admin";
  expires_in: number;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface MeAssignment {
  mercado_id: number;
  mercado_codigo: string;
  mercado_nombre: string;
  rol_codigo: string;
}

export interface MeResponse {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  cedula: string | null;
  celular: string | null;
  is_admin_global: boolean;
  is_active: boolean;
  is_superuser: boolean;
  asignaciones: MeAssignment[];
}

// ===== Users =====

export interface UserMarket {
  mercado_id: number;
  mercado_codigo: string;
  mercado_nombre: string;
  mercado_clasificacion: string;
  direccion: string;
  activo: boolean;
  roles: string[];
}

// ===== Sessions =====

export interface MercadoOut {
  id: number;
  codigo: string;
  nombre: string;
  clasificacion: string;
  direccion: string | null;
  activo: boolean;
}

export interface SesionOut {
  id: number;
  mercado_id: number;
  mercado: MercadoOut;
  numero_semana: number;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  usuario_id: number;
  usuario_nombre: string;
  estado: "INICIADA" | "COMPLETADA";
  total_productos: number;
  comentario_sesion: string;
  lat_inicio: string | null;
  lng_inicio: string | null;
  accuracy_inicio: number | null;
  lat_fin: string | null;
  lng_fin: string | null;
  accuracy_fin: number | null;
  descripcion_semana: string | null;
}

export interface SesionListItem {
  id: number;
  mercado_id: number;
  mercado_nombre: string;
  usuario_id: number;
  usuario_nombre: string;
  numero_semana: number;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: "INICIADA" | "COMPLETADA";
  total_productos: number;
}

export interface SesionCreateRequest {
  mercado_id: number;
  lat_inicio?: string | null;
  lng_inicio?: string | null;
  accuracy_inicio?: number | null;
}

export interface SesionCompletarRequest {
  lat_fin?: string | null;
  lng_fin?: string | null;
  accuracy_fin?: number | null;
  comentario_sesion?: string;
}

export interface VentanaSemana {
  inicio: string;
  fin: string;
}

export interface CanStartResponse {
  puede: boolean;
  mensaje: string;
  sesion_abierta: Record<string, unknown> | null;
  tomas_en_semana: number;
  max_tomas: number;
  validacion_limite_activa: boolean;
  ventana_semana: VentanaSemana;
}

export interface PresentacionConPrecio {
  presentacion_id: number;
  presentacion_nombre: string;
  presentacion_orden: number;
  last_price: string | null;
  catalog_entry_id: number;
  toma_actual_id: number | null;
  precio_1: string | null;
  precio_2: string | null;
  precio_3: string | null;
  precio_promedio: string | null;
  observacion: string;
  requirio_confirmacion_manual: boolean;
  confirmado: boolean;
}

export interface ProductoCatalogo {
  producto_id: number;
  producto_codigo: string;
  producto_nombre: string;
  producto_orden: number;
  es_canasta_basica: boolean;
  peso_kg: string | null;
  categoria_id: number | null;
  categoria_nombre: string | null;
  categoria_orden: number | null;
  umbral_variacion_inferior: string | null;
  umbral_variacion_superior: string | null;
  presentaciones: PresentacionConPrecio[];
}

export interface CatalogForSession {
  sesion_id: number;
  mercado_id: number;
  productos: ProductoCatalogo[];
}

export interface SesionActiveResponse {
  sesion: SesionOut;
  catalogo: CatalogForSession;
}

// ===== Prices =====

export interface VariacionInfo {
  precio_anterior: string | null;
  precio_nuevo: string;
  variacion_porcentaje: number | null;
  hay_alerta: boolean;
  es_aumento: boolean | null;
  umbral_inferior: number;
  umbral_superior: number;
  requirio_confirmacion_manual: boolean;
  mensaje: string;
}

export interface PrecioOut {
  id: number;
  sesion_toma_id: number;
  mercado_id: number;
  producto_id: number;
  presentacion_id: number | null;
  precio_1: string | null;
  precio_2: string | null;
  precio_3: string | null;
  precio: string;
  numero_semana: number;
  anio: number;
  mes: number;
  dia: number;
  fecha_toma: string;
  usuario_id: number;
  confirmado: boolean;
  variacion_porcentaje: string | null;
  requirio_confirmacion_manual: boolean;
  observacion: string;
}

export interface PrecioGuardadoResponse {
  toma: PrecioOut;
  created: boolean;
  variacion_info: VariacionInfo;
}

export interface PrecioBulkItem {
  client_uuid: string;
  producto_id: number;
  presentacion_id: number;
  precio_1?: string | null;
  precio_2?: string | null;
  precio_3?: string | null;
  confirmado?: boolean;
  observacion?: string;
  client_timestamp?: string | null;
}

export type PrecioBulkStatus = "created" | "updated" | "conflict" | "error";

export interface PrecioBulkResult {
  client_uuid: string;
  status: PrecioBulkStatus;
  server_id: number | null;
  variacion_info: VariacionInfo | null;
  error_message: string | null;
}

export interface ObservacionUpdateRequest {
  observacion: string;
}

export interface PrecioValidateRequest {
  producto_id: number;
  mercado_id: number;
  presentacion_id: number;
  precio_nuevo: string;
}

// ===== Devices =====

export interface DeviceRegisterRequest {
  token: string;
  platform: "ios" | "android";
  device_name?: string | null;
}

export interface DeviceOut {
  id: number;
  platform: "ios" | "android";
  device_name: string | null;
  activo: boolean;
  fecha_registro: string;
  ultimo_uso: string;
}

// ===== Paginación =====

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
