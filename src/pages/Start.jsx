import "../styles/Start.css";
import { useContext, useState } from "preact/hooks";
import { Link } from "wouter";
import { AppStateContext } from "../main.jsx";

export function Start() {
    const { state, dispatch } = useContext(AppStateContext);
    const [unit, setUnit] = useState("metric");
    const [weightInput, setWeightInput] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [heightFt, setHeightFt] = useState("");
    const [heightIn, setHeightIn] = useState("");

    const setField = (field, value) => {
        dispatch({ type: "SET_FIELD", field, value });
    };

    const updateNumberField = (field) => (event) => {
        const value = event.target.value;
        setField(field, value === "" ? "" : Number(value));
    };

    const updateWeightMetric = (event) => {
        const value = event.target.value;
        setWeightInput(value);
        setField("weight", value === "" ? "" : Number(value));
    };

    const updateWeightImperial = (event) => {
        const value = event.target.value;
        setWeightInput(value);
        const pounds = value === "" ? "" : Number(value);
        setField("weight", pounds === "" ? "" : Number((pounds * 0.45359237).toFixed(2)));
    };

    const updateHeightMetric = (event) => {
        const value = event.target.value;
        setHeightCm(value);
        setField("height", value === "" ? "" : Number(value));
    };

    const updateHeightImperial = (nextFt, nextIn) => {
        setHeightFt(nextFt);
        setHeightIn(nextIn);
        if (nextFt === "" && nextIn === "") {
            setField("height", "");
            return;
        }
        const feet = nextFt === "" ? 0 : Number(nextFt);
        const inches = nextIn === "" ? 0 : Number(nextIn);
        const totalInches = feet * 12 + inches;
        setField("height", Number((totalInches * 2.54).toFixed(1)));
    };

    return (
        <div class="start-page">
            <form class="form">
                <div class="unit-toggle">
                    <span>Metric</span>
                    <label class="toggle">
                        <input
                            type="checkbox"
                            checked={unit === "imperial"}
                            onChange={(event) =>
                                setUnit(event.target.checked ? "imperial" : "metric")
                            }
                        />
                        <span class="toggle-track"></span>
                        <span class="toggle-thumb"></span>
                    </label>
                    <span>Imperial</span>
                </div>
                <label>
                    <input
                        type="number"
                        name="age"
                        min="1"
                        placeholder="Age"
                        value={state.age}
                        onInput={updateNumberField("age")}
                    />
                </label>
                {unit === "metric" ? (
                    <>
                        <label>
                            <input
                                type="number"
                                name="weight"
                                placeholder="Weight (kg)"
                                value={weightInput}
                                onInput={updateWeightMetric}
                            />
                        </label>
                        <label>
                            <input
                                type="number"
                                name="height"
                                placeholder="Height (cm)"
                                value={heightCm}
                                onInput={updateHeightMetric}
                            />
                        </label>
                    </>
                ) : (
                    <>
                        <label>
                            <input
                                type="number"
                                name="weight"
                                placeholder="Weight (lb)"
                                value={weightInput}
                                onInput={updateWeightImperial}
                            />
                        </label>
                        <div class="height-row">
                            <label>
                                <input
                                    type="number"
                                    name="height-feet"
                                    placeholder="Ft"
                                    value={heightFt}
                                    onInput={(event) =>
                                        updateHeightImperial(event.target.value, heightIn)
                                    }
                                />
                            </label>
                            <label>
                                <input
                                    type="number"
                                    name="height-inches"
                                    placeholder="In"
                                    value={heightIn}
                                    onInput={(event) =>
                                        updateHeightImperial(heightFt, event.target.value)
                                    }
                                />
                            </label>
                        </div>
                    </>
                )}
                <div class="sex-options">
                    <label class="sex-option">
                        <input
                            type="radio"
                            name="sex"
                            value="1"
                            checked={state.sex === 1}
                            onChange={() => setField("sex", 1)}
                        />
                        <span>Female</span>
                    </label>
                    <label class="sex-option">
                        <input
                            type="radio"
                            name="sex"
                            value="0"
                            checked={state.sex === 0}
                            onChange={() => setField("sex", 0)}
                        />
                        <span>Male</span>
                    </label>
                </div>

                <div class="actions">
                    <Link class="button" href="/bmi">Next</Link>
                </div>
            </form>
        </div>
    );
}
