// ══════════════════════════════════════════════════════════════════
// public-contacto.js — wires the contact form (contacto.html) to
// Supabase. Inserts a row into public.contactos via the anon
// publishable key. RLS allows anon INSERT only; the admin reads them.
// ══════════════════════════════════════════════════════════════════
import { supabasePublic } from './supabase-public.js';

const form         = document.getElementById('contactForm');
const card         = document.querySelector('[data-agenda-card]');
const formWrap     = document.querySelector('[data-agenda-form]');
const successWrap  = document.querySelector('[data-agenda-success]');
const errorEl      = document.querySelector('[data-form-error]');
const submitBtn    = document.querySelector('[data-submit-btn]');
const submitLabel  = document.querySelector('[data-submit-label]');
const resetBtn     = document.querySelector('[data-agenda-reset]');

if (form && submitBtn) {
  form.addEventListener('submit', handleSubmit);
}
if (resetBtn) {
  resetBtn.addEventListener('click', resetToForm);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readFields() {
  const fd = new FormData(form);
  return {
    nombre:    String(fd.get('nombre')  || '').trim(),
    empresa:   String(fd.get('empresa') || '').trim(),
    email:     String(fd.get('email')   || '').trim(),
    sector:    String(fd.get('sector')  || '').trim(),
    mensaje:   String(fd.get('mensaje') || '').trim(),
    honeypot:  String(fd.get('website') || '').trim(),
  };
}

function validate(values) {
  const errors = [];
  const invalidFields = [];

  if (!values.nombre) {
    errors.push('Ingresa tu nombre.');
    invalidFields.push('cf-nombre');
  }
  if (!values.email) {
    errors.push('Ingresa tu correo electrónico.');
    invalidFields.push('cf-email');
  } else if (!EMAIL_RE.test(values.email)) {
    errors.push('El correo electrónico no parece válido.');
    invalidFields.push('cf-email');
  }
  if (!values.mensaje) {
    errors.push('Cuéntanos brevemente qué necesitas.');
    invalidFields.push('cf-mensaje');
  } else if (values.mensaje.length < 10) {
    errors.push('La descripción es muy corta — agrega un poco más de contexto.');
    invalidFields.push('cf-mensaje');
  }

  return { errors, invalidFields };
}

function showError(message, invalidIds = []) {
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }
  clearInvalid();
  invalidIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('aria-invalid', 'true');
  });
  const firstInvalid = invalidIds.length ? document.getElementById(invalidIds[0]) : null;
  if (firstInvalid) firstInvalid.focus();
}

function clearError() {
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
  clearInvalid();
}

function clearInvalid() {
  form.querySelectorAll('[aria-invalid="true"]').forEach(el => {
    el.removeAttribute('aria-invalid');
  });
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.classList.toggle('is-loading', loading);
  if (submitLabel) {
    submitLabel.textContent = loading ? 'Enviando…' : 'Enviar solicitud';
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  clearError();

  const values = readFields();

  // Honeypot — a real user can't see this field. If filled, treat as
  // spam but pretend it succeeded (avoids tipping off the bot).
  if (values.honeypot) {
    swapToSuccess();
    form.reset();
    return;
  }

  const { errors, invalidFields } = validate(values);
  if (errors.length > 0) {
    showError(errors.join(' '), invalidFields);
    return;
  }

  setLoading(true);
  try {
    const payload = {
      nombre:  values.nombre,
      empresa: values.empresa || null,
      email:   values.email,
      sector:  values.sector || null,
      mensaje: values.mensaje,
      fuente:  'contacto',
      user_agent: (navigator.userAgent || '').slice(0, 500),
    };

    const { error } = await supabasePublic
      .from('contactos')
      .insert(payload);

    if (error) throw error;

    form.reset();
    swapToSuccess();
  } catch (err) {
    console.error('[contacto] insert error:', err);
    showError('No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos a contacto@mtec.cl.');
  } finally {
    setLoading(false);
  }
}

function swapToSuccess() {
  if (formWrap)    formWrap.hidden = true;
  if (successWrap) successWrap.hidden = false;
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function resetToForm() {
  if (successWrap) successWrap.hidden = true;
  if (formWrap)    formWrap.hidden = false;
  clearError();
  const firstInput = form.querySelector('input, textarea');
  if (firstInput) firstInput.focus();
}
