@echo off
echo 🚀 Iniciando processo de build e deploy...

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Por favor, instale o Node.js primeiro.
    pause
    exit /b 1
)

REM Verificar se o npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm não encontrado. Por favor, instale o npm primeiro.
    pause
    exit /b 1
)

REM Instalar dependências
echo 📦 Instalando dependências...
npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências.
    pause
    exit /b 1
)

REM Fazer build da aplicação
echo 🔨 Fazendo build da aplicação...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Erro durante o build da aplicação.
    pause
    exit /b 1
)

echo ✅ Build concluído com sucesso!

REM Verificar se o Docker está instalado (opcional)
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 🐳 Docker encontrado. Você pode usar 'docker-compose up --build' para deploy com Docker.
) else (
    echo ℹ️  Docker não encontrado. Deploy manual necessário.
)

echo.
echo 📋 Instruções para deploy:
echo 1. Copie o conteúdo da pasta 'dist' para o diretório do seu servidor web
echo 2. Configure o nginx usando o arquivo 'nginx.conf' fornecido
echo 3. Reinicie o nginx
echo.
echo 🌐 Para deploy com Docker:
echo    docker-compose up --build -d
echo.
echo ✨ Deploy concluído!
pause