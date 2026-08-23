"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinates } from "@/types";
import type { RecommendedSpot } from "@/lib/recommend";

interface MapViewProps {
  center: Coordinates;
  centerLabel: string;
  spots: RecommendedSpot[];
}

/**
 * 추천 결과를 지도로 보여주는 뷰. 카카오맵 등은 별도 JS 키가 필요해서,
 * API 키 없이 쓸 수 있는 Leaflet + OpenStreetMap 타일로 구현했습니다.
 * 기본 마커 아이콘은 Next.js 번들러에서 경로가 깨지는 게 흔한 문제라
 * (marker-icon.png 404), 아이콘 이미지 대신 이모지 divIcon을 씁니다.
 */
export function MapView({ center, centerLabel, spots }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current).setView(
          [center.lat, center.lng],
          12,
        );
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);
      } else {
        mapRef.current.setView([center.lat, center.lng], 12);
      }

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const emojiIcon = (emoji: string) =>
        L.divIcon({
          html: `<span style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))">${emoji}</span>`,
          className: "",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

      const centerMarker = L.marker([center.lat, center.lng], {
        icon: emojiIcon("📍"),
      })
        .addTo(mapRef.current)
        .bindPopup(centerLabel);
      markersRef.current.push(centerMarker);

      spots.forEach((spot) => {
        const marker = L.marker([spot.location.lat, spot.location.lng], {
          icon: emojiIcon(spot.companionType === "pet" ? "🐾" : "🧒"),
        })
          .addTo(mapRef.current!)
          .bindPopup(
            `<strong>${spot.name}</strong><br/>${spot.address}<br/>${spot.distanceKm.toFixed(1)}km`,
          );
        markersRef.current.push(marker);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [center, centerLabel, spots]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-96 w-full overflow-hidden rounded-xl border border-black/[.08] dark:border-white/[.145]"
    />
  );
}
