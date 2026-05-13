#!/bin/bash
echo "🚀 ConnectX Chat - Setup Script"
echo "================================"

echo ""
echo "📦 Installing Server dependencies..."
cd server && npm install
cd ..

echo ""
echo "📦 Installing Client dependencies..."
cd client && npm install
cd ..

echo ""
echo "📦 Installing Mobile dependencies..."
cd mobile && npm install
cd ..

echo ""
echo "⚙️  Setting up environment files..."
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "✅ Created server/.env — Please fill in your values!"
fi

if [ ! -f client/.env.local ]; then
  echo "REACT_APP_API_URL=http://localhost:5000/api" > client/.env.local
  echo "REACT_APP_SOCKET_URL=http://localhost:5000" >> client/.env.local
  echo "✅ Created client/.env.local"
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit server/.env with your MongoDB URI, JWT secrets, Cloudinary keys"
echo "  2. Start backend:  cd server && npm run dev"
echo "  3. Start frontend: cd client && npm start"
echo "  4. Start mobile:   cd mobile && npx expo start"
echo ""
echo "🌐 Web:    http://localhost:3000"
echo "⚙️  API:    http://localhost:5000"
echo "❤️  ConnectX — Chat. Connect. Evolve."
