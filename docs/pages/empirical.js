export function page() {
    return `
        <div id = "empirical">
            <div class = "enter">
                <p>Composition</p>
                <div class = "composition-maker">
                    <div id = "empirical-part-list">
                        <div class = "empirical-part show">
                            <input type = "text" class = "empirical-element" placeholder = "Element">
                            <p>:</p>
                            <input type = "text" class = "empirical-mass-percentage" placeholder = "Mass %">
                        </div>
                    </div>

                    <input type = "button" class = "add-button" id = "empirical-add-element" value = "+ Element">
                </div>

                <div class = "empirical-optional">
                    <div class = "optional-molar-mass">
                        <p>(Optional) Molar mass</p>
                        <input type = "text" id = "empirical-molar-mass">
                    </div>
                    <div class = "optional-hydrate">
                        <label class = "hydrate-container">Is Hydrate?
                            <input type = "checkbox" id = "empirical-hydrate-check">
                            <span class = "checkmark"></span>
                        </label>
                    
                        <div class = "optional-hydrate-data">
                            <div class = "hydrate-mass">
                                <p>Hydrate mass (Before burning)</p>
                                <input type = "text" id = "empirical-hydrate-mass" placeholder = "(g)">
                            </div>
                            <div class = "anhydrous-mass">
                                <p>Anhydrous mass (After burning)</p>
                                <input type = "text" id = "empirical-anhydrous-mass" placeholder = "(g)">
                            </div>
                        </div>
                    </div>
                </div>

                <div class = "buttons">
                    <input type = "button" class = "submit-button" id = "empirical-submit" value = "Get Empirical">
                    <input type = "button" class = "clear-button" id = "empirical-clear" value = "Clear">
                </div>
            </div>

            <div class = "data hidden" id = "empirical-data">
                <div class = "empirical-part">
                    <h4>Empirical</h4>
                    <div class = "empirical-data">
                        <p id = "empirical-empirical-formula">XY</p>
                        <p id = "empirical-empirical-mass">60 g/mol</p>
                    </div>
                </div>
                <div class = "molecular-part hidden" id = "empirical-molecular">
                    <h4>Molecular</h4>
                    <div class = "molecular-data">
                        <p id = "empirical-molecular-formula">X2Y2</p>
                        <p id = "empirical-molecular-mass">120 g/mol</p>
                    </div>
                </div>
                <p class = "hidden" id = "empirical-warning">Warning: Entered molar mass doesn't match calculated</p>
            </div>

            <div class = "error hidden" id = "empirical-error">
                <h3 id = "empirical-error-code"></h3>
                <p id = "empirical-error-detail"></p>
            </div>
        </div>
    `
}

function create_empirical_part(empirical_list) {
    const element_input = document.createElement("input");
    element_input.type = "text";
    element_input.classList.add("empirical-element");
    element_input.placeholder = "Element";

    const colon = document.createElement("p");
    colon.textContent = ":"

    const percent_input = document.createElement("input");
    percent_input.type = "text";
    percent_input.classList.add("empirical-mass-percentage");
    percent_input.placeholder = "Mass %";

    const element_part = document.createElement("div");
    element_part.classList.add("empirical-part");
    element_part.appendChild(element_input);
    element_part.appendChild(colon);
    element_part.appendChild(percent_input);

    empirical_list.appendChild(element_part)

    setTimeout(function () {
        element_part.classList.add("show")
    }, 10)
}

function make_composition(empirical_list) {
    var composition = {}
    for (const empirical_part of empirical_list.children) {
        const element = empirical_part.querySelector(".empirical-element").value.trim();
        const percent = empirical_part.querySelector(".empirical-mass-percentage").value.trim();

        if (element && isFinite(percent) && percent !== "") {
            composition[element] = parseFloat(percent)
        } else if (!(element) && !(percent)) {
            continue
        } else {
            var reason = ""
            if (!(element)) {
                reason = "Element(s) in composition missing";
            } else if (percent === "") {
                reason = "Percentage(s) in composition missing";
            } else {
                reason = "Percentage(s) must be a number";
            }
            return {"status": false, "data": reason};
        }
    }

    if (Object.keys(composition).length == 0) {
        return {"status": false, "data": "No elements in composition"};
    }

    return {"status": true, "data": composition};
}

import {call_api, error_codes} from "../extra-functions.js";

export function setup() {
    const empirical_list = document.getElementById("empirical-part-list");
    const add_element = document.getElementById("empirical-add-element");

    add_element.addEventListener("click", function () {
        create_empirical_part(empirical_list);
    })

    const submit_button = document.getElementById("empirical-submit");
    const clear_button = document.getElementById("empirical-clear");
    const output = document.getElementById("empirical-data");
    const check = document.getElementById("empirical-hydrate-check");
    const molar_mass_input = document.getElementById("empirical-molar-mass");

    const hydrate_mass_input = document.getElementById("empirical-hydrate-mass");
    const anhydrous_mass_input = document.getElementById("empirical-anhydrous-mass");

    const empirical_formula = document.getElementById("empirical-empirical-formula");
    const empirical_mass = document.getElementById("empirical-empirical-mass");

    const molecular_output = document.getElementById("empirical-molecular");
    const molecular_formula = document.getElementById("empirical-molecular-formula");
    const molecular_mass = document.getElementById("empirical-molecular-mass");

    const error = document.getElementById("empirical-error");
    const error_code = document.getElementById("empirical-error-code");
    const error_detail = document.getElementById("empirical-error-detail");

    check.addEventListener("change", function () {
        hydrate_mass_input.value = "";
        anhydrous_mass_input.value = "";
    })

    clear_button.addEventListener("click", function () {
        empirical_list.innerHTML = "";
        create_empirical_part(empirical_list);
        molar_mass_input.value = ""
        output.classList.add("hidden");
        error.classList.add("hidden");
        check.checked = false;
    })

    submit_button.addEventListener("click", async function () {
        const composition_data = make_composition(empirical_list);
        const molar_mass = molar_mass_input.value.trim();
        
        if (composition_data["status"]) {
            const composition = composition_data["data"];
            var molecular = false;
            var verify_mol = true;

            var hydrate = false;
            var verify_hydrate = true;
            var hydrate_error = "";

            var dict = {};
            dict["composition"] = composition;

            if (molar_mass !== "") {
                molecular = true
                
                if (isFinite(molar_mass)) {
                    molecular_output.classList.remove("hidden");
                    dict["molar_mass"] = molar_mass;
                    verify_mol = true;
                } else {
                    verify_mol = false;
                }
            } else {
                molecular_output.classList.add("hidden");
            };

            const hydrate_mass = hydrate_mass_input.value.trim();
            const anhydrous_mass = anhydrous_mass_input.value.trim();

            if (check.checked) {
                dict["is_hydrate"] = true;
                hydrate = true;
                verify_hydrate = false;
                if (!(hydrate_mass) && !(anhydrous_mass)) {   
                    hydrate_error = "Hydrate and anhydrous masses are missing"
                } else if (!(hydrate_mass)) {
                    hydrate_error = "Hydrate mass is missing"
                } else if (!(anhydrous_mass)) {
                    hydrate_error = "Anhydrous mass is missing"
                } else if (!(isFinite(hydrate_mass)) || !(isFinite(anhydrous_mass))){
                    hydrate_error = "Hydrate and anhydrous masses must be numbers"  
                } else {
                    verify_hydrate = true;
                    dict["hydrate_mass"] = hydrate_mass;
                    dict["anhydrous_mass"] = anhydrous_mass;
                }
            }

            if (molecular && !(verify_mol)) {
                output.classList.add("hidden")

                error_code.textContent = error_codes[422];
                error_detail.textContent = "Molar mass must be a number";

                error.classList.remove("hidden");
            } else if (hydrate && !(verify_hydrate)){
                output.classList.add("hidden");

                error_code.textContent = error_codes[422];
                error_detail.textContent = hydrate_error;

                error.classList.remove("hidden");
            } else {
                const response = await call_api(dict, "/empirical");
                const response_data = response["data"];
                if (response["ok"]) {
                    error.classList.add("hidden");
                    empirical_formula.textContent = response_data["data"]["empirical"]["formula"];
                    empirical_mass.textContent = `${response_data["data"]["empirical"]["molar_mass"]} g/mol`;

                    if (molecular) {
                        molecular_formula.textContent = response_data["data"]["molecular"]["formula"];
                        molecular_mass.textContent = `${response_data["data"]["molecular"]["molar_mass"]} g/mol`;
                    }

                    output.classList.remove("hidden");
                } else {
                    output.classList.add("hidden");

                    error_code.textContent = error_codes[response["code"]];
                    error_detail.textContent = response["data"]["detail"];

                    error.classList.remove("hidden");
                }
            }
        } else {
            output.classList.add("hidden");

            error_code.textContent = error_codes[422];
            error_detail.textContent = composition_data["data"];

            error.classList.remove("hidden");
        }
    })

}