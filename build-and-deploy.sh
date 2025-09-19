#!/bin/bash

# Script de build e deploy para aplicação React com nginx

echo "🚀 Iniciando processo de build e deploy..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm primeiro."
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Fazer build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro durante o build da aplicação."
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# Verificar se o Docker está instalado (opcional)
if command -v docker &> /dev/null; then
    echo "🐳 Docker encontrado. Você pode usar 'docker-compose up --build' para deploy com Docker."
else
    echo "ℹ️  Docker não encontrado. Deploy manual necessário."
fi

# Instruções para deploy manual
echo ""
echo "📋 Instruções para deploy:"
echo "1. Copie o conteúdo da pasta 'dist' para o diretório do seu servidor web"
echo "2. Configure o nginx usando o arquivo 'nginx.conf' fornecido"
echo "3. Reinicie o nginx"
echo ""
echo "🌐 Para deploy com Docker:"
echo "   docker-compose up --build -d"
echo ""
echo "✨ Deploy concluído!"