import "../styles/Bmi.css";
import { Link } from "wouter";
import { AppStateContext } from "../main.jsx";
import { useContext, useEffect, useMemo } from "preact/hooks";

const categories = [
    { label: "Underweight", max: 18.5, color: "#5b8fb9" },
    { label: "Normal", max: 25, color: "#4a9b6e" },
    { label: "Overweight", max: 30, color: "#c9953c" },
    { label: "Obese", max: 100, color: "#c95b4a" },
];

function getCategory(bmi) {
    for (const cat of categories) {
        if (bmi < cat.max) return cat;
    }
    return categories[categories.length - 1];
}

// Gauge range: 15 to 40
const GAUGE_MIN = 15;
const GAUGE_MAX = 40;

function gaugePercent(value) {
    return Math.max(0, Math.min(100, ((value - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100));
}

export function Bmi() {
    const { state, dispatch } = useContext(AppStateContext);

    const bmi = useMemo(() => {
        const weight = Number(state.weight);
        const height = Number(state.height);
        if (!Number.isFinite(weight) || !Number.isFinite(height) || height <= 0) {
            return null;
        }
        const meters = height / 100;
        return Number((weight / (meters * meters)).toFixed(1));
    }, [state.weight, state.height]);

    useEffect(() => {
        if (bmi === null) return;
        if (state.bmi === bmi) return;
        dispatch({ type: "SET_FIELD", field: "bmi", value: bmi });
    }, [bmi, dispatch, state.bmi]);

    const category = bmi !== null ? getCategory(bmi) : null;
    const markerPos = bmi !== null ? gaugePercent(bmi) : 0;

    return (
        <section class="metric-page">
            <div class="metric-content">
                <h2>BMI</h2>
                <div class="metric-value">{bmi ?? "--"}</div>
                {category && (
                    <div class="metric-category" style={{ color: category.color }}>
                        {category.label}
                    </div>
                )}
                {bmi !== null && (
                    <div class="gauge">
                        <div class="gauge-track">
                            {categories.map((cat, i) => {
                                const start = i === 0 ? GAUGE_MIN : categories[i - 1].max;
                                const end = Math.min(cat.max, GAUGE_MAX);
                                const left = gaugePercent(start);
                                const width = gaugePercent(end) - left;
                                return (
                                    <div
                                        key={cat.label}
                                        class="gauge-segment"
                                        style={{
                                            left: `${left}%`,
                                            width: `${width}%`,
                                            backgroundColor: cat.color,
                                        }}
                                    />
                                );
                            })}
                            <div
                                class="gauge-marker"
                                style={{ left: `${markerPos}%` }}
                            />
                        </div>
                        <div class="gauge-labels">
                            <span>15</span>
                            <span>18.5</span>
                            <span>25</span>
                            <span>30</span>
                            <span>40</span>
                        </div>
                    </div>
                )}
            </div>
            <div class="actions">
                <Link class="button" href="/start">Previous</Link>
                <Link class="button" href="/bodyfat">Next</Link>
            </div>
        </section>
    );
}
