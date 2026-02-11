import { useRef } from "preact/hooks";
import { useLocation } from "wouter";
import "../styles/PageTransition.css";

const routeOrder = ["/start", "/bmi", "/bodyfat", "/results", "/location", "/run"];

function routeIndex(path) {
    const idx = routeOrder.indexOf(path);
    return idx === -1 ? 0 : idx;
}

export function PageTransition({ children }) {
    const [location] = useLocation();
    const prevLocation = useRef(location);
    const direction = useRef("forward");

    if (location !== prevLocation.current) {
        const prev = routeIndex(prevLocation.current);
        const next = routeIndex(location);
        direction.current = next >= prev ? "forward" : "back";
        prevLocation.current = location;
    }

    return (
        <div className={`page-transition page-transition--${direction.current}`} key={location}>
            {children}
        </div>
    );
}
