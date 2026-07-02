export function page() {
    return `
        <div class = "balance">
            <div class = "enter">
                <div class = "equation-maker">
                    <p>Reactants</p>
                    <div class = "equation-side" id = "balance-reactants-side">
                        <div class = "equation-part-container">
                            <input type = "text" class = "reactant-input" placeholder = "Reactant">
                        </div>
                    </div>
                    <input type = "button" id = "balance-add-reactant" class = "add-button" value = "+ Reactant">
                    <p class = "arrow">&#8594</p>
                    <p>Products</p>
                    <div class = "equation-side" id = "balance-products-side">
                        <div class = "equation-part-container">
                            <input type = "text" class = "product-input" placeholder = "Product">
                        </div>
                    </div>
                    <input type = "button" id = "balance-add-product" class = "add-button" value = "+ Product">
                </div>
                <div class = "buttons">
                    <input type = "button" class = "submit-button" id = "balance-submit" value = "Balance">
                    <input type = "button" class = "clear-button" id = "balance-clear" value = "Clear">
                </div>
            </div>

            <div class = "data hidden" id = "balance-data">
                <div class = "entered">
                    <h4 class = "balance-equation-header">Entered Equation</h4>
                    <p id = "balance-entered-equation" class = "balance-equation-text">X + Y -> X2Y</p>
                </div>

                <div class = "balanced">
                    <h4 class = "balance-equation-header">Balanced Equation</h4>
                    <p id = "balance-balanced-equation" class = "balance-equation-text">2X + Y -> X2Y</p>
                </div>
            </div>
        </div>
    `
}

import {equation_buttons, equation_maker, call_api} from "../extra-functions.js"

export function setup() {
    const add_reactant = document.getElementById("balance-add-reactant");
    const add_product = document.getElementById("balance-add-product");
    const reactants_list = document.getElementById("balance-reactants-side");
    const products_list = document.getElementById("balance-products-side");

    equation_buttons(reactants_list, add_reactant, products_list, add_product);
    
    const output = document.getElementById("balance-data")
    const submit_button = document.getElementById("balance-submit");
    const clear_button = document.getElementById("balance-clear");
    const entered = document.getElementById("balance-entered-equation");
    const balanced = document.getElementById("balance-balanced-equation");

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

        output.classList.add("hidden");
    })

    submit_button.addEventListener("click", async function () {
        const equation = equation_maker(reactants_list, products_list)
        if (equation) {
            var dict = {};
            dict["equation"] = equation;

            const response = await call_api(dict, "/balance");
            entered.textContent = response["entered_equation"]
            balanced.textContent = response["data"]["balanced_equation"];
            output.classList.remove("hidden")
        }
    })
}