import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { Driver, Page, Stats, Trip, User } from './types';

type Tab = 'resumen' | 'conductores' | 'usuarios' | 'viajes';

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('admin@utqallya.pe');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api<{ accessToken: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (result.user.role !== 'ADMIN') throw new Error('Esta cuenta no tiene acceso administrativo');
      sessionStorage.setItem('utqallya_admin_token', result.accessToken);
      onLogin();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return <main className="login"><form className="card login-card" onSubmit={submit}>
    <span className="eyebrow">UTQALLYA</span><h1>Panel administrativo</h1>
    <label>Correo<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
    <label>Contraseña<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
    {error && <p className="error">{error}</p>}
    <button disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</button>
  </form></main>;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(sessionStorage.getItem('utqallya_admin_token')));
  const [tab, setTab] = useState<Tab>('resumen');
  const [stats, setStats] = useState<Stats>({});
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Page<Trip>>({ content: [], number: 0, totalPages: 0, totalElements: 0 });
  const [tripPage, setTripPage] = useState(0);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const [statsData, driverData, tripData] = await Promise.all([
      api<Stats>('/admin/stats'),
      api<Page<Driver>>('/admin/drivers?size=100'),
      api<Page<Trip>>(`/admin/trips?page=${tripPage}&size=15&sort=createdAt,desc`),
    ]);
    setStats(statsData); setDrivers(driverData.content); setTrips(tripData);
  }, [tripPage]);

  useEffect(() => {
    if (authenticated) load().catch(error => setNotice(error.message));
  }, [authenticated, load]);

  async function driverAction(driver: Driver, action: 'approve' | 'reject') {
    const reason = action === 'reject' ? window.prompt('Motivo del rechazo:') : null;
    if (action === 'reject' && !reason) return;
    await api(`/admin/drivers/${driver.id}/${action}`, {
      method: 'POST',
      body: action === 'reject' ? JSON.stringify({ reason }) : undefined,
    });
    setNotice(action === 'approve' ? 'Conductor aprobado' : 'Conductor rechazado');
    await load();
  }

  const users = useMemo(() => {
    const index = new Map<string, User>();
    drivers.forEach(driver => index.set(driver.user.id, driver.user));
    trips.content.forEach(trip => {
      index.set(trip.passenger.id, trip.passenger);
      if (trip.driver?.user) index.set(trip.driver.user.id, trip.driver.user);
    });
    const normalized = query.toLowerCase();
    return [...index.values()].filter(user =>
      `${user.fullName} ${user.email} ${user.phone ?? ''}`.toLowerCase().includes(normalized));
  }, [drivers, trips.content, query]);

  async function toggleUser(user: User) {
    const isBlocked = user.blocked === true || user.active === false;
    await api(`/admin/users/${user.id}/${isBlocked ? 'unblock' : 'block'}`, { method: 'POST' });
    setDrivers(current => current.map(driver => driver.user.id === user.id
      ? { ...driver, user: { ...driver.user, active: isBlocked, blocked: !isBlocked } } : driver));
    setNotice(isBlocked ? 'Usuario desbloqueado' : 'Usuario bloqueado');
  }

  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;
  const pending = drivers.filter(driver => driver.approvalStatus === 'PENDING');

  return <div className="shell">
    <aside><div><span className="eyebrow">UTQALLYA</span><h2>Administración</h2></div>
      <nav>{(['resumen', 'conductores', 'usuarios', 'viajes'] as Tab[]).map(item =>
        <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
      <button className="secondary" onClick={() => { sessionStorage.clear(); setAuthenticated(false); }}>Cerrar sesión</button>
    </aside>
    <main className="content">
      <header><div><p className="muted">Panel de control</p><h1>{tab[0].toUpperCase() + tab.slice(1)}</h1></div>{notice && <span className="notice">{notice}</span>}</header>
      {tab === 'resumen' && <section className="stats">{Object.entries(stats).map(([key, value]) =>
        <article className="card" key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><strong>{value}</strong></article>)}</section>}
      {tab === 'conductores' && <section className="card"><h2>Pendientes ({pending.length})</h2>
        <div className="table-wrap"><table><thead><tr><th>Conductor</th><th>Vehículo</th><th>Placa</th><th>Acciones</th></tr></thead>
          <tbody>{pending.map(driver => <tr key={driver.id}><td>{driver.user.fullName}<small>{driver.user.email}</small></td>
            <td>{driver.vehicle.type}</td><td>{driver.vehicle.plate}</td><td className="actions">
              <button onClick={() => driverAction(driver, 'approve')}>Aprobar</button>
              <button className="danger" onClick={() => driverAction(driver, 'reject')}>Rechazar</button></td></tr>)}</tbody></table></div>
        {!pending.length && <p className="empty">No hay conductores pendientes.</p>}</section>}
      {tab === 'usuarios' && <section className="card"><div className="section-head"><h2>Usuarios conocidos</h2>
        <input placeholder="Buscar por nombre, correo o teléfono" value={query} onChange={e => setQuery(e.target.value)} /></div>
        <p className="muted">La API actual no expone un listado general; se muestran usuarios vinculados a conductores y viajes cargados.</p>
        <div className="table-wrap"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>{users.map(user => { const blocked = user.blocked === true || user.active === false; return <tr key={user.id}>
            <td>{user.fullName}<small>{user.email}</small></td><td>{user.role}</td><td>{blocked ? 'Bloqueado' : 'Activo'}</td>
            <td><button className={blocked ? '' : 'danger'} onClick={() => toggleUser(user)}>{blocked ? 'Desbloquear' : 'Bloquear'}</button></td></tr>; })}</tbody></table></div></section>}
      {tab === 'viajes' && <section className="card"><h2>Viajes ({trips.totalElements})</h2>
        <div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Pasajero</th><th>Vehículo</th><th>Estado</th><th>Tarifa</th></tr></thead>
          <tbody>{trips.content.map(trip => <tr key={trip.id}><td>{new Date(trip.createdAt).toLocaleString('es-PE')}</td>
            <td>{trip.passenger.fullName}</td><td>{trip.vehicleType}</td><td>{trip.status}</td><td>{trip.agreedFare ? `S/ ${trip.agreedFare}` : '—'}</td></tr>)}</tbody></table></div>
        <div className="pager"><button disabled={tripPage === 0} onClick={() => setTripPage(p => p - 1)}>Anterior</button>
          <span>Página {trips.number + 1} de {Math.max(1, trips.totalPages)}</span>
          <button disabled={tripPage + 1 >= trips.totalPages} onClick={() => setTripPage(p => p + 1)}>Siguiente</button></div></section>}
    </main>
  </div>;
}
