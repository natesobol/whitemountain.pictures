const map = L.map("galleryMap", {
  worldCopyJump: true,
}).setView([44.16, -71.5], 9);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const trailStyle = {
  color: "#2f8ad8",
  weight: 2,
  opacity: 0.7,
};

const peakStyle = {
  radius: 5,
  color: "#0c2433",
  fillColor: "#0c2433",
  fillOpacity: 0.85,
};

const allCoordinates = [];

const addToBounds = (coords) => {
  coords.forEach((coord) => allCoordinates.push(coord));
};

const loadTrails = async () => {
  const sources = [
    "Data/wmnf-normalized.json",
    "Data/pliney-normalized.json",
    "Data/maine-normalized.json",
  ];

  const datasets = await Promise.all(sources.map((url) => fetch(url).then((r) => r.json())));
  const trails = datasets.flat();

  trails.forEach((trail) => {
    const coords = trail.geometry.map((point) => [point.lat, point.lon]);
    if (!coords.length) return;

    const line = L.polyline(coords, trailStyle).addTo(map);
    const km = (trail.distance_meters / 1000).toFixed(2);
    line.bindPopup(`<strong>${trail.name}</strong><br>${km} km • ${trail.surface}`);
    addToBounds(coords);
  });
};

const loadPeaks = async () => {
  const data = await fetch("Data/NH2000ftpeaks.json").then((r) => r.json());
  const peaks = data.elements.filter((el) => el.type === "node");

  peaks.forEach((peak) => {
    const { lat, lon, tags = {} } = peak;
    const name = tags.name || "Unnamed peak";
    const elevation = tags.ele ? `${tags.ele} m` : "";

    const marker = L.circleMarker([lat, lon], peakStyle).addTo(map);
    marker.bindPopup(`<strong>${name}</strong>${elevation ? `<br>${elevation}` : ""}`);
    addToBounds([[lat, lon]]);
  });
};

const init = async () => {
  await Promise.all([loadTrails(), loadPeaks()]);
  if (allCoordinates.length) {
    map.fitBounds(allCoordinates);
  }
};

init();
