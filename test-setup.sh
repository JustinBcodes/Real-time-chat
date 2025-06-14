#!/bin/bash

echo "🚀 Testing Real-Time Chat App Setup"
echo "=================================="

# Check if environment files exist
echo "📁 Checking environment files..."
if [ -f "apps/web/.env" ]; then
    echo "✅ Web .env file exists"
    cat apps/web/.env
else
    echo "❌ Web .env file missing"
    echo "VITE_SERVER_URL=http://localhost:4001" > apps/web/.env
    echo "✅ Created web .env file"
fi

if [ -f "apps/server/.env" ]; then
    echo "✅ Server .env file exists"
    cat apps/server/.env
else
    echo "❌ Server .env file missing"
    echo -e "PORT=4001\nCLIENT_ORIGIN=http://localhost:3001" > apps/server/.env
    echo "✅ Created server .env file"
fi

echo ""
echo "🔧 Configuration Summary:"
echo "Frontend: http://localhost:3001 (Vite + React)"
echo "Backend: http://localhost:4001 (Express + Socket.io)"
echo ""

echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ Root dependencies installed"
else
    echo "⏳ Installing root dependencies..."
    npm install
fi

if [ -d "apps/server/node_modules" ]; then
    echo "✅ Server dependencies installed"
else
    echo "⏳ Installing server dependencies..."
    cd apps/server && npm install && cd ../..
fi

if [ -d "apps/web/node_modules" ]; then
    echo "✅ Web dependencies installed"
else
    echo "⏳ Installing web dependencies..."
    cd apps/web && npm install && cd ../..
fi

echo ""
echo "🎯 Ready to start!"
echo "Run these commands in separate terminals:"
echo ""
echo "Terminal 1 (Backend):"
echo "cd apps/server && npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "cd apps/web && npm run dev"
echo ""
echo "Then visit http://localhost:3001" 