import "../styles/BodyFat.css";
import { Link } from "wouter";
import { AppStateContext } from "../main.jsx";
import { useContext, useEffect, useMemo } from "preact/hooks";

const archetypes = {
    // sex: 1 = male, 0 = female
    1: [
        { label: "Essential", max: 6, color: "#c95b4a" },
        { label: "Athlete", max: 14, color: "#5b8fb9" },
        { label: "Fitness", max: 18, color: "#4a9b6e" },
        { label: "Average", max: 25, color: "#c9953c" },
        { label: "Obese", max: 60, color: "#c95b4a" },
    ],
    0: [
        { label: "Essential", max: 14, color: "#c95b4a" },
        { label: "Athlete", max: 21, color: "#5b8fb9" },
        { label: "Fitness", max: 25, color: "#4a9b6e" },
        { label: "Average", max: 32, color: "#c9953c" },
        { label: "Obese", max: 60, color: "#c95b4a" },
    ],
};

const GAUGE_MIN = 3;
const GAUGE_MAX = 45;

function gaugePercent(value) {
    return Math.max(0, Math.min(100, ((value - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100));
}

function getArchetype(bodyFat, sex) {
    const list = archetypes[sex];
    if (!list) return null;
    for (const arch of list) {
        if (bodyFat < arch.max) return arch;
    }
    return list[list.length - 1];
}

export function BodyFat() {
    const { state, dispatch } = useContext(AppStateContext);

    const bodyFat = useMemo(() => {
        const age = Number(state.age);
        const bmi = Number(state.bmi);
        const sex = Number(state.sex);
        if (!Number.isFinite(age) || !Number.isFinite(bmi)) {
            return null;
        }
        if (sex !== 0 && sex !== 1) {
            return null;
        }
        const estimate = 1.2 * bmi + 0.23 * age - 10.8 * sex - 5.4;
        return Number(estimate.toFixed(1));
    }, [state.age, state.bmi, state.sex]);

    useEffect(() => {
        if (bodyFat === null) return;
        if (state.bodyFatPercent === bodyFat) return;
        dispatch({ type: "SET_FIELD", field: "bodyFatPercent", value: bodyFat });
    }, [bodyFat, dispatch, state.bodyFatPercent]);

    const sex = Number(state.sex);
    const archetype = bodyFat !== null ? getArchetype(bodyFat, sex) : null;
    const markerPos = bodyFat !== null ? gaugePercent(bodyFat) : 0;
    const cats = archetypes[sex] || archetypes[1];

    return (
        <section class="metric-page">
            <div class="metric-content">
                <h2>Body Fat</h2>
                <div class="metric-value">{bodyFat !== null ? `${bodyFat}%` : "--"}</div>
                {archetype && (
                    <div class="metric-category" style={{ color: archetype.color }}>
                        {archetype.label}
                    </div>
                )}
                {bodyFat !== null && (
                    <div class="gauge">
                        <div class="gauge-track">
                            {cats.map((cat, i) => {
                                const start = i === 0 ? GAUGE_MIN : cats[i - 1].max;
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
                        <div class="archetype-labels">
                            {cats.map((cat) => (
                                <span key={cat.label}>{cat.label}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div class="actions">
                <Link class="button" href="/bmi">Previous</Link>
                <Link class="button" href="/results">Next</Link>
            </div>
        </section>
    );
}
