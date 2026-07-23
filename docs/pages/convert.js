export function page() {
    return `
        <div id = "convert">
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

            <div class = "error hidden" id = "convert-error">
                <h3 id = "convert-error-code"></h3>
                <p id = "convert-error-detail"></p>
            </div>
        </div>
    `
}

import {call_api, error_codes} from "../extra-functions.js";

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

    const error = document.getElementById("convert-error");
    const error_code = document.getElementById("convert-error-code");
    const error_detail = document.getElementById("convert-error-detail");

    submit_button.addEventListener("click", async function () {
        var formula = formula_input.value;
        formula = formula.trim();
    
        var unit_count = unit_input.value;
        
        if (formula && unit_count) {
            var dict = {}
            dict["formula"] = formula;
            if (radio_mass.checked) {
                dict["mass"] = unit_count;
            } else {
                dict["mol"] = unit_count;
            };  

            const response = await call_api(dict, "/convert");
            const response_data = response["data"];

            if (response["ok"]) {
                error.classList.add("hidden")

                output_formula.textContent = response_data["entered_formula"];
                if (radio_mass.checked) {
                    output_mass.textContent = response_data["entered_mass"]
                    output_mol.textContent = response_data["data"]["mol"]
                } else {
                    output_mol.textContent = response_data["entered_mol"]
                    output_mass.textContent = response_data["data"]["mass"]
                };
                

                output.classList.remove("hidden");
            } else {
                output.classList.add("hidden");
                if (!(isFinite(unit_count))) {
                    error_detail.textContent = "Amount must be number";
                } else {
                    error_detail.textContent = response["data"]["detail"];
                }

                error_code.textContent = error_codes[response["code"]];
                error.classList.remove("hidden");
            }
        } else {
            error_code.textContent = error_codes[422];
            var missing = ""
            if (formula && !(unit_count)) {
                missing = "Amount"
            } else if (!(formula) && unit_count) {
                missing = "Formula"
            } else {
                missing = "Formula and amount"
            }
            error_detail.textContent = `${missing} missing`

            error.classList.remove("hidden");
        }
    })

    clear_button.addEventListener("click", function () {
        formula_input.value = "";
        unit_input.value = "";
        output.classList.add("hidden");
        error.classList.add("hidden");
    })
    
}