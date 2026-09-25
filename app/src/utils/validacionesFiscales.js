/**
 * Validaciones fiscales mexicanas compartidas por el registro y por la
 * edición de "Cobros y cuenta": fuente única de reglas y de mensajes.
 */
import { esCorreo } from './validacionesCuenta.js';

/** CLABE de 18 dígitos con dígito verificador correcto (módulo 10, pesos 3-7-1). */
export function clabeValida(clabe) {
  const valor = String(clabe || '').trim();
  if (!/^\d{18}$/.test(valor)) return false;
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i += 1) suma += (Number(valor[i]) * pesos[i % 3]) % 10;
  return (10 - (suma % 10)) % 10 === Number(valor[17]);
}

/** RFC mexicano: 13 caracteres (persona física) o 12 (persona moral). */
export function rfcValido(rfc, tipo) {
  const valor = String(rfc || '').trim().toUpperCase();
  const patron = tipo === 'moral'
    ? /^[A-ZÑ&]{3}\d{6}[A-Z\d]{3}$/
    : /^[A-ZÑ&]{4}\d{6}[A-Z\d]{3}$/;
  return patron.test(valor);
}

/**
 * Valida el conjunto de datos de cobro de Mercado Pago.
 * Si `mpEmail` viene vacío se usa `email` (en el registro es el correo de la
 * cuenta). Devuelve el motivo del primer error o '' si todo está bien.
 */
export function cobroValido(datos) {
  const mpEmail = String(datos.mpEmail || '').trim() || String(datos.email || '').trim();
  if (!esCorreo(mpEmail)) return 'Escribe un correo válido para tu cuenta de Mercado Pago.';
  if (!rfcValido(datos.rfc, datos.tipoPersona)) {
    return datos.tipoPersona === 'moral'
      ? 'El RFC de persona moral debe tener 12 caracteres (ej. ABC123456789).'
      : 'El RFC de persona física debe tener 13 caracteres (ej. XXXX000101001).';
  }
  if (datos.tipoPersona === 'moral' && !String(datos.razonSocial || '').trim()) {
    return 'Escribe la razón social.';
  }
  if (!/^\d{5}$/.test(String(datos.cpFiscal || '').trim())) {
    return 'El código postal fiscal debe tener 5 dígitos.';
  }
  if (!clabeValida(datos.clabe)) {
    return 'La CLABE debe tener 18 dígitos y su dígito verificador no coincide.';
  }
  return '';
}
