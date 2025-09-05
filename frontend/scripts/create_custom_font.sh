#!/bin/bash

# Custom Font Creation Script for EduAssist
# Combines Baloo 2 Bold and Fredoka Regular into GameFont.ttf

echo "🎮 Creating custom GameFont for EduAssist..."

# Step 1: Setup directories
FONT_DIR="./public/fonts"
SCRIPT_DIR="./scripts"
mkdir -p "$FONT_DIR"
mkdir -p "$SCRIPT_DIR"

# Step 2: Download fonts if they don't exist
echo "📥 Downloading fonts..."
cd "$FONT_DIR"

if [ ! -f "Baloo2-Bold.ttf" ]; then
    echo "Downloading Baloo2-Bold.ttf..."
    curl -L -o "Baloo2-Bold.ttf" "https://github.com/google/fonts/raw/main/ofl/baloo2/Baloo2-Bold.ttf"
fi

if [ ! -f "Fredoka-Regular.ttf" ]; then
    echo "Downloading Fredoka-Regular.ttf..."
    curl -L -o "Fredoka-Regular.ttf" "https://github.com/google/fonts/raw/main/ofl/fredoka/Fredoka-Regular.ttf"
fi

# Step 3: Check if FontForge is available
if command -v fontforge &> /dev/null; then
    echo "🔧 FontForge found! Creating custom font..."
    
    # Run FontForge merge script
    fontforge -script "../../scripts/merge_fonts.pe"
    
    if [ -f "GameFont.ttf" ]; then
        echo "✅ Custom font generated: GameFont.ttf"
    else
        echo "❌ Font generation failed"
        exit 1
    fi
else
    echo "⚠️  FontForge not found. Installing FontForge..."
    echo "Please install FontForge:"
    echo "  - Windows: Download from https://fontforge.org/en-US/downloads/"
    echo "  - macOS: brew install fontforge"
    echo "  - Linux: sudo apt-get install fontforge"
    echo ""
    echo "After installation, run this script again."
    
    # Create a fallback by copying one of the fonts
    echo "📋 Creating fallback font (copying Baloo2-Bold.ttf as GameFont.ttf)..."
    cp "Baloo2-Bold.ttf" "GameFont.ttf"
    echo "✅ Fallback font created: GameFont.ttf"
fi

# Step 4: Verify font file exists
if [ -f "GameFont.ttf" ]; then
    echo "🎯 Font file size: $(du -h GameFont.ttf | cut -f1)"
    echo "📍 Font location: $(pwd)/GameFont.ttf"
    echo ""
    echo "🎨 Next steps:"
    echo "1. The font has been added to your project"
    echo "2. Update your Tailwind config (run: npm run setup-font)"
    echo "3. Use 'font-game' class in your components"
    echo ""
    echo "Example usage:"
    echo '<h1 className="text-3xl font-game">Welcome to EduAssist</h1>'
else
    echo "❌ Font creation failed"
    exit 1
fi

cd - > /dev/null
echo "🚀 Custom font setup complete!"
