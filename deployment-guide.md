# Guia de Deploy - ONUS App

## Problema: 404 Not Found

O erro 404 indica que o Nginx não está encontrando os arquivos da aplicação. Siga os passos abaixo:

## 1. Verificar se os arquivos estão no local correto

```bash
# Verificar se a pasta dist existe no servidor
ls -la /www/wwwroot/onus.goonus.pro/

# Deve mostrar a pasta 'dist' com os arquivos buildados
ls -la /www/wwwroot/onus.goonus.pro/dist/
```

## 2. Upload dos arquivos (se não existirem)

### Opção A: Via FTP/SFTP
1. Faça upload de toda a pasta `dist/` do seu projeto local
2. Coloque em: `/www/wwwroot/onus.goonus.pro/dist/`

### Opção B: Via comando (se tiver acesso SSH)
```bash
# No seu computador local (dentro da pasta do projeto)
scp -r dist/* usuario@servidor:/www/wwwroot/onus.goonus.pro/dist/
```

## 3. Verificar permissões

```bash
# Ajustar permissões da pasta
chown -R www-data:www-data /www/wwwroot/onus.goonus.pro/
chmod -R 755 /www/wwwroot/onus.goonus.pro/
```

## 4. Verificar configuração do Nginx

### Aplicar a configuração corrigida:
1. Copie o conteúdo do arquivo `nginx.conf` deste projeto
2. Cole em: `/www/server/panel/vhost/nginx/onus.goonus.pro.conf`
3. Teste a configuração:

```bash
nginx -t
```

4. Se o teste passar, recarregue o Nginx:

```bash
systemctl reload nginx
# ou
service nginx reload
```

## 5. Verificar se o index.html existe

```bash
# Verificar se o arquivo principal existe
ls -la /www/wwwroot/onus.goonus.pro/dist/index.html

# Verificar o conteúdo (primeiras linhas)
head -10 /www/wwwroot/onus.goonus.pro/dist/index.html
```

## 6. Logs para debug

```bash
# Verificar logs de erro do Nginx
tail -f /www/wwwlogs/onus.goonus.pro.error.log

# Verificar logs de acesso
tail -f /www/wwwlogs/onus.goonus.pro.log
```

## 7. Estrutura esperada no servidor

```
/www/wwwroot/onus.goonus.pro/
└── dist/
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   ├── index-[hash].css
    │   └── ...
    └── logo1.svg (se existir)
```

## 8. Teste rápido

Após seguir os passos acima, teste:

1. Acesse: `https://onus.goonus.pro`
2. Verifique se carrega a página inicial
3. Teste navegação (React Router)

## Comandos úteis para debug:

```bash
# Verificar status do Nginx
systemctl status nginx

# Verificar configuração ativa
nginx -T | grep -A 20 "server_name onus.goonus.pro"

# Testar conectividade
curl -I https://onus.goonus.pro
```

## Checklist final:

- [ ] Arquivos da pasta `dist/` estão em `/www/wwwroot/onus.goonus.pro/dist/`
- [ ] Permissões corretas (755 para pastas, 644 para arquivos)
- [ ] Configuração Nginx aplicada e testada
- [ ] Nginx recarregado
- [ ] Certificado SSL funcionando
- [ ] Logs não mostram erros

Se ainda houver problemas, verifique os logs de erro para mais detalhes específicos.