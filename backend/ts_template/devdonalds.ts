import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook = new Map<string, any>();

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  recipeName = recipeName.replace(/[-_]+/g, " ");
    
  recipeName = recipeName.replace(/[^a-zA-Z ]/g, "");
  
  recipeName = recipeName.trim().replace(/\s+/g, " ");
  
  recipeName = recipeName.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  
  return recipeName.length > 0 ? recipeName : null;
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  const entry = req.body;

  // Validate request body exists
  if (!entry) {
    return res.status(400).send("Request body is missing.");
  }

  // Validate type
  if (entry.type !== "recipe" && entry.type !== "ingredient") {
    return res.status(400).send("type can only be \"recipe\" or \"ingredient\".");
  }

  // Validate ingredient cookTime
  if (entry.type === "ingredient" && entry.cookTime < 0) {
    return res.status(400).send("cookTime can only be greater than or equal to 0");
}

  // Validate uniqueness
  if (!entry.name || cookbook.has(entry.name)) {
    return res.status(400).send("entry names must be unique");
  }

  // Validate requiredItems for recipes
  if (entry.type === "recipe") {
    const seenItems = new Set();
    for (const item of entry.requiredItems) {
      if (seenItems.has(item.name)) {
          return res.status(400).send("Recipe requiredItems can only have one element per name.");
      }
      seenItems.add(item.name);
    }
  }
  

  cookbook.set(entry.name, entry);
  return res.status(200).send();
});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
    const recipeName = req.query.name as string;
    
    // Validate if the recipe exists
    const recipe = cookbook.get(recipeName);
    if (!recipe || recipe.type !== "recipe") {
      return res.status(400).send("A recipe with the corresponding name cannot" +
      "be found or the searched name is NOT a recipe name (ie. an ingredient).");
    }
  
    const ingredientMap = new Map<string, number>();
    let totalCookTime = 0;
    
    // Recursive funtcion to process the recipies
    const processRecipe = (recipeName: string, quantity: number) => {
      const entry = cookbook.get(recipeName);
      if (!entry) {
        return res.status(400).send("The recipe contains recipes or ingredients" + 
           "that aren't in the cookbook.");
      }
  
      if (entry.type === "ingredient") {
        ingredientMap.set(
          entry.name,
          (ingredientMap.get(entry.name) || 0) + quantity
        );
        totalCookTime += entry.cookTime * quantity;
      } else {
        for (const item of entry.requiredItems) {
          processRecipe(item.name, item.quantity * quantity);
        }
      }
    };
  
    // Start processing the recipe
    for (const item of recipe.requiredItems) {
      processRecipe(item.name, item.quantity);
    }
  
    // Convert map to required format
    const ingredients = Array.from(ingredientMap, ([name, quantity]) => ({ name, quantity }));
  
    return res.status(200).json({
      name: recipeName,
      cookTime: totalCookTime,
      ingredients,
    });
});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
