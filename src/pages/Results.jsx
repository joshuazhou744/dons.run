import "../styles/Results.css";
import { Link } from "wouter";
import { useContext, useMemo } from "preact/hooks";
import { AppStateContext } from "../main.jsx";
import { FatVisualization, pickReference } from "../components/FatVisualization.jsx";

export function Results() {
    const { state } = useContext(AppStateContext);

    const fatMassLbs = useMemo(() => {
        const weight = Number(state.weight);
        const bodyFatPercent = Number(state.bodyFatPercent);
        if (!Number.isFinite(weight) || !Number.isFinite(bodyFatPercent)) {
            return 0;
        }
        const weightLbs = weight / 0.45359237;
        return (bodyFatPercent / 100) * weightLbs;
    }, [state.weight, state.bodyFatPercent]);

    const fatMassKg = useMemo(() => {
        return fatMassLbs * 0.45359237;
    }, [fatMassLbs]);

    const ref = useMemo(() => pickReference(fatMassLbs), [fatMassLbs]);

    const refSwatchStyle = useMemo(() => ({
        backgroundColor: `rgb(${Math.round(ref.color[0] * 255)}, ${Math.round(ref.color[1] * 255)}, ${Math.round(ref.color[2] * 255)})`,
    }), [ref]);

    return (
        <section class="results-page">
            <h2>Your results</h2>
            <div class="results-summary">
                <div class="stat">
                    <span class="stat-label">BMI</span>
                    <span class="stat-value">{state.bmi ?? "--"}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Body Fat %</span>
                    <span class="stat-value">{state.bodyFatPercent ?? "--"}%</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Fat Mass</span>
                    <span class="stat-value">
                        {fatMassKg > 0 ? `${fatMassKg.toFixed(1)} kg / ${fatMassLbs.toFixed(1)} lb` : "--"}
                    </span>
                </div>
            </div>
            <div class="visualization-container">
                <FatVisualization fatMassLbs={fatMassLbs} />
                <div class="viz-legend">
                    <div class="viz-legend-item">
                        <span class="viz-swatch viz-swatch--fat" />
                        <span>Body fat</span>
                    </div>
                    <div class="viz-legend-item">
                        <span class="viz-swatch" style={refSwatchStyle} />
                        <span>{ref.name}</span>
                    </div>
                </div>
            </div>
            <div class="results-actions">
                <Link class="button" href="/bodyfat">Previous</Link>
                <Link class="button" href="/start">Start Over</Link>
                <Link class="button" href="/run">Take me to the promised land</Link>
            </div>
        </section>
    );
}
