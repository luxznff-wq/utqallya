/**
 * Reexporta react-native-maps para las plataformas nativas (iOS/Android).
 * Existe una variante `AppMap.web.tsx` con una vista de reemplazo, ya que
 * react-native-maps no tiene soporte para web. Las pantallas importan
 * siempre desde "@/components/AppMap", nunca directamente "react-native-maps",
 * para que Metro elija automáticamente la variante correcta por plataforma.
 */
import MapView, { Marker, Polyline } from 'react-native-maps';
import type { Region } from 'react-native-maps';

export default MapView;
export { Marker, Polyline };
export type { Region };
