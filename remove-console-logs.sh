#!/bin/bash

# Script to remove console.log statements from TypeScript/JavaScript files
echo "Removing console.log statements from frontend..."

# Files that still have console statements
files=(
  "frontend/src/app/edit-paper/[paperIndex]/EditPaperClient.tsx"
  "frontend/src/app/result/page.tsx"
  "frontend/src/components/ChatButton.tsx"
  "frontend/src/app/submit-project/page.tsx"
  "frontend/src/app/reporting-papers/page.tsx"
  "frontend/src/app/login/page.tsx"
  "frontend/src/app/edit-project/[paperIndex]/EditProjectClient.tsx"
  "frontend/src/app/contexts/RefreshContext.tsx"
  "frontend/src/app/contexts/AuthContext.tsx"
  "frontend/src/app/admin/page.tsx"
  "frontend/src/app/api/auth/login/route.ts"
  "frontend/src/app/api/papers/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    # Remove console.log, console.error, console.warn lines
    sed -i.bak '/console\.\(log\|error\|warn\)/d' "$file"
    # Clean up backup files
    rm "${file}.bak"
  fi
done

echo "Console statements removed successfully!"