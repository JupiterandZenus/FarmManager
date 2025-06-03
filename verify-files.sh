#!/bin/bash

echo "Verifying file permissions and existence..."

# Check Entry.sh
if [ -f "Entry.sh" ]; then
    echo "✅ Entry.sh exists"
    ls -l Entry.sh
else
    echo "❌ Entry.sh not found"
fi

# Check fix-permissions.sh
if [ -f "fix-permissions.sh" ]; then
    echo "✅ fix-permissions.sh exists"
    ls -l fix-permissions.sh
else
    echo "❌ fix-permissions.sh not found"
fi

# Check if files are executable
if [ -x "Entry.sh" ]; then
    echo "✅ Entry.sh is executable"
else
    echo "❌ Entry.sh is not executable"
    chmod +x Entry.sh
    echo "   Made Entry.sh executable"
fi

if [ -x "fix-permissions.sh" ]; then
    echo "✅ fix-permissions.sh is executable"
else
    echo "❌ fix-permissions.sh is not executable"
    chmod +x fix-permissions.sh
    echo "   Made fix-permissions.sh executable"
fi

# Check line endings
if file Entry.sh | grep -q "CRLF"; then
    echo "⚠️ Entry.sh has Windows line endings"
    echo "Converting to Unix line endings..."
    sed -i 's/\r$//' Entry.sh
    echo "✅ Converted Entry.sh to Unix line endings"
fi

if file fix-permissions.sh | grep -q "CRLF"; then
    echo "⚠️ fix-permissions.sh has Windows line endings"
    echo "Converting to Unix line endings..."
    sed -i 's/\r$//' fix-permissions.sh
    echo "✅ Converted fix-permissions.sh to Unix line endings"
fi

echo "Verification complete!" 