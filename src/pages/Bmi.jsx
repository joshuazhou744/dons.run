import "../styles/Bmi.css";
import { Link } from "wouter";
import { AppStateContext } from "../main.jsx";
import { useContext, useEffect, useMemo } from "preact/hooks";

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

    return (
        <section>
            <h2>BMI</h2>
            <div>{bmi ?? "--"}</div>
            <div class="actions">
                <Link class="button" href="/start">Previous</Link>
                <Link class="button" href="/bodyfat">Next</Link>
            </div>
        </section>
    );
}
