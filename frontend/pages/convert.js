export function page() {
    return `
        <div class = "convert">
            <div class = "enter">
                <p>Formula</p>
                <input type = "text" id = "convert-formula" name = "formula" placeholder = "e.g H2O" required>

                <p>Value to convert</p>
                <div class = "unit">
                    <div class = "toggle-unit">
                        <input type = "radio" id = "convert-radio-mol" name = "unit" value = "mol">
                        <label for = "convert-radio-mol">Mol</label>

                        <input type = "radio" id = "convert-radio-mass" name = "unit" value = "mass" checked>
                        <label for = "convert-radio-mass">Mass</label>

                        <div class = "slider"></div>
                    </div>

                    <input class = "write-unit" type = "text" id = "convert-unit-count" name = "count" required>

                </div>

                <div class = "buttons">
                    <input type = "button" class = "submit-button" id = "convert-submit" value = "Convert">
                    <input type = "button" class = "clear-button" id = "convert-clear" value = "Clear">
                </div>
            </div>

            <div class = "data hidden" id = "convert-data">
                <p class = "formula" id = "convert-data-formula">XY</p>

                <div class = "count-data">
                    <div class = "mol-data">
                        <h4>Mol</h4>
                        <p class = "data-mol" id = "convert-data-mol">00.00</p>
                    </div>

                    <div class = "mass-data">
                        <h4>Mass (g)</h4>
                        <p class = "data-mass" id = "convert-data-mass">000.000</p>
                    </div>
                </div>
            </div>
        </div>
    `
}

import {call_api} from "../extra-functions.js";

export function setup() {
    const formula_input = document.getElementById("convert-formula");
    const unit_input = document.getElementById("convert-unit-count")
    const submit_button = document.getElementById("convert-submit");
    const clear_button = document.getElementById("convert-clear");

    const radio_mol = document.getElementById("convert-radio-mol");
    const radio_mass = document.getElementById("convert-radio-mass");

    const output = document.getElementById("convert-data");
    const output_formula = document.getElementById("convert-data-formula");
    const output_mass = document.getElementById("convert-data-mass");
    const output_mol = document.getElementById("convert-data-mol");

    submit_button.addEventListener("click", async function () {
        var formula = formula_input.value;
        var unit_count = unit_input.value;

        formula = formula.trim();
        if (formula && unit_count) {
            var dict = {}
            dict["formula"] = formula;
            if (radio_mass.checked) {
                dict["mass"] = unit_count;
            } else {
                dict["mol"] = unit_count;
            };  

            const response = await call_api(dict, "/convert");

            output_formula.textContent = response["entered_formula"];
            if (radio_mass.checked) {
                output_mass.textContent = response["entered_mass"]
                output_mol.textContent = response["data"]["mol"]
            } else {
                output_mol.textContent = response["entered_mol"]
                output_mass.textContent = response["data"]["mass"]
            };
            

            output.classList.remove("hidden");
        }
    })

    clear_button.addEventListener("click", function () {
        formula_input.value = "";
        unit_input.value = "";
        output.classList.add("hidden");
    })
    
}