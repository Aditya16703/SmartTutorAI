const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'frontend/src/app/learn/[id]/_components'),
  path.join(__dirname, 'frontend/src/app/profile/_components'),
  path.join(__dirname, 'frontend/src/app/learn/_components')
];

// Replaces neon classes with unified Foundation themes
const patterns = [
  {
    // Match backgrounds containing gradients
    regex: /bg-gradient-to-[a-z]+\s+from-[a-z]+-[0-9]+(?:\/[0-9]+)?\s+(?:via-[a-z]+-[0-9]+(?:\/[0-9]+)?\s+)?to-[a-z]+-[0-9]+(?:\/[0-9]+)?(?:\s+dark:from-[a-z]+-[0-9]+(?:\/[0-9]+)?\s+(?:dark:via-[a-z]+-[0-9]+(?:\/[0-9]+)?\s+)?dark:to-[a-z]+-[0-9]+(?:\/[0-9]+)?)?/g,
    replace: 'bg-primary'
  },
  {
    // Fix primary button hovers that might have been hit
    regex: /hover:from-[a-z]+-[0-9]+\s+hover:to-[a-z]+-[0-9]+/g,
    replace: 'hover:bg-primary/90'
  },
  {
    // Common background overlays that had explicit colors
    regex: /bg-(indigo|blue|teal|emerald|orange|purple|violet|amber|gray)-[0-9]{2,3}(?:\/[0-9]{2})?/g,
    replace: 'bg-primary/10'
  },
  {
      // Specifically target card backgrounds that need to be bg-card
      regex: /bg-primary\/10(?:\s+dark:bg-primary\/10)?\s+border-[a-z]+-[0-9]+\s+(?:dark:border-[a-z]+-[0-9]+\s+)?shadow-sm/g,
      replace: 'bg-card border-border shadow-sm'
  },
  {
      // Target specific Card container classes found in Flashcards and Audio Overview
      regex: /bg-[a-z]+-[0-9]+\s+dark:bg-[a-z]+-[0-9]+\/[0-9]+\s+rounded-lg\s+p-4\s+border\s+border-[a-z]+-[0-9]+\s+dark:border-[a-z]+-[0-9]+/g,
      replace: 'bg-card rounded-lg p-4 border border-border'
  },
  {
    // Text colors
    regex: /text-(indigo|blue|teal|emerald|orange|purple|violet|amber|gray)-(400|500|600|700|800|900)(?:\/[0-9]{2})?/g,
    replace: 'text-primary'
  },
  {
    // Text colors (light variants that should be foreground)
    regex: /text-(indigo|blue|teal|emerald|orange|purple|violet|amber|gray)-(100|200|300)(?:\/[0-9]{2})?/g,
    replace: 'text-foreground'
  },
  {
    // Border colors
    regex: /border-(indigo|blue|teal|emerald|orange|purple|violet|amber|gray)-[0-9]{2,3}(?:\/[0-9]{2})?/g,
    replace: 'border-border'
  },
  {
    // Hover backgrounds
    regex: /hover:bg-(indigo|blue|teal|emerald|orange|purple|violet|amber|gray)-[0-9]{2,3}(?:\/[0-9]{2})?/g,
    replace: 'hover:bg-primary/10'
  },
  {
    // Replace text-primary when it hits text that should be white on a primary bg
    regex: /text-primary\s+text-white/g,
    replace: 'text-primary-foreground'
  },
  {
    // Fix Card classes specifically injected into components
    regex: /className="bg-primary border-border shadow-sm overflow-hidden( min-h-\[400px\])?"/g,
    replace: 'className="bg-card border-border shadow-sm overflow-hidden$1"'
  }
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    for (const { regex, replace } of patterns) {
      content = content.replace(regex, replace);
    }
    
    // Additional manual sweeps for the icons and dark specific rules that were flattened
    content = content.replace(/dark:text-[a-z]+-[0-9]+/g, '');
    content = content.replace(/dark:border-[a-z]+-[0-9]+\/[0-9]+/g, '');
    content = content.replace(/dark:bg-[a-z]+-[0-9]+\/[0-9]+/g, '');
    content = content.replace(/dark:hover:bg-[a-z]+-[0-9]+\/[0-9]+/g, '');
    // Remove empty spaces left behind
    content = content.replace(/\s{2,}/g, ' ');

    if (content !== original) {
      console.log(`Modified: ${filePath}`);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

directories.forEach(processDirectory);
console.log('Cleanup complete!');
