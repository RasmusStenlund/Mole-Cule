const url = "https://molecule.nordicpine.hackclub.app";

export async function call_api(dict, endpoint) {
    const response = await fetch(`${url}${endpoint}`, {
        method: "POST",
        body: JSON.stringify(dict),
        headers: {
            "Content-Type": "application/json"
        }
    })

    const data = await response.json()

    return {
        ok: response.ok,
        code: response.status,
        data: data,
    }
}

export function equation_buttons(reactants_list, add_reactant, products_list, add_product) {
    add_reactant.addEventListener("click", function () {
        const last_input = reactants_list.lastElementChild;
        const plus = document.createElement("p");
        plus.textContent = "+";

        last_input.appendChild(plus)

        const div = document.createElement("div");
        div.classList.add("equation-part-container");

        const input = document.createElement("input");
        input.type = "text";
        input.classList.add("reactant-input");
        input.placeholder = "Reactant";

        div.appendChild(input)
    
        reactants_list.append(div)
    })

    add_product.addEventListener("click", function () {
        const last_input = products_list.lastElementChild;
        const plus = document.createElement("p");
        plus.textContent = "+";
        last_input.appendChild(plus);

        const container = document.createElement("div");
        container.classList.add("equation-part-container");
        const input = document.createElement("input");
        input.type = "text";
        input.classList.add("product-input");
        input.placeholder = "Product";

        container.appendChild(input);

        products_list.appendChild(container);
    })
}

export function equation_maker(reactants_list, products_list) {
    const reactants = reactants_list.getElementsByClassName("reactant-input");
    const products = products_list.getElementsByClassName("product-input");

    const reactant_values = Array.from(reactants).map(function(input) {
        return input.value.trim()
    }).filter(function(value) {
        if (value) {
            return value
        }
    })

    const reactant_side = reactant_values.join(" + ")

    const product_values = Array.from(products).map(function(input) {
        return input.value.trim()
    }).filter(function(value) {

        if (value) {
            return value
        }
    })

    const product_side = product_values.join(" + ");

    if (reactant_side && product_side) {
        return `${reactant_side} -> ${product_side}`;
    }
}