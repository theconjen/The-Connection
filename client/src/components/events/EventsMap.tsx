import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Event } from '@shared/mobile-web/types';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })));
const TileLayer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })));
const Marker = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Marker })));
const Popup = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Popup })));

// Define custom marker icon to fix the missing marker issue
const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper function to format dates
const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

interface EventsMapProps {
  events: Event[];
  height?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export default function EventsMap({ 
  events, 
  height = '600px', 
  initialCenter = [20, 0], // Default center at a global view
  initialZoom = 2 // Default zoom level for world view
}: EventsMapProps) {
  const [mapEvents, setMapEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Filter events that have coordinates and should be shown on map
    console.log('All events:', events);
    
    // First check for events with show on map
    const eventsWithShowOnMap = events.filter(event => (event as any).showOnMap === true);
    console.log('Events with showOnMap=true:', eventsWithShowOnMap);
    
    // Then filter for those with coordinates
    const eventsWithCoordinates = events.filter(event => 
      (event as any).latitude && 
      (event as any).longitude && 
      (event as any).showOnMap === true && 
      (event as any).isVirtual === false
    );
    console.log('Final filtered events for map:', eventsWithCoordinates);
    
    setMapEvents(eventsWithCoordinates);
  }, [events]);

  if (mapEvents.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <MapPin size={18} />
            Event Map
          </CardTitle>
          <CardDescription>
            View events happening worldwide
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="bg-muted/30 p-6 rounded-full">
              <MapPin size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No events to display on map</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Events with location coordinates will appear here. Add an event with a specific address to see it on the map.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create a wrapper component for the Map to ensure it only renders on client-side
  const MapComponent = () => {
    const mapRef = useRef(null);
    
    // Add logging to debug
    console.log('Rendering map with events:', mapEvents);
    
    return (
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center">Loading map...</div>}>
        <MapContainer 
          center={initialCenter} 
          zoom={initialZoom} 
          style={{ height: '100%', width: '100%', borderRadius: '0 0 var(--radius) var(--radius)' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {mapEvents.map(event => {
            if (!event.latitude || !event.longitude) return null;
            
            const lat = parseFloat(event.latitude);
            const lng = parseFloat(event.longitude);
            
            if (isNaN(lat) || isNaN(lng)) return null;
            
            return (
              <Marker 
                key={event.id} 
                position={[lat, lng]}
                icon={customIcon}
              >
                <Popup className="event-popup" minWidth={250} maxWidth={300}>
                  <div className="space-y-2">
                    <h3 className="font-medium text-base">{event.title}</h3>
                    
                    <div className="flex items-start gap-2">
                      <Calendar size={14} className="mt-0.5 shrink-0" />
                      <span className="text-sm">{formatDate(event.eventDate)}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Clock size={14} className="mt-0.5 shrink-0" />
                      <span className="text-sm">{event.startTime} - {event.endTime}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        <span className="text-sm">
                          {event.location}
                          {event.address && <div>{event.address}</div>}
                          {(event.city || event.state) && (
                            <div>
                              {event.city}{event.city && event.state ? ', ' : ''}
                              {event.state} {event.zipCode}
                            </div>
                          )}
                        </span>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <Link href={`/events/${event.id}`}>
                        <Button size="sm" className="w-full">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </Suspense>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2">
          <MapPin size={18} />
          Event Map
        </CardTitle>
        <CardDescription>
          View events happening worldwide
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height, width: '100%' }}>
          <MapComponent />
        </div>
      </CardContent>
    </Card>
  );
}