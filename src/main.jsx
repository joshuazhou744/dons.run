import { render } from "preact";
import { createContext } from "preact";
import { useMemo, useReducer, useEffect } from "preact/hooks";
import { Route, Switch } from "wouter";
import { Start } from "./pages/Start.jsx";
import { Bmi } from "./pages/Bmi.jsx";
import { BodyFat } from "./pages/BodyFat.jsx";
import { Results } from "./pages/Results.jsx";
import "./styles/App.css";

const initialState = {
    age: "",
    weight: "",
    height: "",
    sex: null,
};

function reducer(state, action) {
    switch (action.type) {
        case "SET_FIELD":
            return { ...state, [action.field]: action.value };
        case "RESET":
            return initialState;
        default:
            return state;
    }
}

export const AppStateContext = createContext({
    state: initialState,
    dispatch: () => {},
});

function App() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const value = useMemo(() => ({ state, dispatch }), [state]);

    useEffect(() => {
        console.log(state);
    }, [state])

    return (
        <AppStateContext.Provider value={value}>
            <main class="app">
                <header class="app_header">
                    <a href="/start" class="reset">Restart</a>
                </header>
                <Switch>
                    <Route path="/start" component={Start} />
                    <Route path="/bmi" component={Bmi} />
                    <Route path="/bodyfat" component={BodyFat} />
                    <Route path="/results" component={Results} />
                    <Route>
                        <Start />
                    </Route>
                </Switch>
            </main>
        </AppStateContext.Provider>
    );
}

render(<App />, document.getElementById("app"));
