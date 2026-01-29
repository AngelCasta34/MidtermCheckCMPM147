# Clear previous outputs
Remove-Item outputs.txt -ErrorAction SilentlyContinue

# A: rice, egg
node zero_waste_generator.js --ingredients "rice, egg" --threshold 1 --max 2 >> outputs.txt
node zero_waste_generator.js --ingredients "rice, egg" --threshold 2 --max 2 >> outputs.txt
node zero_waste_generator.js --ingredients "rice, egg" --threshold 1 --max 2 --strict >> outputs.txt
node zero_waste_generator.js --ingredients "rice, egg" --threshold 2 --max 2 --strict >> outputs.txt

# B: chicken, spinach
node zero_waste_generator.js --ingredients "chicken, spinach" --threshold 1 --max 2 >> outputs.txt
node zero_waste_generator.js --ingredients "chicken, spinach" --threshold 2 --max 2 >> outputs.txt
node zero_waste_generator.js --ingredients "chicken, spinach" --threshold 1 --max 2 --strict >> outputs.txt
node zero_waste_generator.js --ingredients "chicken, spinach" --threshold 2 --max 2 --strict >> outputs.txt

# C: pasta, tomato
node zero_waste_generator.js --ingredients "pasta, tomato" --threshold 1 --max 2 >> outputs.txt
node zero_waste_generator.js --ingredients "pasta, tomato" --threshold 2 --max 2 >> outputs.txt
node zero_waste_generator.js --ingredients "pasta, tomato" --threshold 1 --max 2 --strict >> outputs.txt
node zero_waste_generator.js --ingredients "pasta, tomato" --threshold 2 --max 2 --strict >> outputs.txt

# D: bread, cheese
node zero_waste_generator.js --ingredients "bread, cheese" --threshold 1 --max 2 >> outputs.txt
node zero_waste_generator.js --ingredients "bread, cheese" --threshold 2 --max 2 >> outputs.txt
node zero_waste_generator.js --ingredients "bread, cheese" --threshold 1 --max 2 --strict >> outputs.txt
node zero_waste_generator.js --ingredients "bread, cheese" --threshold 2 --max 2 --strict >> outputs.txt

# E: vegetables (failure case)
node zero_waste_generator.js --ingredients "vegetable oil" --threshold 1 --max 2 >> outputs.txt
node zero_waste_generator.js --ingredients "vegetable oil" --threshold 2 --max 2 >> outputs.txt
node zero_waste_generator.js --ingredients "vegetable oil" --threshold 1 --max 2 --strict >> outputs.txt
node zero_waste_generator.js --ingredients "vegetable oil" --threshold 2 --max 2 --strict >> outputs.txt

