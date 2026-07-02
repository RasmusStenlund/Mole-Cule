from fastapi import HTTPException

from fractions import Fraction

from data.elements import elements_list
from services.compound_info import get_molar_mass, get_composition

def reorder_elements(elements: list):
    temporary_elements = elements.copy()
    
    reordered_elements = []

    if "C" in temporary_elements:
        temporary_elements.remove("C")
        reordered_elements.append("C")
        if "H" in temporary_elements:
            temporary_elements.remove("H")
            reordered_elements.append("H")

        temporary_elements.sort()

        for element in temporary_elements:
            reordered_elements.append(element)
    else:
        electronegativity_values = []
        for element in elements:
            electronegativity = elements_list[element]["electronegativity"]
            if not electronegativity:
                electronegativity = 0.0
            electronegativity_values.append(electronegativity)
                                            
            
        for _ in range(len(elements)):
            min_value = min(electronegativity_values)
            place = electronegativity_values.index(min_value)

            reordered_elements.append(temporary_elements[place])
            temporary_elements.pop(place)
            electronegativity_values.pop(place)

    return reordered_elements


def composition_to_formula(composition: dict, elements: list):
    formula = ""
    
    for element in elements:
        formula += element

        amount = str(int(round(composition[element])))

        if amount != "1":
            formula += amount

    return formula



def verify_whole(composition: dict):
    rounding_tolerance = 0.05
    all_whole = True

    for element, mol in composition.items():
        rounded_mol = round(mol)
        distance_whole = abs(mol - rounded_mol)
        
        if distance_whole > rounding_tolerance:
            all_whole = False

    return all_whole



def get_multiplied_composition(composition: dict, molar_mass, empirical_mass):
    formula_units = molar_mass /empirical_mass

    multiplied_composition = {}

    if formula_units < 1:
        raise HTTPException(
            status_code = 422,
            detail = "Invalid molar mass: less than empirical mass"
        )
    
    for element, mol in composition.items():
        multiplied_composition[element] = mol * formula_units

    

    return multiplied_composition, formula_units



def composition_to_mol(composition: dict):
    moles = []

    elements_mol = {}
    
    for element, mass in composition.items():
        if mass <= 0: 
            raise HTTPException(
                status_code = 422,
                detail = f"Invalid mass for {element}"
            )


        atomic_mass = elements_list[element]["atomic_mass"]

        mol = mass / atomic_mass

        if composition.get(element, 0) == None:
            raise HTTPException(
                status_code = 422,
                detail = ""
            )
        
        elements_mol[element] = mol
        moles.append(mol)
    
    lowest_mol = min(moles)

    for element, mol in elements_mol.items():
        mol = mol / lowest_mol

        elements_mol[element] = mol

    return elements_mol, lowest_mol

def get_applied_water(water_mol):
    applied_water = ""

    if water_mol == 1:
        applied_water = "*H2O"
    else:
        applied_water = f"*{water_mol}H2O"

    return applied_water



def get_empirical(is_hydrate: bool, hydrate_mass: float, anhydrous_mass: float, composition: dict, molar_mass: float = None):
    mol_sum = 0
    for element, mol in composition.items():
        if mol <= 0:
            raise HTTPException(
                status_code = 422,
                detail = f"Invalid value for {element}"
            )
        mol_sum += mol

    if mol_sum > 101 or mol_sum < 99:
        raise HTTPException(
            status_code = 422,
            detail = "Mass percentages do not add up to ~100%"
        )

    elements = []

    for element, mol in composition.items():
        elements.append(element)

        if elements.count(element) != 1:
            raise HTTPException(
                status_code = 422,
                detail = f"Element entered more than once: {element}"
            )

    reordered_elements = reorder_elements(elements)

    composition, lowest_mol = composition_to_mol(composition)

    multiplier = 1
    empirical_composition = {}
    status = False

    while status == False:
        
        for element, mol in composition.items():
            mol *= multiplier
            empirical_composition[element] = mol

        status = verify_whole(empirical_composition)

        if not status:
            multiplier +=  1

    if multiplier > 10:
        raise HTTPException(
            status_code = 422,
            detail = "Multiplier exceeded 10, invalid or too complex ratios for elements"
        )

    for element, count in empirical_composition.items():
        empirical_composition[element] = round(count)

    empirical_formula = composition_to_formula(empirical_composition, reordered_elements)

    empirical_molar_mass = get_molar_mass(empirical_composition)


    if is_hydrate:
        if not anhydrous_mass or not hydrate_mass:
            raise HTTPException(
                status_code = 422,
                detail = "If hydrate: Must provide hydrate and anhydrous mass"
            )


        if anhydrous_mass > hydrate_mass:
            raise HTTPException(
                status_code = 422,
                detail = "Invalid input: Anhydrous mass cannot be greater than hydrate mass"
            )
        elif anhydrous_mass == hydrate_mass:
            raise HTTPException(
                status_code = 422,
                detail = "Invalid input: Cannot be hydrate due to no mass lost after evaporating"
            )


        compound_moles = anhydrous_mass / empirical_molar_mass

        water_mass = hydrate_mass - anhydrous_mass

        water_mol = water_mass / 18.015

        water_ratio = water_mol / compound_moles

        water_ratio = round(water_ratio * 2) / 2

        if water_ratio.is_integer():
            water_ratio = int(water_ratio)
            
        empirical_formula += get_applied_water(water_ratio)

        empirical_molar_mass += (18.015 * water_ratio)

        empirical_molar_mass = round(empirical_molar_mass, 3)


        




    if molar_mass:
        molecular_composition, formula_units = get_multiplied_composition(empirical_composition, molar_mass, empirical_molar_mass)
        molecular_formula = composition_to_formula(molecular_composition, reordered_elements)

        if is_hydrate:
            water_ratio = int(water_ratio * formula_units)

            molecular_formula += get_applied_water(water_ratio)

            molecular_composition = get_composition(molecular_formula)

        for element, mol in molecular_composition.items():
            molecular_composition[element] = round(mol)

        molecular_molar_mass = get_molar_mass(molecular_composition)

        return empirical_formula, empirical_molar_mass, molecular_formula, molecular_molar_mass
    
    return empirical_formula, empirical_molar_mass


