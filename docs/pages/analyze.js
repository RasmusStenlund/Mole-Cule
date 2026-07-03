export function page() {
    return `
        <div class = "analyze">
            <div class = "enter">
            <p>Formula</p>
                <div class = "write">
                    <input type = "text" id = "analyze-formula" name = "formula" placeholder = "e.g H2O" required>
                </div>
                <div class = "buttons">
                        <input type = "button" class = "submit-button" id = "analyze-submit" value = "Analyze">
                        <input type = "button" class = "clear-button" id = "analyze-clear" value = "Clear">
                </div>
            </div>
            
            <div class = "data hidden" id = "analyze-data">
                <div class = "formula">
                    <p id = "analyze-data-formula">XY</p>
                    <p class = "molar_mass" id = "analyze-molar-mass">Molar mass: 000.000 g/mol</p>
                </div>

                <div class = "desktop">
                    <p>Element</p>
                    <p>Count</p>
                    <p>Unit mass (u)</p>
                    <p>Total mass (u)</p>
                    <p>Mass %</p>
                </div>
                <div id = "analyze-card-container"></div>
            </div>

            <div class = "error hidden" id = "analyze-error">
                <h3 id = "analyze-error-code"></h3>
                <p id = "analyze-error-detail"></p>
            </div>
        </div>
    `
}

function mobile_header(text, card) {
    const p = document.createElement("p");
    p.classList.add("mobile");
    p.textContent = text;
    card.appendChild(p);
}

import {call_api, error_codes} from "../extra-functions.js"

export function setup() {
    const submit_button = document.getElementById("analyze-submit");
    const clear_button = document.getElementById("analyze-clear");
    const formula_input = document.getElementById("analyze-formula");

    const output = document.getElementById("analyze-data");
    const formula_output = document.getElementById("analyze-data-formula");
    const mol_mass = document.getElementById("analyze-molar-mass");
    const card_container = document.getElementById("analyze-card-container");

    const error = document.getElementById("analyze-error");
    const error_code = document.getElementById("analyze-error-code");
    const error_detail = document.getElementById("analyze-error-detail");

    submit_button.addEventListener("click", async function () {
        var formula = formula_input.value;
        formula = formula.trim()
        
        if (formula) {
            var dict = {};
            dict["formula"] = formula;
            const response = await call_api(dict, "/analyze");

            if (response["ok"]) {
                error.classList.add("hidden")
                const response_data = response["data"]
                const molar_mass = response_data["molar_mass"];
                mol_mass.textContent = `Molar mass: ${response_data["molar_mass"]} g/mol`

                const elements_data = response_data["elements_data"];
                card_container.innerHTML = "";
                for (let element in elements_data) {
                    const card = document.createElement("div");
                    card.classList.add("element-card");

                    const element_value = document.createElement("p");
                    element_value.classList.add("value");
                    element_value.textContent = element;
                    card.appendChild(element_value)
                    mobile_header("", card);

                    mobile_header("Count:", card);
                    const count = document.createElement("p");
                    count.classList.add("value");
                    count.textContent = elements_data[element]["count"];
                    card.appendChild(count);

                    mobile_header("Unit mass (u):", card);
                    const unit_mass = document.createElement("p");
                    unit_mass.classList.add("value");
                    unit_mass.textContent = elements_data[element]["atomic_mass"];
                    card.appendChild(unit_mass);

                    mobile_header("Total mass (u):", card);
                    const total_mass = document.createElement("p");
                    total_mass.classList.add("value");
                    total_mass.textContent = elements_data[element]["mass_contribution"];
                    card.appendChild(total_mass); 

                    mobile_header("Mass %:", card);
                    const mass_percent = document.createElement("p");
                    mass_percent.classList.add("value");
                    mass_percent.textContent = elements_data[element]["mass_percent"];
                    card.appendChild(mass_percent);

                    card_container.appendChild(card);
                }

                output.classList.remove("hidden")

                formula_output.textContent = formula;
            } else {
                output.classList.add("hidden");

                error_code.textContent = error_codes[response["code"]];
                error_detail.textContent = response["data"]["detail"];

                error.classList.remove("hidden");
            }
        } else {
            error_code.textContent = error_codes[422];
            error_detail.textContent = "Missing formula"

            error.classList.remove("hidden");
        }
    })

    clear_button.addEventListener("click", function () {
        formula_input.value = "";
        
        output.classList.add("hidden");
        error.classList.add("hidden");
    })

}
