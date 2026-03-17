#!/bin/bash
# PrivacyShield — Development Environment Setup
# Run this script to get everything ready for development

set -e

echo "🛡️  PrivacyShield — Dev Environment Setup"
echo "=========================================="

# ============ Check Prerequisites ============
echo ""
echo "📋 Checking prerequisites..."

# Go
if command -v go &> /dev/null; then
    GO_VERSION=$(go version | awk '{print $3}')
    echo "   ✅ Go: $GO_VERSION"
else
    echo "   ❌ Go not found. Install from https://go.dev/dl/"
    echo "      Required: Go 1.21+"
    exit 1
fi

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js: $NODE_VERSION"
else
    echo "   ❌ Node.js not found. Install from https://nodejs.org/"
    echo "      Required: Node 18+"
    exit 1
fi

# AlgoKit
if command -v algokit &> /dev/null; then
    ALGOKIT_VERSION=$(algokit --version 2>/dev/null || echo "installed")
    echo "   ✅ AlgoKit: $ALGOKIT_VERSION"
else
    echo "   ⚠️  AlgoKit not found. Install with:"
    echo "      pipx install algokit"
    echo "      See: https://github.com/algorandfoundation/algokit-cli"
fi

# VibeKit (optional)
if command -v vibekit &> /dev/null; then
    echo "   ✅ VibeKit: installed"
else
    echo "   ⚠️  VibeKit not found (optional). Install with:"
    echo "      curl -fsSL https://getvibekit.ai/install.sh | bash"
fi

# ============ Setup Circuits ============
echo ""
echo "⚙️  Setting up ZK circuits..."
cd circuits
go mod tidy 2>/dev/null || echo "   (run 'go mod tidy' in circuits/ after first build)"
cd ..

# ============ Setup Backend ============
echo ""
echo "⚙️  Setting up Go backend..."
cd backend
go mod tidy 2>/dev/null || echo "   (run 'go mod tidy' in backend/ after first build)"
cd ..

# ============ Setup Frontend ============
echo ""
echo "⚙️  Setting up React frontend..."
cd frontend
if [ -f "package.json" ]; then
    npm install 2>/dev/null && echo "   ✅ Frontend dependencies installed" || echo "   (run 'npm install' in frontend/)"
fi
cd ..

# ============ Environment ============
echo ""
echo "⚙️  Setting up environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "   ✅ Created .env from .env.example"
    echo "   ⚠️  Edit .env and add your Algorand TestNet mnemonic"
else
    echo "   ✅ .env already exists"
fi

# ============ Algorand TestNet Account ============
echo ""
echo "=========================================="
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo ""
echo "  1. Get a TestNet account:"
echo "     algokit account create"
echo "     Fund it: https://bank.testnet.algorand.network/"
echo ""
echo "  2. Add your mnemonic to .env:"
echo "     ALGORAND_MNEMONIC=word1 word2 word3 ..."
echo ""
echo "  3. Compile ZK circuit + generate Algorand verifier:"
echo "     cd circuits && go run main.go"
echo ""
echo "  4. Deploy contracts to TestNet:"
echo "     cd contracts && algokit deploy"
echo ""
echo "  5. Start backend:"
echo "     cd backend && go run cmd/main.go"
echo ""
echo "  6. Start frontend:"
echo "     cd frontend && npm run dev"
echo ""
echo "  7. Open http://localhost:5173 in your browser"
echo ""
echo "=========================================="
