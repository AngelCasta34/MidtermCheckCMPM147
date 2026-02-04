# Zero-Waste Recipe Generator

The Zero-Waste Recipe Generator is a standalone generative tool that helps users discover recipes using ingredients they already have. Instead of creating new recipes, the system searches an existing dataset and surfaces recipes that best match the user’s inputs.

# What the Tool Generates

For a given list of ingredients, the generator outputs:

Recipe titles
Full ingredient lists with quantities and units
Numbered cooking directions
Indicators showing which input ingredients matched

All results come from an existing recipe dataset.

# How to Run the Tool

GitHub Pages (Primary)

This tool is hosted using GitHub Pages.

Open the GitHub Pages link for this repository.
The generator loads automatically in the browser.
No installation or setup is required.

# Local Version 

If running locally, all files must be inside the docs folder:

index.html
style.css
app.js
recipes_forimport.csv

Start a local server, for example:

python -m http.server

Then open http://localhost:8000/docs/

# How to Use

Enter ingredients as a comma-separated list, for example:

rice, egg, tomato

Adjust parameters if desired.
Click Generate recipes or press Enter.
Each run replaces the previous results.

# Parameters

Ingredients
Comma-separated list of ingredients to match against recipes.

Threshold
Minimum number of ingredient matches required.

Max Outputs
Maximum number of recipes shown.

Strict Match
Requires whole-word ingredient matches.

Randomize
Shuffles matching recipes before display.

# Dataset

Recipes are loaded from a CSV dataset adapted from an open cookbook source.
The current dataset contains approximately 227 recipes.

The active file is recipes.csv, located in the docs folder so it can be served by GitHub Pages.
