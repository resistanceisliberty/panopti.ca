import { useCameraStore } from '../store/cameraStore';

export function nearestWithin(p: { lat: number; lon: number }, meters: number): boolean {
  const R = 6371000, toRad = (d: number) => d * Math.PI / 180;
  return useCameraStore.getState().cameras.some((c) => {
    const dLat = toRad(c.lat - p.lat), dLon = toRad(c.lon - p.lon);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p.lat)) * Math.cos(toRad(c.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a)) <= meters;
  });
}
