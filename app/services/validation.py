from fastapi import HTTPException

from data.elements import elements_list

from services.compound_info import get_composition, seperate_state
from services.equation_info import equation_to_dicts

def validate_element(element: str):
    if not element:
        raise HTTPException(
            status_code = 422,
            detail = "Element missing"
        )
    if element not in elements_list:
        raise HTTPException(
            status_code = 422, 
            detail = f"Unknown Element: '{element}'"
            )
     
    if elements_list[element]["atomic_mass"] is None:
        raise HTTPException(
            status_code = 422, 
            detail = f"Atomic mass for {element} missing"
            )
    
    if elements_list[element]["atomic_number"] is None:
        raise HTTPException(
            status_code = 422,
            detail = f"Atomic number for {element} missing"
        )
    

def validate_composition(compound:dict):
    if not compound:
        raise HTTPException(
            status_code = 422,
            detail = "Compound missing"
        )

    for element, count in compound.items():
        validate_element(element)

        if count <= 0:
            raise HTTPException(
                status_code = 422, 
                detail = f"Invalid count for '{element}': Element cannot be 0"
                )
        
def validate_formula(formula: str):
    if not formula:
        raise HTTPException(
            status_code = 422,
            detail = "Invalid input: Must contain formula"
        )
    
    formula.replace(" ", "")
    
    clean_formula, state = seperate_state(formula)


    composition = get_composition(clean_formula)

    validate_composition(composition)


def validate_quantity_dict(compound_dict: dict):

    if not compound_dict:
        raise HTTPException(
            status_code = 422,
            detail = "Compound dictionary missing"
        )



    for compound, count in compound_dict.items():
        validate_formula(compound)

        if count <= 0:
            raise HTTPException(
                status_code = 422, 
                detail = f"Invalid count for '{compound}': Amount must be greater than 0"
                )
        

def validate_equation(equation: str):
    equation = equation.replace(" ", "")

    test_empty_equation = (equation.replace("+", "")).replace("->", "")

    if test_empty_equation == "":
        raise HTTPException(
            status_code = 422,
            detail = f"Invalid structure: Empty equation"
        )

    arrow_count = equation.count("->")

    if arrow_count != 1:
        raise HTTPException(
            status_code = 422,
            detail = "Invalid structure: Only use 1 '->'"
        )

    reactants, products = equation.split("->")

    reactants = reactants.replace("+", "")

    products = products.replace("+", "")

    missing = ""
    if not reactants:
        missing = "Reactant(s) missing"
    elif not products:
        missing = "Product(s) missing"

    if missing:
        raise HTTPException(
            status_code = 422,
            detail = f"Invalid structure: {missing}"
        )
    
    
    reactants, products = equation_to_dicts(equation)

    validate_quantity_dict(reactants)
    validate_quantity_dict(products)