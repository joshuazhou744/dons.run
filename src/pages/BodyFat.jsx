import "../styles/BodyFat.css";
import { Link } from "wouter";

export function BodyFat() {
    return (
        <section>
            <h2>Body Fat</h2>
            <div class="placeholder">[Body fat step layout]</div>
            <div class="actions">
                <Link class="button" href="/results">Next</Link>
            </div>
        </section>
    );
}
