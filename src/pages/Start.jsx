import "../styles/Start.css";
import { useContext, useEffect, useState } from "preact/hooks";
import { useLocation } from "wouter";
import { AppStateContext } from "../main.jsx";

export function Start() {
    const { state, dispatch } = useContext(AppStateContext);
    const [, setLocation] = useLocation();
    const [unit, setUnit] = useState("metric");
    const [ageInput, setAgeInput] = useState("");
    const [weightInput, setWeightInput] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [heightFt, setHeightFt] = useState("");
    const [heightIn, setHeightIn] = useState("");
    const [errors, setErrors] = useState({});

    const setField = (field, value) => {
        dispatch({ type: "SET_FIELD", field, value });
    };

    const updateNumberField = (field, value) => {
        setField(field, value === "" ? "" : Number(value));
    };

    const isValidIntegerString = (value) =>
        value === "" || /^\d+$/.test(value);

    const cmToImperial = (cmValue) => {
        const totalInches = cmValue / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches - feet * 12);
        if (inches === 12) {
            return { feet: feet + 1, inches: 0 };
        }
        return { feet, inches };
    };

    const validateInteger = (field, value) => {
        const isValid = isValidIntegerString(value);
        setErrors((prev) => ({ ...prev, [field]: isValid ? "" : "Integer" }));
        return isValid;
    };

    const updateIntegerField = (field, onValue, onInvalid) => (event) => {
        const value = event.target.value;
        const valid = validateInteger(field, value);
        if (!valid) {
            onInvalid?.();
            return;
        }
        onValue(value, valid);
    };

    const updateAge = (value, valid) => {
        setAgeInput(value);
        if (value === "") {
            setField("age", "");
            return;
        }
        if (valid) {
            setField("age", Number(value));
        }
    }

    const updateWeightMetric = (value, valid) => {
        setWeightInput(value);
        if (value === "") {
            setField("weight", "");
            return;
        }
        if (valid) {
            setField("weight", Number(value));
        }
    };

    const updateWeightImperial = (value, valid) => {
        setWeightInput(value);
        if (value === "") {
            setField("weight", "");
            return;
        }
        if (valid) {
            const pounds = Number(value);
            setField("weight", Number((pounds * 0.45359237).toFixed(1)));
        }
    };

    const updateHeightMetric = (value, valid) => {
        setHeightCm(value);
        if (value === "") {
            setField("height", "");
            return;
        }
        if (valid) {
            setField("height", Number(value));
        }
    };

    const updateHeightImperial = (nextFt, nextIn, validFt, validIn) => {
        setHeightFt(nextFt);
        setHeightIn(nextIn);
        if (nextFt === "" || nextIn === "") {
            setField("height", "");
            return;
        }
        if (!validFt || !validIn) {
            return;
        }
        const feet = nextFt === "" ? 0 : Number(nextFt);
        const inches = nextIn === "" ? 0 : Number(nextIn);
        const totalInches = feet * 12 + inches;
        setField("height", Number((totalInches * 2.54).toFixed(1)));
    };

    useEffect(() => {
        setErrors({});
    }, []);

    useEffect(() => {
        setAgeInput(state.age === "" ? "" : String(state.age));
        if (state.weight === "") {
            setWeightInput("");
        } else if (unit === "metric") {
            setWeightInput(String(state.weight));
        } else {
            const pounds = Number(state.weight) / 0.45359237;
            setWeightInput(String(Math.round(pounds)));
        }
        if (state.height === "") {
            setHeightCm("");
            setHeightFt("");
            setHeightIn("");
            return;
        }
        if (unit === "metric") {
            setHeightCm(String(state.height));
        } else {
            const { feet, inches } = cmToImperial(Number(state.height));
            setHeightFt(String(feet));
            setHeightIn(String(inches));
        }
    }, [state.age, state.weight, state.height, unit]);

    const isFilledNumber = (value) => Number.isFinite(value) && value > 0;
    const canProceed =
        isFilledNumber(state.age) &&
        isFilledNumber(state.weight) &&
        isFilledNumber(state.height) &&
        (state.sex === 0 || state.sex === 1) &&
        Object.values(errors).every((message) => !message);

    const handleNext = (event) => {
        event.preventDefault();
        if (!canProceed) return;
        setLocation("/bmi");
    };

    return (
        <div class="start-page">
            <form class="form" autoComplete="off" onSubmit={handleNext}>
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
                        class={errors.age ? "has-error" : ""}
                        type="number"
                        name="age"
                        placeholder={errors.age || "Age"}
                        value={ageInput}
                        onInput={updateIntegerField("age", updateAge, () => {
                            setAgeInput("");
                            setField("age", "");
                        })}
                    />
                </label>
                {unit === "metric" ? (
                    <>
                        <label>
                            <input
                                class={errors.weight ? "has-error" : ""}
                                type="number"
                                name="weight"
                                placeholder={errors.weight || "Weight (kg)"}
                                value={weightInput}
                                onInput={updateIntegerField("weight", updateWeightMetric, () => {
                                    setWeightInput("");
                                    setField("weight", "");
                                })}
                            />
                        </label>
                        <label>
                            <input
                                class={errors.height ? "has-error" : ""}
                                type="number"
                                name="height"
                                placeholder={errors.height || "Height (cm)"}
                                value={heightCm}
                                onInput={updateIntegerField("height", updateHeightMetric, () => {
                                    setHeightCm("");
                                    setField("height", "");
                                })}
                            />
                        </label>
                    </>
                ) : (
                    <>
                        <label>
                            <input
                                class={errors.weight ? "has-error" : ""}
                                type="number"
                                name="weight"
                                placeholder={errors.weight || "Weight (lb)"}
                                value={weightInput}
                                onInput={updateIntegerField("weight", updateWeightImperial, () => {
                                    setWeightInput("");
                                    setField("weight", "");
                                })}
                            />
                        </label>
                        <div class="height-row">
                            <label>
                                <input
                                    class={errors.heightFt ? "has-error" : ""}
                                    type="number"
                                    name="height-feet"
                                    placeholder={errors.heightFt || "Ft"}
                                    value={heightFt}
                                    onInput={updateIntegerField("heightFt", (value, valid) =>
                                        updateHeightImperial(
                                            value,
                                            heightIn,
                                            valid,
                                            isValidIntegerString(heightIn)
                                        )
                                    , () => {
                                        setHeightFt("");
                                        setField("height", "");
                                    })}
                                />
                            </label>
                            <label>
                                <input
                                    class={errors.heightIn ? "has-error" : ""}
                                    type="number"
                                    name="height-inches"
                                    placeholder={errors.heightIn || "In"}
                                    value={heightIn}
                                    onInput={updateIntegerField("heightIn", (value, valid) =>
                                        updateHeightImperial(
                                            heightFt,
                                            value,
                                            isValidIntegerString(heightFt),
                                            valid
                                        )
                                    , () => {
                                        setHeightIn("");
                                        setField("height", "");
                                    })}
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
                            value="0"
                            checked={state.sex === 0}
                            onChange={() => setField("sex", 0)}
                        />
                        <span>Female</span>
                    </label>
                    <label class="sex-option">
                        <input
                            type="radio"
                            name="sex"
                            value="1"
                            checked={state.sex === 1}
                            onChange={() => setField("sex", 1)}
                        />
                        <span>Male</span>
                    </label>
                </div>

                <div class="actions">
                    <button class="button" type="submit" disabled={!canProceed}>
                        Next
                    </button>
                </div>
            </form>
        </div>
    );
}
