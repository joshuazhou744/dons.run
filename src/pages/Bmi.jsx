import "../styles/Bmi.css";
import { Link } from "wouter";

export function Bmi() {
    return (
        <section>
            <h2>BMI</h2>
            <div class="placeholder">[BMI step layout]</div>
            <div class="actions">
                <Link class="button" href="/bodyfat">Next</Link>
            </div>
        </section>
    );
}
