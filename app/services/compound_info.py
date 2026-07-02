from fastapi import HTTPException

import re

from data.elements import elements_list

def seperate_state(formula: str):

    pattern = "(\((s|l|g|aq)\))$"

    clean_formula = re.sub(pattern, "", formula)

    match = re.search(pattern, formula)

    if match:
        state = match.group(1)

        if clean_formula == "H2O" and state == "(aq)":
            state = "(l)"

        return clean_formula, state
    
    return clean_formula, ""

def get_composition(formula: str):
    if not formula:
        raise HTTPException(
            status_code = 422,
            detail = "No formula provided"
        )

    formula.replace(" ", "")

    formula_parts = []

    if "*" in formula:
        formula_parts = formula.split("*")

        for part in formula_parts:
            if not part:
                raise HTTPException(
                    status_code = 422,
                    detail = "Invalid use of '*'"
                )

    else:
        formula_parts = [formula]

    composition = [{}]
    place = 0
    for part in formula_parts:
        place += 1
        coefficient = 1

        pattern = "[A-Z][a-z]*|\d+|\(|\)|\[|\]"

        items = re.findall(pattern, part)

        unknown_characters = re.sub(pattern, "", part)

        unknown_string = ""
        for i in range(len(unknown_characters)):
            unknown_string += f"'{unknown_characters[i]}'"

            if i < (len(unknown_characters) - 1):
                unknown_string += ", "


        if unknown_string:
            raise HTTPException(
                status_code = 422,
                detail = f"Unknown character(s): {unknown_string}"
            )
        
        i = 0
        bracket_types = {
            "(": "round",
            ")": "round",
            "[": "square",
            "]": "square"
        }
        brackets = []

        while i < len(items):

            if items[i] == "(" or items[i] == "[":
                composition.append({})
                brackets.append(bracket_types[items[i]])

                i +=1
                continue
            elif items[i] == ")" or items[i] == "]":

                if brackets[-1] != bracket_types[items[i]]:
                    open_bracket = "("
                    if brackets[-1] == "square":
                        open_bracket = "("
                        if brackets[-1] == "square":
                            open_bracket = "["

                    raise HTTPException(
                        status_code = 422,
                        detail = f"Mismatched brackets: '{open_bracket}' and '{items[i]}'"
                    )
                
                brackets.pop()

                if len(composition) == 1:
                    raise HTTPException(
                        status_code = 422,
                        detail = "Unclosed parenthesis"
                    )
                

                group = composition.pop()

                multiplier = 1

                if i + 1 < len(items) and items[i + 1].isdigit():
                    multiplier = int(items[i + 1])
                    i += 1
                
                for element, count in group.items():
                    count = int(count)

                    composition[-1][element] = composition[-1].get(element, 0) + (count * multiplier) 

                i += 1
                continue

            elif items[i].isdigit():
                if place <= 1:
                    raise HTTPException(
                        status_code = 422,
                        detail = "Number unassigned to group or element"
                    )
                else:
                    coefficient = float(items[i])
                    i += 1
                    continue
            

            else:
                element = items[i]

                count = 1

                if i + 1 < len(items) and items[i + 1].isdigit():
                    count = int(items[i + 1])
                    i += 1

                composition[-1][element] = composition[-1].get(element, 0) + (count * coefficient)

                i += 1
                continue


        if len(composition) != 1:
            raise HTTPException(
                status_code = 422,
                detail = "Unclosed parenthesis"
            )
        


    return composition[0]


def get_molar_mass(composition: dict):
    total_mass = 0.0

    for element, amount in  composition.items():

        total_mass += elements_list[element]["atomic_mass"] * amount

    return round(total_mass, 3)

def get_mass_fractions(total_mass, composition: dict):
    mass_fractions = {}
    for element, amount in composition.items():

        element_mass = elements_list[element]["atomic_mass"] * amount

        fraction = element_mass / total_mass
        mass_fractions[element] = fraction
    
    return mass_fractions


def convert_mass_mole(molar_mass, value, mode):
    if value <= 0:
        raise HTTPException(
            status_code = 422,
            detail = "Invalid value: Must be greater than 0"
        )

    if mode == "to_mol": 
        return value / molar_mass
    
    elif mode == "to_mass":
        return value * molar_mass


def get_elements_data(composition: dict):
    elements = {}

    total_mass = get_molar_mass(composition)

    mass_fraction = get_mass_fractions(total_mass, composition)
    
    for element, count in composition.items():
        atomic_mass = elements_list[element]["atomic_mass"]

        elements[element] = {
            "count": count,
            "atomic_number": elements_list[element]["atomic_number"],
            "atomic_mass": atomic_mass,
            "mass_contribution": atomic_mass * count,
            "mass_percent": round(mass_fraction[element] * 100   , 2),
        }

    return elements