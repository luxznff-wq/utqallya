const state = { token: sessionStorage.getItem('utqallya.adminToken') };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}`, ...(options.headers || {}) },
  });
  if (response.status === 401 || response.status === 403) {
    logout();
    throw new Error('La sesión venció o no tiene permisos de administrador.');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'No se pudo completar la operación.');
  }
  return response.status === 204 ? null : response.json();
}

function showApp(authenticated) {
  $('#login-view').classList.toggle('hidden', authenticated);
  $('#app-view').classList.toggle('hidden', !authenticated);
}

function logout() {
  state.token = null;
  sessionStorage.removeItem('utqallya.adminToken');
  showApp(false);
}

async function changePassword() {
  const currentPassword = window.prompt('Contraseña actual:');
  if (!currentPassword) return;
  const newPassword = window.prompt('Nueva contraseña (mínimo 8 caracteres):');
  if (!newPassword || newPassword.length < 8) {
    $('#global-error').textContent = 'La nueva contraseña debe tener al menos 8 caracteres.';
    return;
  }
  try {
    await api('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    window.alert('Contraseña actualizada correctamente.');
  } catch (error) {
    $('#global-error').textContent = error.message;
  }
}

async function login(event) {
  event.preventDefault();
  $('#login-error').textContent = '';
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: $('#email').value.trim(), password: $('#password').value }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Credenciales incorrectas.');
    if (result.user.role !== 'ADMIN') throw new Error('Esta cuenta no tiene permisos administrativos.');
    state.token = result.accessToken;
    sessionStorage.setItem('utqallya.adminToken', state.token);
    showApp(true);
    await refreshAll();
  } catch (error) {
    $('#login-error').textContent = error.message;
  }
}

function renderStats(data) {
  const items = [
    ['Pasajeros', data.totalPassengers],
    ['Conductores', data.totalDrivers],
    ['Pendientes', data.driversPendingApproval],
    ['Viajes hoy', data.tripsToday],
    ['En curso', data.tripsInProgress],
    ['Completados', data.tripsCompletedTotal],
    ['Aprobados', data.driversApproved],
    ['Calificación', Number(data.averageDriverRating).toFixed(2)],
    ['Ofertas', data.offersReceived],
    ['Elegidas', data.offersSelected],
    ['Tarifa promedio', `S/ ${Number(data.averageAgreedFare).toFixed(2)}`],
  ];
  $('#stats').innerHTML = items.map(([label, value]) => `<article class="stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></article>`).join('');
}

function safeDocumentLink(url, label) {
  if (!url || !/^https?:\/\//i.test(url)) return '';
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
}

function renderDrivers(page) {
  const drivers = page.content || [];
  $('#drivers-list').innerHTML = drivers.length ? drivers.map((driver) => {
    const vehicle = driver.vehicle || {};
    const today = new Date().toISOString().slice(0, 10);
    const documentsValid = driver.licenseExpiresAt >= today && driver.soatExpiresAt >= today;
    const canReview = documentsValid &&
      (driver.approvalStatus === 'PENDING' || driver.approvalStatus === 'REJECTED');
    return `<article class="driver">
      <div>
        <span class="badge ${escapeHtml(driver.approvalStatus)}">${escapeHtml(driver.approvalStatus)}</span>
        <h3>${escapeHtml(driver.user.fullName)}</h3>
        <div class="meta">${escapeHtml(driver.user.email)} · ${escapeHtml(driver.user.phone)} · DNI ${escapeHtml(driver.dniNumber)}</div>
        <div class="meta">${escapeHtml(vehicle.type)} · ${escapeHtml(vehicle.plate)} · ${escapeHtml([vehicle.brand, vehicle.model, vehicle.color].filter(Boolean).join(' '))}</div>
        <div class="meta">Licencia vence: ${escapeHtml(driver.licenseExpiresAt || 'sin fecha')} · SOAT vence: ${escapeHtml(driver.soatExpiresAt || 'sin fecha')}</div>
        <div class="documents">
          ${safeDocumentLink(driver.dniPhotoUrl, 'DNI')}
          ${safeDocumentLink(driver.licensePhotoUrl, 'Licencia')}
          ${safeDocumentLink(driver.soatPhotoUrl, 'SOAT')}
          ${safeDocumentLink(vehicle.photoUrl, 'Vehículo')}
        </div>
        ${driver.rejectionReason ? `<p class="error">Motivo: ${escapeHtml(driver.rejectionReason)}</p>` : ''}
        ${documentsValid ? '' : '<p class="error">No aprobable: documento vencido o sin fecha.</p>'}
      </div>
      <div class="actions">
        ${canReview ? `<button data-action="approve" data-id="${escapeHtml(driver.id)}">Aprobar</button><button class="reject" data-action="reject" data-id="${escapeHtml(driver.id)}">Rechazar</button>` : ''}
        <button class="secondary" data-action="${driver.user.blocked ? 'unblock' : 'block'}" data-user-id="${escapeHtml(driver.user.id)}">${driver.user.blocked ? 'Desbloquear' : 'Bloquear'}</button>
      </div>
    </article>`;
  }).join('') : '<p class="muted">No hay conductores para este filtro.</p>';
}

function renderTrips(page) {
  $('#trips-list').innerHTML = (page.content || []).map((trip) => `<tr>
    <td>${escapeHtml(new Date(trip.createdAt).toLocaleString('es-PE'))}</td>
    <td>${escapeHtml(trip.passenger.fullName)}</td>
    <td>${escapeHtml(trip.origin.address || 'Origen')} → ${escapeHtml(trip.destination.address || 'Destino')}</td>
    <td><span class="badge ${escapeHtml(trip.status)}">${escapeHtml(trip.status)}</span></td>
    <td>${escapeHtml(trip.vehicleType)}</td>
  </tr>`).join('');
}

function renderIncidents(page) {
  $('#incidents-list').innerHTML = (page.content || []).map((incident) => `<tr>
    <td>${escapeHtml(new Date(incident.createdAt).toLocaleString('es-PE'))}</td>
    <td>${escapeHtml(incident.reporter.fullName)}<div class="meta">${escapeHtml(incident.reporter.phone)}</div></td>
    <td>${escapeHtml(incident.category)}</td>
    <td>${escapeHtml(incident.description)}${incident.adminNote ? `<div class="meta">Nota: ${escapeHtml(incident.adminNote)}</div>` : ''}</td>
    <td><span class="badge ${escapeHtml(incident.status)}">${escapeHtml(incident.status)}</span></td>
    <td class="actions">
      ${incident.status === 'OPEN' ? `<button data-incident-action="IN_REVIEW" data-id="${escapeHtml(incident.id)}">Revisar</button>` : ''}
      ${incident.status !== 'RESOLVED' ? `<button data-incident-action="RESOLVED" data-id="${escapeHtml(incident.id)}">Resolver</button>` : ''}
    </td>
  </tr>`).join('');
}

function renderAuditLogs(page) {
  $('#audit-list').innerHTML = (page.content || []).map((log) => `<tr>
    <td>${escapeHtml(new Date(log.createdAt).toLocaleString('es-PE'))}</td>
    <td>${escapeHtml(log.actorEmail)}</td>
    <td>${escapeHtml(log.action)}</td>
    <td>${escapeHtml(log.targetType)}<div class="meta">${escapeHtml(log.targetId)}</div></td>
    <td>${escapeHtml(log.details || '—')}</td>
    <td><code>${escapeHtml(log.requestId || '—')}</code></td>
  </tr>`).join('');
}

async function loadDrivers() {
  const status = $('#driver-filter').value;
  renderDrivers(await api(`/admin/drivers?size=50${status ? `&status=${encodeURIComponent(status)}` : ''}`));
}

async function loadIncidents() {
  const status = $('#incident-filter').value;
  renderIncidents(await api(`/admin/incidents?size=50${status ? `&status=${encodeURIComponent(status)}` : ''}`));
}

async function refreshAll() {
  $('#global-error').textContent = '';
  try {
    const [stats, drivers, trips, incidents, auditLogs] = await Promise.all([
      api('/admin/stats'),
      api(`/admin/drivers?size=50${$('#driver-filter').value ? `&status=${encodeURIComponent($('#driver-filter').value)}` : ''}`),
      api('/admin/trips?size=50&sort=createdAt,desc'),
      api(`/admin/incidents?size=50${$('#incident-filter').value ? `&status=${encodeURIComponent($('#incident-filter').value)}` : ''}`),
      api('/admin/audit-logs?size=100'),
    ]);
    renderStats(stats);
    renderDrivers(drivers);
    renderTrips(trips);
    renderIncidents(incidents);
    renderAuditLogs(auditLogs);
  } catch (error) {
    $('#global-error').textContent = error.message;
  }
}

async function handleIncidentAction(event) {
  const button = event.target.closest('button[data-incident-action]');
  if (!button) return;
  const status = button.dataset.incidentAction;
  const adminNote = window.prompt(status === 'RESOLVED' ? 'Nota de resolución (opcional):' : 'Nota de revisión (opcional):') || '';
  button.disabled = true;
  try {
    await api(`/admin/incidents/${button.dataset.id}`, {
      method: 'POST',
      body: JSON.stringify({ status, adminNote }),
    });
    await loadIncidents();
  } catch (error) {
    $('#global-error').textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function handleDriverAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  button.disabled = true;
  try {
    if (action === 'approve') await api(`/admin/drivers/${button.dataset.id}/approve`, { method: 'POST' });
    if (action === 'reject') {
      const reason = window.prompt('Motivo del rechazo:');
      if (!reason?.trim()) return;
      await api(`/admin/drivers/${button.dataset.id}/reject`, { method: 'POST', body: JSON.stringify({ reason: reason.trim() }) });
    }
    if (action === 'block' || action === 'unblock') await api(`/admin/users/${button.dataset.userId}/${action}`, { method: 'POST' });
    await refreshAll();
  } catch (error) {
    $('#global-error').textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

$('#login-form').addEventListener('submit', login);
$('#logout').addEventListener('click', logout);
$('#change-password').addEventListener('click', changePassword);
$('#refresh').addEventListener('click', refreshAll);
$('#driver-filter').addEventListener('change', loadDrivers);
$('#incident-filter').addEventListener('change', loadIncidents);
$('#drivers-list').addEventListener('click', handleDriverAction);
$('#incidents-list').addEventListener('click', handleIncidentAction);
document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
  $('#drivers-panel').classList.toggle('hidden', button.dataset.tab !== 'drivers');
  $('#trips-panel').classList.toggle('hidden', button.dataset.tab !== 'trips');
  $('#incidents-panel').classList.toggle('hidden', button.dataset.tab !== 'incidents');
  $('#audit-panel').classList.toggle('hidden', button.dataset.tab !== 'audit');
}));

showApp(Boolean(state.token));
if (state.token) refreshAll();
