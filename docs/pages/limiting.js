export function page() {
    return `
        <div id = "limiting">
            <div class = "enter">
                <p>Composition</p>
                <div class = "equation-maker">
                    <p>Reactants</p>
                    <div class = "equation-side" id = "limiting-reactants-side">
                        <div class = "equation-part-container">
                            <input type = "text" class = "reactant-input" placeholder = "Reactant">
                        </div>
                    </div>
                    <input type = "button" id = "limiting-add-reactant" class = "add-button" value = "+ Reactant">
                    <p class = "arrow">&#8594</p>
                    <p>Products</p>
                    <div class = "equation-side" id = "limiting-products-side">
                        <div class = "equation-part-container">
                            <input type = "text" class = "product-input" placeholder = "Product">
                        </div>
                    </div>
                    <input type = "button" id = "limiting-add-product" class = "add-button" value = "+ Product">
                </div>

                <p>Reactants Mol</p>
                <div class = "reactants-mol-list"" id = "limiting-mol-list">
                </div>

                <div class = "buttons">
                    <input type = "button" class = "submit-button" id = "limiting-submit" value = "Get Limiting">
                    <input type = "button" class = "clear-button" id = "limiting-clear" value = "Clear">
                </div>
            </div>
            <div class = "data hidden" id = "limiting-data">
                <div class = "equation">
                    <h4>Equation</h4>
                    <p id = "limiting-equation">X2 + 2Y -> 2XY</p>
                </div>
                
                <div class = "limiting-reactant">
                    <h4>Limiting Reactant</h4>
                    <p id = "limiting-limiting-reactant">X2</p>
                </div>

                <div class = "theoretical">
                    <h4>Theoretical Yields</h4>
                    <div class = "theo-yields-list" id = "limiting-theoretical-yields">
                        <div class = "theo-yield">
                            <p>XY</p>
                            <p>:</p>
                            <p>3.5 Mol</p>
                        </div>
                    </div>
                </div>

                <div class = "excess">
                    <h4>Excess Remnants</h4>
                    <div class = "excess-remnants-list" id = "limiting-excess-remnants"></div>
                </div>
            </div>

            <div class = "error hidden" id = "limiting-error">
                <h3 id = "limiting-error-code"></h3>
                <p id = "limiting-error-detail"></p>
            </div>
        </div>
    `
}

function mol_input_maker(reactants_list, mol_div) {
    const reactant_inputs = reactants_list.querySelectorAll(".reactant-input");
    const mol_list = mol_div.querySelectorAll(".reactant-mol")

    for (let i = 0; i < reactant_inputs.length; i++) {
        let current_row = mol_list[i];

        if (!(current_row)) {
            current_row = document.createElement("div");
            current_row.classList.add("reactant-mol");

            const reactant = document.createElement("p");
            reactant.classList.add("reactant");
            current_row.appendChild(reactant);

            const colon = document.createElement("p");
            colon.textContent = ":";
            current_row.appendChild(colon);

            const input = document.createElement("input");
            input.type = "text";
            input.classList.add("mol");
            input.placeholder = "Mol";
            current_row.appendChild(input);

            mol_div.appendChild(current_row);
        }
        

        const input_reactant = current_row.querySelector(".reactant");

        input_reactant.textContent = reactant_inputs[i].value.trim().replace(/^\d+/, "");

        if (input_reactant.textContent === "") {
            current_row.classList.add("hidden")
        } else {
            current_row.classList.remove("hidden");
        }
    }
}

function get_mol_dict(mol_div) {
    var mol_dict = {}
    const mol_list = mol_div.querySelectorAll(".reactant-mol")
    
    for (let i = 0; i < mol_list.length; i++) {
        const current_mol_div = mol_list[i];

        if (current_mol_div.classList.contains("hidden")) {
            continue
        };

        const reactant = current_mol_div.querySelector(".reactant").textContent;
        const mol = current_mol_div.querySelector(".mol").value.trim();

        if (isFinite(mol) && mol !== "") {
            mol_dict[reactant] = parseFloat(mol);
        } else {
            var reason = ""
            if (mol === "") {
                reason = "Missing mol for reactant(s)"
            } else {
                reason = "Reactant(s) mol must be a number"
            }
            return {"status": false, "data": reason};
        }
    }

    return {"status": true, "data": mol_dict};
}

import {equation_buttons, equation_maker, call_api, error_codes} from "../extra-functions.js";

export function setup() {
    const add_reactant = document.getElementById("limiting-add-reactant");
    const add_product = document.getElementById("limiting-add-product");
    const reactants_list = document.getElementById("limiting-reactants-side");
    const products_list = document.getElementById("limiting-products-side");
    const mol_list = document.getElementById("limiting-mol-list")

    equation_buttons(reactants_list, add_reactant, products_list, add_product);

    reactants_list.addEventListener("input", function () {
        mol_input_maker(reactants_list, mol_list)
    })

    const submit_button = document.getElementById("limiting-submit");
    const clear_button = document.getElementById("limiting-clear");
    const output = document.getElementById("limiting-data");
    const output_equation = document.getElementById("limiting-equation");
    const excess_remnants = document.getElementById("limiting-excess-remnants");
    const theo_yields = document.getElementById("limiting-theoretical-yields");
    const limiting_reactant = document.getElementById("limiting-limiting-reactant");

    const error = document.getElementById("limiting-error");
    const error_code = document.getElementById("limiting-error-code");
    const error_detail = document.getElementById("limiting-error-detail");

    clear_button.addEventListener("click", function () {
        const reactant_input = document.createElement("input");
        reactant_input.type = "text";
        reactant_input.placeholder = "Reactant";
        reactant_input.classList.add("reactant-input");

        const reactant_container = document.createElement("div");
        reactant_container.classList.add("equation-part-container");
        reactant_container.appendChild(reactant_input);

        reactants_list.innerHTML = "";
        reactants_list.appendChild(reactant_container);

        const product_input = document.createElement("input");
        product_input.type = "text";
        product_input.placeholder = "Product";
        product_input.classList.add("product-input");

        const product_container = document.createElement("div");
        product_container.classList.add("equation-part-container");
        product_container.appendChild(product_input);

        products_list.innerHTML = "";
        products_list.appendChild(product_container);

        mol_list.innerHTML = "";
        mol_input_maker(reactants_list, mol_list);

        output.classList.add("hidden");
        error.classList.add("hidden");
    })

    submit_button.addEventListener("click", async function () {
        const equation = equation_maker(reactants_list, products_list);
        const mol_data = get_mol_dict(mol_list);

        
        if (equation) {
            if (mol_data["status"]) {
                const mol_dict = mol_data["data"];

                var dict = {};
                dict["equation"] = equation;
                dict["reactants_mol"] = mol_dict;
                const response = await call_api(dict, "/limiting");
                const response_data = response["data"];

                if (response["ok"]) {
                    error.classList.add("hidden");

                    output_equation.textContent = response_data["equation"];

                    limiting_reactant.textContent = response_data["data"]["limiting_reactant"];

                    const yield_dict = response_data["data"]["theoretical_yields"];
                    theo_yields.textContent = "";
                    for (const product in yield_dict) {
                        const container = document.createElement("div");
                        container.classList.add("theo-yield");

                        const product_p = document.createElement("p");
                        product_p.textContent = product;
                        container.appendChild(product_p);

                        const colon = document.createElement("p");
                        colon.textContent = ":";
                        container.appendChild(colon);

                        const value = document.createElement("p");
                        const mol = yield_dict[product]["mol"];
                        const mass = yield_dict[product]["grams"];
                        value.textContent = `${mol} mol (${mass} g)`;
                        container.appendChild(value);

                        theo_yields.appendChild(container);
                    }

                    const excess_dict = response_data["data"]["excess_remnants"];
                    excess_remnants.textContent = "";
                    for (const reactant in excess_dict) {
                        const container = document.createElement("div");
                        container.classList.add("excess-remnant");

                        const reactant_p = document.createElement("p");
                        reactant_p.textContent = reactant;
                        container.appendChild(reactant_p);

                        const colon = document.createElement("p");
                        colon.textContent = ":";
                        container.appendChild(colon);

                        const value = document.createElement("p");
                        const mol = excess_dict[reactant]["mol"];
                        const mass = excess_dict[reactant]["grams"];
                        value.textContent = `${mol} mol (${mass} g)`;
                        container.appendChild(value);

                        excess_remnants.appendChild(container);
                    }

                    output.classList.remove("hidden");
                } else {
                    output.classList.add("hidden");

                    error_code.textContent = error_codes[response["code"]];
                    error_detail.textContent = response["data"]["detail"];

                    error.classList.remove("hidden");
                }
            } else {
                output.classList.add("hidden");

                error_code.textContent = error_codes[422];
                error_detail.textContent = mol_data["data"];

                error.classList.remove("hidden");
            }
        } else {
            output.classList.add("hidden");

            error_code.textContent = error_codes[422];
            error_detail.textContent = "Complete equation is missing";

            error.classList.remove("hidden");
        }
    })
}