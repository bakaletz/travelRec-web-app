import {
  Component,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Input,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
}

@Component({
  selector: 'app-route-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './route-map.component.html',
  styleUrls: ['./route-map.component.scss']
})
export class RouteMapComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() points: MapPoint[] = [];
  @Input() showRoute = true;

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.initMap();
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['points'] && this.viewReady) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap(): void {
    if (this.map || !this.mapContainer) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      scrollWheelZoom: false,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.layerGroup = L.layerGroup().addTo(this.map);

    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private render(): void {
    if (!this.map || !this.layerGroup) return;

    this.layerGroup.clearLayers();

    const valid = this.points.filter(
      p => p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng)
    );

    if (valid.length === 0) {
      this.map.setView([20, 0], 2);
      return;
    }

    const latLngs: L.LatLngExpression[] = valid.map(p => [p.lat, p.lng]);

    valid.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: this.buildIcon(valid.length > 1 ? String(index + 1) : '')
      });
      marker.bindPopup(`<strong>${this.escape(point.label)}</strong>`);
      this.layerGroup!.addLayer(marker);
    });

    if (this.showRoute && valid.length > 1) {
      const line = L.polyline(latLngs, {
        color: '#2563eb',
        weight: 3,
        opacity: 0.8,
        dashArray: '6, 8'
      });
      this.layerGroup.addLayer(line);
    }

    if (valid.length === 1) {
      this.map.setView(latLngs[0], 9);
    } else {
      const bounds = L.latLngBounds(latLngs);
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }

    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private buildIcon(text: string): L.DivIcon {
    return L.divIcon({
      className: 'route-map-marker',
      html: `<span class="route-map-pin">${text}</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  }

  private escape(value: string): string {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }
}