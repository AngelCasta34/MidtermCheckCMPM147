# Zero-Waste Recipe Generator
Overview

The Zero-Waste Recipe Generator is a small procedural tool that helps users discover recipes based on ingredients they already have. By filtering an existing recipe dataset using ingredient constraints, the generator aims to reduce food waste and teach users how to cook with limited or leftover ingredients. The system outputs full recipes including measured ingredients and step-by-step directions.

Core goals:

Reduce food waste

Encourage resourceful cooking

Demonstrate how constraints can drive procedural systems

# How It Works

The generator:

Loads recipes from a CSV dataset

Accepts a comma-separated list of ingredients the user wants to use up

Compares those ingredients against each recipe’s ingredient list

Filters recipes based on an ingredient match threshold

Prints matched recipes with measured ingredients and numbered steps

This is a constraint-driven selection tool. It does not invent new recipes. It surfaces existing recipes that fit the user’s inputs.

# Dataset

Recipes are sourced from a CSV file adapted from an open cookbook dataset. Each recipe includes:

Title

Directions

Ingredient fields (including quantities and units)

The current dataset used in development contains 227 recipes.

You may have multiple dataset files in the repo:

recipes.csv

recipes_forimport.csv

Use the --csv flag to choose which file to load.

# Requirements

Node.js installed

A recipe CSV file in the same directory as zero_waste_generator.js

# Usage
Run the Generator

From the project folder:

node zero_waste_generator.js --ingredients "rice, egg" --threshold 1 --max 2

Choose a dataset file
node zero_waste_generator.js --csv "recipes_forimport.csv" --ingredients "rice, egg" --threshold 1 --max 2

Strict matching mode

Strict mode uses whole-word matching. This reduces overly broad matches and demonstrates how matching rules affect output.

node zero_waste_generator.js --ingredients "rice, egg" --threshold 1 --max 2 --strict

# Command-Line Options
--ingredients
Comma-separated list of ingredients you want to use up

--threshold
Minimum number of ingredient matches required for a recipe to be included
Lower values return more results, higher values return fewer and more specific results

--max
Maximum number of recipes to print per run

--strict
Requires stricter ingredient matching, reducing loosely related results

--csv (optional)
Path to the recipe CSV file (defaults to recipes.csv)

--random (optional)
Randomizes which matching recipes are shown

# Example Output

The generator prints:

Recipe title

Which input ingredients matched

Full ingredient list with quantities and units

Numbered cooking directions

This allows users to compare how different inputs and parameters produce different results.

# Output Format

For each recipe, the generator prints:

Recipe title

Which input ingredients matched

Ingredient list with measurements (quantity + unit + ingredient)

Numbered directions derived from the Directions text field

# Procedural Parameters

The primary procedural parameters are the ingredient match threshold and strict matching mode. Adjusting these values changes how permissive or selective the system is. Increasing the threshold or enabling strict mode significantly reduces the number of valid outputs, demonstrating constraint-driven procedural variation.