# Zero-Waste Recipe Generator

Live Demo:
https://angelcasta34.github.io/MidtermCMPM147/


# What the Tool Generates

For a given list of ingredients, the generator outputs:

Recipe titles

Full ingredient lists with quantities and units

Numbered cooking directions

Indicators showing which input ingredients matched

A downloadable PDF version of any selected recipe

All results come from an existing structured recipe dataset.

# How to Access the Tool

The tool is hosted using GitHub Pages.

Open the live demo link above.

The generator loads automatically in your browser.

No installation or setup is required.

# How to Use

Enter ingredients as a comma-separated list, for example:

rice, egg, tomato

Adjust parameters if desired.

Click “Generate recipes” or press Enter.

Review ranked results.

Click “Download PDF” to export any recipe.

Each run replaces the previous results.

# Adjustable Parameters

Ingredients
Comma-separated list of ingredients to match against recipes. This is the primary constraint input.

Threshold
Minimum number of ingredient matches required for a recipe to appear. Higher values produce stricter filtering.

Max Outputs
Maximum number of recipes displayed per run.

Strict Match
Requires whole-word ingredient matching instead of substring matching for more precise filtering.

Randomize
Shuffles matching recipes before display to introduce variation in ordering.

Plural Handling
Inputs such as “eggs” automatically normalize to match singular ingredients like “egg.”

PDF Export
Allows downloading any selected recipe as a formatted PDF.

# Dataset

Recipes are loaded from a CSV dataset adapted from an open cookbook source.
The current dataset contains approximately 227 recipes.

The active file is recipes.csv, located in the docs folder so it can be served by GitHub Pages.
