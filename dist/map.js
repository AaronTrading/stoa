const mapElement = document.querySelector('#stoa-map');
const locateButton = document.querySelector('#locate-me');
const status = document.querySelector('#map-status');
document.querySelectorAll('[data-year]').forEach((element) => { element.textContent = new Date().getFullYear(); });

const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const typeLabels = { ferme: 'Ferme', magasin: 'Magasin', distributeur: 'Distributeur' };
const map = L.map(mapElement, { center: [46.55, 2.4], zoom: 6, minZoom: 5, maxZoom: 19, preferCanvas: true });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
const pointsLayer = L.layerGroup().addTo(map);
let points = [];
let userMarker;

const distanceKm = (lat1, lon1, lat2, lon2) => {
  const toRadians = (value) => value * Math.PI / 180;
  const earth = 6371;
  const dLat = toRadians(lat2 - lat1), dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const popup = (point) => `<div class="stoa-map-popup"><span>${escapeHtml(typeLabels[point.type] || 'Point de vente')}</span><strong>${escapeHtml(point.nom?.trim())}</strong><p>${escapeHtml(point.adresse?.trim())}<br>${escapeHtml(point.postal_code)} ${escapeHtml(point.city)}</p></div>`;

const loadPoints = async () => {
  try {
    const response = await fetch('/data/lait-cru-points.json');
    if (!response.ok) throw new Error('Chargement impossible');
    points = await response.json();
    points.forEach((point) => {
      point.marker = L.circleMarker([point.latitude, point.longitude], { radius: 5.5, weight: 1.5, color: '#f7f5ed', fillColor: '#3f4b36', fillOpacity: .9 })
        .bindPopup(popup(point), { maxWidth: 260 }).addTo(pointsLayer);
    });
  } catch {
    status.textContent = 'La carte n’a pas pu charger les points de vente.';
  }
};

locateButton.addEventListener('click', () => {
  if (!navigator.geolocation) { status.textContent = 'La géolocalisation n’est pas disponible sur cet appareil.'; return; }
  locateButton.disabled = true; status.textContent = 'Localisation en cours…';
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    const { latitude, longitude } = coords;
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.circleMarker([latitude, longitude], { radius: 9, weight: 3, color: '#fff', fillColor: '#9c7a4d', fillOpacity: 1 }).addTo(map).bindTooltip('Vous êtes ici');
    map.flyTo([latitude, longitude], 12, { duration: 1.1 });
    const nearest = points.map((point) => ({ point, distance: distanceKm(latitude, longitude, point.latitude, point.longitude) })).sort((a, b) => a.distance - b.distance)[0];
    if (nearest) {
      status.textContent = `${nearest.point.nom.trim()} · ${nearest.distance < 1 ? `${Math.round(nearest.distance * 1000)} m` : `${nearest.distance.toFixed(1).replace('.', ',')} km`}`;
      setTimeout(() => nearest.point.marker.openPopup(), 1150);
    } else status.textContent = 'Position trouvée.';
    locateButton.disabled = false;
  }, () => {
    status.textContent = 'Autorisez l’accès à votre position pour utiliser cette fonction.'; locateButton.disabled = false;
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
});

loadPoints();
