from fractions import Fraction

from fastapi import HTTPException

from services.equation_info import equation_to_dicts
from services.compound_info import get_composition, seperate_state




def compounds_to_elements(compounds: list):
    compound_list = []
    for compound in compounds:
        composition = get_composition(compound)
        compound_list.append(composition)


    return compound_list

def get_common_divisor(number, remainder):
    while remainder:
        number, remainder = remainder, number % remainder

    return number

def least_common_denominator(a, b):
    return a * b // get_common_divisor(a, b)


def create_matrix(all_elements, reactants, products):
    matrix = []
    for element in all_elements:
        row = []
        for reactant in reactants:
            count = 0
            if reactant.get(element,0):
                count = abs(reactant[element])

            row.append(count)
        
        for product in products:
            count = 0
            if product.get(element,0):
                count = -abs(product[element])

            row.append(count)

        matrix.append(row)

    return matrix   


def solve_matrix(matrix):
    if not matrix or not matrix[0]:
        raise HTTPException(
            status_code = 422,
            detail = "Unable to get matrix"
        )


    column = 0
    anchor_row = 0


    for row in matrix:
        for i in range(len(row)):
            row[i] = Fraction(row[i])


    while anchor_row < len(matrix) and column < len(matrix[0]):

        pivot_row = None
        for k in range(anchor_row, len(matrix)):
            if matrix[k][column] != 0:
                pivot_row = k
        
        if pivot_row == None:
            column += 1
            continue

        matrix[anchor_row], matrix[pivot_row] = matrix[pivot_row], matrix[anchor_row]

        anchor_num = matrix[anchor_row][column]
        
        if anchor_num == 0:
            raise HTTPException(
                status_code = 422,
                detail = "Matrix mathematically invalid"
            )

        l = 0
        for l in range(len(matrix[anchor_row])):
            matrix[anchor_row][l] /= anchor_num

        l = 0
        for l in range(len(matrix)):
            if l == anchor_row:
                continue

            multiplier = matrix[l][column]

            for current_column in range(len(matrix[anchor_row])):
                matrix[l][current_column] -= matrix[anchor_row][current_column] * multiplier

        column += 1
        anchor_row += 1

    solution = [Fraction(0)] * len(matrix[0])

    pivot_columns = []

    for row in matrix:
        for j in range(len(matrix[0])):
            if row[j] != 0:
                pivot_columns.append(j) 
                break

    free_columns = []
    for j in range(len(matrix[0])):
        if j not in pivot_columns:
            free_columns.append(j)




    for j in free_columns:
        solution[j] = Fraction(1)
    
    for row in matrix:
        pivot = None

        for i in range(len(row)):
            if row[i] != 0:
                pivot = i
                break

        if pivot != None:
            sum_free = Fraction(0)
            for j in free_columns:
                sum_free += row[j] * solution[j]

            solution[pivot] = -sum_free

    for coefficient in solution:
        if coefficient <= 0:
            raise HTTPException(
                status_code = 422,
                detail = "Unable to get positive coefficients"
            )

    denominators = []
    for i in range(len(solution)):
        denominators.append(solution[i].denominator)


    common_denominator = 1
    for denominator in denominators:
        common_denominator = least_common_denominator(common_denominator, denominator)

    for i in range(len(solution)):
        solution[i] *= common_denominator
        solution[i] = int(solution[i])

    return solution


    


def make_balanced_equation(coefficients, states, reactants, products,):
    number = 0
    balanced_equation = ""
    for reactant in reactants:
        coefficient = str(int(coefficients[number]))
        if coefficient != "1":
            balanced_equation += coefficient

        balanced_equation += reactant
        balanced_equation += states[number]

        if number < (len(reactants) -1):
            balanced_equation += " + "

        number += 1

    balanced_equation += " -> "

    for product in products:
        coefficient = str(int(coefficients[number]))
        if coefficient != "1":
            balanced_equation += coefficient

        balanced_equation += product
        balanced_equation += states[number]

        if number < (len(reactants) + len(products) -1):
            balanced_equation += " + "
        
        number += 1

    return balanced_equation



def balance_equation(equation: str):
    reactants_full, products_full = equation_to_dicts(equation)

    clean_reactants = []
    clean_products = []

    states = []

    for reactant in reactants_full:
        clean_reactant, state = seperate_state(reactant)

        clean_reactants.append(clean_reactant)
        states.append(state)

    for product in products_full:
        clean_product, state = seperate_state(product)

        clean_products.append(clean_product)
        states.append(state)


    reactants = compounds_to_elements(clean_reactants)
    products = compounds_to_elements(clean_products)
    reactants_elements = set()
    for reactant in reactants:
        for element in reactant:
            reactants_elements.add(element)

    products_elements = set()
    for product in products:
        for element in product:
            products_elements.add(element)

    if reactants_elements != products_elements:
        raise HTTPException(
            status_code = 422,
            detail = "Invalid equation: Mismatched elements on sides of equation"
        )


    compounds = reactants + products
    all_elements = set()

    for compound in compounds:
        for element in compound:
            all_elements.add(element)

    matrix = create_matrix(all_elements, reactants, products)

    matrix_coefficients = solve_matrix(matrix)

    compound_amount = len(reactants) + len(products)

    if len(matrix_coefficients) != compound_amount:
        raise HTTPException(
            status_code = 422,
            detail = "Unable to get coefficients for all compounds"
        )


    balanced_equation = make_balanced_equation(matrix_coefficients, states, clean_reactants, clean_products)

    coefficients = {"reactants": {}, "products": {}}

    i = 0
    for reactant in clean_reactants:
        coefficients["reactants"][reactant] = matrix_coefficients[i]
        i += 1

    for product in clean_products:
        coefficients["products"][product] = matrix_coefficients[i]
        i += 1

    return balanced_equation, coefficients