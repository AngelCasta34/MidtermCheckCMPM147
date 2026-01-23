# Zero-Waste Recipe Generator

The Zero-Waste Recipe Generator is a small procedural tool that helps users discover recipes based on ingredients they already have. By filtering an existing recipe dataset using ingredient constraints, the generator aims to reduce food waste and teach users how to cook with limited or leftover ingredients.

# Motivation

Many people accumulate ingredients without knowing what to do with them. This project is inspired by crafting and grafting systems in games, where players often collect resources without clear guidance on how they can be used. The generator reframes that experience into a real-world context by transforming ambiguous inputs into meaningful, usable outcomes.

The core goals are:

Reduce food waste

Encourage resourceful cooking

Demonstrate how constraints can drive creative and procedural systems

# How It Works

The generator:

Loads recipes from a CSV dataset

Accepts a list of ingredients the user wants to use up

Compares those ingredients against each recipe

Filters recipes based on a match threshold

Outputs complete recipes that reuse the provided ingredients

This prototype uses literal ingredient matching and is intentionally simple to keep scope manageable.

# Dataset

Recipes are sourced from a CSV file adapted from an open cookbook dataset. Each recipe includes:

A title

A list of ingredients

Cooking directions

The generator currently processes 227 recipes.

# Usage
Requirements

Node.js installed

recipes.csv in the same directory as the script

# Run the Generator

From the project folder:

node zero_waste_generator.js --ingredients "rice, egg" --threshold 1 --max 2

# Command-Line Options

--ingredients
Comma-separated list of ingredients you want to use up

--threshold
Minimum number of ingredient matches required for a recipe to be included
Lower values return more results, higher values return fewer, more specific results

--max
Maximum number of recipes to print per run

--csv (optional)
Path to the recipe CSV file (defaults to recipes.csv)

--random (optional)
Randomizes which matching recipes are shown

# Example Output

The generator prints:

Recipe title

Which input ingredients matched

Full ingredient list

Cooking directions

This allows users to compare how different inputs and parameters produce different results.

# Procedural Parameters

The primary procedural parameter is the ingredient match threshold, which directly affects output variation. Changing the input ingredient list and threshold value produces different sets of recipes, demonstrating constraint-driven generation.

# Limitations

This prototype has several known limitations:

Ingredient matching is literal and does not support substitutions

Recipes may not use all provided ingredients

Ingredient categories (e.g., vegetable, protein) are not yet implemented

Output depends on the structure and coverage of the dataset
