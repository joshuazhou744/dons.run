import "../styles/BodyFat.css";
import { Link } from "wouter";
import { AppStateContext } from "../main.jsx";
import { useContext, useEffect, useMemo } from "preact/hooks";

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

    return (
        <section>
            <h2>Body Fat</h2>
            <div class="placeholder">{bodyFat ?? "--"}</div>
            <div class="actions">
                <Link class="button" href="/bmi">Previous</Link>
                <Link class="button" href="/results">Next</Link>
            </div>
        </section>
    );
}
