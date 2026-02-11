import "../styles/Run.css";
import { useEffect, useState, useRef } from "preact/hooks";
import { Link } from "wouter";

const MAPS_KEY = import.meta.env.VITE_MAPS_API_KEY;

function loadMapsScript() {
    if (document.querySelector('script[src*="maps.googleapis.com"]')) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&v=beta&libraries=maps3d,routes,places`;
        s.async = true;
        s.onload = resolve;
        s.onerror = () => reject(new Error("Failed to load Google Maps"));
        document.head.appendChild(s);
    });
}

export function Run() {
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [coords] = useState(() => {
        try {
            const saved = sessionStorage.getItem("run-coords");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (!coords) return;

        let cancelled = false;

        loadMapsScript()
            .then(async () => {
                if (cancelled) return;

                // create 3D map
                const el = document.createElement("gmp-map-3d");
                el.setAttribute("mode", "satellite");
                el.setAttribute("center", `${coords.lat}, ${coords.lng}`);
                el.setAttribute("range", "1500");
                el.setAttribute("tilt", "65");
                el.setAttribute("heading", "0");
                el.style.width = "100%";
                el.style.height = "100%";

                // mark the user location
                const userMarker = new google.maps.maps3d.Marker3DElement({
                    position: { lat: coords.lat, lng: coords.lng },
                    altitudeMode: "CLAMP_TO_GROUND",
                    label: "You",
                });
                el.append(userMarker);

                containerRef.current.innerHTML = "";
                containerRef.current.appendChild(el);
                setLoading(false);

                // get top 1 search for McDonald's
                const { Place } = await google.maps.importLibrary("places");
                const { places } = await Place.searchByText({
                    textQuery: "McDonald's",
                    locationBias: {
                        center: { lat: coords.lat, lng: coords.lng },
                        radius: 50000,
                    },
                    maxResultCount: 1,
                    fields: ["displayName", "location"],
                });

                if (!places?.length) {
                    console.warn("No McDonald's found");
                    return;
                }

                const mcdonalds = places[0];
                const destLat = mcdonalds.location.lat();
                const destLng = mcdonalds.location.lng();

                // mark mcdonalds
                const mcMarker = new google.maps.maps3d.Marker3DElement({
                    position: { lat: destLat, lng: destLng },
                    altitudeMode: "CLAMP_TO_GROUND",
                    label: mcdonalds.displayName,
                });
                el.append(mcMarker);

                // get directions
                const directionsService = new google.maps.DirectionsService();
                const response = await directionsService.route({
                    origin: { lat: coords.lat, lng: coords.lng },
                    destination: { lat: destLat, lng: destLng },
                    travelMode: google.maps.TravelMode.WALKING,
                });

                const path = response.routes[0].overview_path;
                const routeCoords = path.map((p) => ({
                    lat: p.lat(),
                    lng: p.lng(),
                    altitude: 0,
                }));

                // draw route using google map's polyline library
                const polyline = new google.maps.maps3d.Polyline3DElement({
                    strokeColor: "#4285F4",
                    strokeWidth: 10,
                    altitudeMode: "CLAMP_TO_GROUND",
                    drawsOccludedSegments: true,
                });
                polyline.path = routeCoords;
                el.append(polyline);

                const dLat = destLat - coords.lat;
                const dLng = destLng - coords.lng;
                const heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;
                const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111320;
                const range = Math.max(dist * 2.5, 800);

                el.setAttribute("heading", String((heading + 360) % 360));
                el.setAttribute("range", String(Math.round(range)));
            })
            .catch((err) => {
                if (!cancelled) setError(err.message);
            });

        return () => { cancelled = true; };
    }, [coords]);

    if (!coords) {
        return (
            <section class="run-main">
                <div class="run-main_panel">
                    <p class="run-error">No location data. Please go back and enable location first.</p>
                    <div class="run-actions">
                        <Link class="button" href="/location">Back</Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div class="run-shell">
            <section class="run-main run-main--map" ref={containerRef}>
                {loading && !error && <span class="run-map-loading">Loading 3D map…</span>}
                {error && <span class="run-map-error">{error}</span>}
            </section>
            <Link class="button run-startover" href="/start">Back to Start</Link>
        </div>
    );
}
