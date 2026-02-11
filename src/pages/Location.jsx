import "../styles/Run.css";
import { useEffect, useState } from "preact/hooks";
import { Link } from "wouter";

export function Location() {
    const [permission, setPermission] = useState("unknown");
    const [status, setStatus] = useState("idle");
    const [coords, setCoords] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let permStatus = null;

        const init = async () => {
            if (!("geolocation" in navigator)) {
                setPermission("unsupported");
                return;
            }

            if (!navigator.permissions?.query) {
                setPermission("unknown");
                return;
            }

            try {
                permStatus = await navigator.permissions.query({ name: "geolocation" });
                setPermission(permStatus.state);
                permStatus.onchange = () => setPermission(permStatus.state);
            } catch {
                setPermission("unknown");
            }
        };

        init();

        return () => {
            if (permStatus) permStatus.onchange = null;
        };
    }, []);

    const requestLocation = ({ silent } = { silent: false }) => {
        setError("");
        setStatus("requesting");

        if (!navigator.geolocation) {
            setPermission("unsupported");
            setStatus("idle");
            setError("Geolocation is not supported in this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const c = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracyM: pos.coords.accuracy,
                };
                setCoords(c);
                setPermission("granted");
                setStatus("ready");
                sessionStorage.setItem("run-coords", JSON.stringify(c));
            },
            (err) => {
                if (err?.code === err.PERMISSION_DENIED) setPermission("denied");
                setStatus("idle");
                if (!silent) setError(err?.message || "Unable to get location.");
            },
            {
                enableHighAccuracy: false,
                timeout: 10_000,
                maximumAge: 30_000,
            }
        );
    };

    // If permission is already granted, fetch location automatically (no prompt UI).
    useEffect(() => {
        if (permission !== "granted") return;
        if (coords) return;
        if (status === "requesting") return;
        requestLocation({ silent: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permission]);

    const canRun = permission === "granted" && !!coords;

    return (
        <div class="run-shell">
            <div class="run-modal">
                <div class="run-modal_panel">
                    <div class="run-row">
                        <span class="run-label">We need your location.</span>
                        <span class={`run-pill run-pill--${permission}`}>{permission}</span>
                    </div>

                    {error && <p class="run-error">{error}</p>}

                    {permission === "granted" && coords && (
                        <div class="run-coords">
                            <div><span class="run-label">Lat</span> {coords.lat.toFixed(6)}</div>
                            <div><span class="run-label">Lng</span> {coords.lng.toFixed(6)}</div>
                            <div><span class="run-label">Accuracy</span> {Math.round(coords.accuracyM)}m</div>
                        </div>
                    )}

                    <div class="run-actions">
                        <Link class="button" href="/results">Back</Link>

                        {permission === "granted" ? (
                            <Link
                                class={`button${!canRun ? " button--disabled" : ""}`}
                                href={canRun ? "/run" : "#"}
                                onClick={(e) => { if (!canRun) e.preventDefault(); }}
                            >
                                Run
                            </Link>
                        ) : (
                            <button
                                class="button"
                                type="button"
                                onClick={() => requestLocation({ silent: false })}
                                disabled={status === "requesting" || permission === "unsupported"}
                            >
                                {status === "requesting" ? "Requesting…" : "Enable location"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
