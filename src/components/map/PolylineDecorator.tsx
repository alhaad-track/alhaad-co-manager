"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-polylinedecorator";

interface PolylineDecoratorProps {
    positions: L.LatLngExpression[];
    patterns: any[];
}

export default function PolylineDecorator({ positions, patterns }: PolylineDecoratorProps) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const polyline = L.polyline(positions);
        const decorator = L.polylineDecorator(polyline, {
            patterns: patterns
        });

        decorator.addTo(map);

        return () => {
            map.removeLayer(decorator);
        };
    }, [map, positions, patterns]);

    return null;
}
