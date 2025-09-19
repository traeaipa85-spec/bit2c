# Deploy Instructions - bit2c.siginsapp.com

## 📦 Build de Produção

O build foi gerado com sucesso na pasta `dist/` contendo:

### Arquivos Principais:
- `index.html` - Arquivo principal da SPA
- `assets/` - Pasta com todos os recursos estáticos
  - CSS: `index-CM153-CJ.css` (29.92 kB)
  - JavaScript chunks:
    - `index-CNmFv24b.js` (149.07 kB) - Código principal
    - `firebase-j9WycYpm.js` (335.95 kB) - Firebase
    - `vendor-BXk_ma1u.js` (139.72 kB) - Dependências
    - `ui-B0qEMjx1.js` (116.68 kB) - Componentes UI
    - `router-B3WZXNwd.js` (31.50 kB) - Roteamento

## 🚀 Instruções de Deploy

### 1. Upload dos Arquivos
Faça upload de todo o conteúdo da pasta `dist/` para:
```
/www/wwwroot/bit2c.siginsapp.com/
```

### 2. Configuração Nginx
Use o arquivo `nginx.conf` fornecido que inclui:

#### ✅ Configurações SPA:
- **Fallback para index.html**: Todas as rotas (`/auth`, `/sms`, `/email`, `/server`) redirecionam para `index.html`
- **Try files**: `try_files $uri $uri/ /index.html;`

#### ✅ Otimizações de Performance:
- **Cache longo** para assets estáticos (1 ano)
- **Compressão Gzip** habilitada
- **Headers de segurança** configurados

#### ✅ Rotas Específicas:
```nginx
# Rotas principais da SPA
location ~ ^/(auth|sms|email|server)(/.*)?$ {
    try_files $uri $uri/ /index.html;
}
```

### 3. Aplicar Configuração
1. Substitua a configuração atual do Nginx pelo conteúdo do arquivo `nginx.conf`
2. Teste a configuração: `nginx -t`
3. Recarregue o Nginx: `systemctl reload nginx`

## 🔧 Recursos Configurados

### SSL/HTTPS ✅
- Certificados SSL configurados
- Redirecionamento HTTP → HTTPS
- Headers de segurança HSTS

### Compressão ✅
- Gzip habilitado para JS, CSS, HTML, JSON
- Redução significativa no tamanho dos arquivos

### Cache ✅
- Assets estáticos: 1 ano
- Imagens: 30 dias  
- JS/CSS: 12 horas

### Segurança ✅
- Headers de segurança (XSS, CSRF, etc.)
- Bloqueio de arquivos sensíveis
- CSP configurado

## 🌐 Rotas Suportadas

A configuração suporta todas as rotas da SPA:
- `/` - Página inicial
- `/auth` - Autenticação
- `/sms` - Página SMS
- `/email` - Página Email  
- `/server` - Página Server
- Qualquer subrota dessas páginas

## ✅ Verificação

Após o deploy, teste:
1. `https://bit2c.siginsapp.com/` - Página inicial
2. `https://bit2c.siginsapp.com/auth` - Deve carregar a SPA
3. `https://bit2c.siginsapp.com/sms` - Deve carregar a SPA
4. `https://bit2c.siginsapp.com/email` - Deve carregar a SPA
5. Refresh em qualquer rota - Deve funcionar sem erro 404

## 📊 Tamanho Total do Build
- **Total comprimido**: ~208 kB (gzip)
- **Total descomprimido**: ~803 kB
- **Otimizado** para carregamento rápido