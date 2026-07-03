from fastapi import FastAPI, HTTPException, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel, Field

from services.compound_info import get_composition, get_molar_mass, convert_mass_mole, get_elements_data, seperate_state
from services.equation_info import equation_to_dicts, get_limiting_ratios, get_limiting_reactant, get_theoretical_yields, get_excess_remnants
from services.validation import validate_equation, validate_quantity_dict, validate_formula, validate_composition
from services.balance import balance_equation
from services.empirical import get_empirical
from services.rate_limiter import rate_limiter_store

app = FastAPI(title="Mole-Cule API", description = "This is the API used for the tool Mole-Cule.")

origins = [
    "https://rasmusstenlund.github.io/Mole-Cule/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.testing = False

class AnalyzeFormula(BaseModel):
    formula: Optional[str] = ""

class BalanceEquation(BaseModel):
    equation: Optional[str] = ""

class Convert(BaseModel):
    formula: Optional[str] = ""
    mass: Optional[float] = None
    mol: Optional[float] = None

class LimitingFactor(BaseModel):
    equation: Optional[str] = ""
    reactants_mol: Optional[dict] = None


class EmpiricalFormula(BaseModel):
    composition: dict[str, float] = Field(description = "Mass percent for elements in compound")
    molar_mass: Optional[float] = None
    is_hydrate: Optional[bool] = False
    hydrate_mass: Optional[float] = Field(0.0, description = "If hydrate: Mass before removing all water")
    anhydrous_mass: Optional[float] = Field(0.0, description = "If hydrate: Mass after removing all water")

limiter = rate_limiter_store(max_tokens = 15.0, refill_rate = 2.0)

def use_token(cost: int):

    async def verify_rate_limit(request: Request, response: Response):
        if request.app.state.testing:
            return

        client_ip = request.client.host
        bucket = limiter.get_bucket(client_ip)

        if not bucket.consume(cost):
            cooldown = bucket.get_cooldown(cost)
            raise HTTPException(
                status_code = 429,
                detail = f"Rate limit exceeded: Endpoint requires {cost} tokens",
                headers = {
                    "Retry-After": str(max(1, int(cooldown)))
                }
            )
        response.headers["X-RateLimit-Remaining"] = str(round(bucket.get_remaining(), 1))
        return True
    
    return verify_rate_limit


@app.get("/")
async def Home():
    return {"message": "Welcome to Mole-Cule API!"}

@app.post("/analyze", dependencies = [Depends(use_token(cost = 2))])
async def analyze(data: AnalyzeFormula):
    formula = data.formula

    formula = formula.replace(" ", "")

    validate_formula(formula)

    clean_formula, state = seperate_state(formula)
    
    composition = get_composition(clean_formula)

    elements_data = get_elements_data(composition)

    molar_mass = get_molar_mass(composition) 

    formula = clean_formula + state

    return {
        "formula": formula,
        "molar_mass": molar_mass,
        "elements_data": elements_data,
        "note": "Percentages may not add up to exactly 100% due to rounding"
    }

@app.post("/balance", dependencies = [Depends(use_token(cost = 3))])
async def balance(data: BalanceEquation):
    equation = data.equation

    validate_equation(equation)

    balanced_equation, coefficients = balance_equation(equation)

    return {
        "entered_equation": equation,
        "data": {
            "balanced_equation":balanced_equation,
            "coefficients": coefficients
        }
    }




@app.post("/empirical", dependencies = [Depends(use_token(cost = 3))])
async def empirical(data:EmpiricalFormula):
    entered_composition = data.composition
    entered_molar_mass = data.molar_mass
    is_hydrate  = data.is_hydrate
    hydrate_mass = data.hydrate_mass
    anhydrous_mass = data.anhydrous_mass

    validate_quantity_dict(entered_composition)

    empirical_data = {}
    molecular_data = {}

    if entered_molar_mass:
        empirical_formula, empirical_molar_mass, molecular_formula, molecular_molar_mass = get_empirical(is_hydrate, hydrate_mass, anhydrous_mass, entered_composition, entered_molar_mass)

        empirical_data = {
            "formula": empirical_formula,
            "molar_mass": empirical_molar_mass
        }

        if molecular_molar_mass == entered_molar_mass:
            molecular_data = {
                "formula": molecular_formula,
                "molar_mass": molecular_molar_mass
            }
        else:
            molecular_data = {
                "formula": molecular_formula,
                "molar_mass": molecular_molar_mass,
                "entered_molar_mass": entered_molar_mass,
                "warning": "Entered molar mass doesn't match calculated molar mass"
            }


    else:
        empirical_formula, empirical_molar_mass = get_empirical(is_hydrate, hydrate_mass, anhydrous_mass, entered_composition)

        empirical_data = {
            "formula": empirical_formula,
            "molar_mass": empirical_molar_mass
        }

        molecular_data = "No molecular mass entered, unable to get molecular data"




    return {
        "entered_composition": entered_composition,
        "entered_molar_mass": entered_molar_mass,
        "data": {
            "empirical": empirical_data,
            "molecular": molecular_data
        }
    }
    


@app.post("/convert", dependencies = [Depends(use_token(cost = 1))])
async def convert(data: Convert):
    formula = data.formula
    mass = data.mass
    mol = data.mol

    if mass == 0 or mol == 0:
        raise HTTPException(
            status_code = 422,
            detail = "Invalid value: Must be greater than 0"
        )

    validate_formula(formula)

    composition = get_composition(formula)

    molar_mass = get_molar_mass(composition)
    
    returned = ""
    returned_data = 0
    entered = ""
    entered_data = 0

    if mass and formula and not mol:
        mol = convert_mass_mole(molar_mass, mass, "to_mol")

        mol = round(mol, 3)

        returned = "mol"
        returned_data = mol
        entered = "entered_mass"
        entered_data = mass
    
    elif mol and formula and not mass:
        mass = convert_mass_mole(molar_mass, mol, "to_mass")

        mass = round(mass, 3)

        returned = "mass"
        returned_data = mass
        entered = "entered_mol"
        entered_data = mol

    else:
        raise HTTPException(status_code = 422, detail = "Invalid input: Must contain either mass or mol")
    
    return{
        "entered_formula": formula,
        entered: entered_data,
        "data": {
            returned: returned_data
        }
    }




@app.post("/limiting", dependencies = [Depends(use_token(cost = 4))])
async def limiting(data: LimitingFactor):

    equation = data.equation
    reactants_mol = data.reactants_mol

    validate_equation(equation)
    validate_quantity_dict(reactants_mol)

    balanced_equation, coefficients  = balance_equation(equation)

    reactants, products = equation_to_dicts(balanced_equation)

    limiting_ratios = get_limiting_ratios(reactants, reactants_mol)

    limiting_reactant = get_limiting_reactant(limiting_ratios)

    theoretical_yields = get_theoretical_yields(limiting_reactant, reactants, products, reactants_mol)

    for compound, theo_yield in theoretical_yields.items():

        theoretical_yields[compound] = theo_yield

    excess_remnants = get_excess_remnants(limiting_reactant, reactants, reactants_mol)

    return {
        "equation": balanced_equation,
        "data": {
            "limiting_reactant": limiting_reactant,
            "theoretical_yields": theoretical_yields,
            "excess_remnants": excess_remnants
        }    
    }



    