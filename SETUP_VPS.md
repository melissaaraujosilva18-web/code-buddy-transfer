# 🎮 Guia Completo - Instalação da API no VPS

## ⚠️ IMPORTANTE - Leia Antes de Instalar

Esta API é um **CLONE/DEMO** dos jogos PGSoft. Os jogos funcionam de forma limitada:

### ✅ O que FUNCIONA:
- API gera URLs de jogos válidas
- Jogos abrem em nova aba
- Visual dos jogos é idêntico ao original

### ❌ O que NÃO FUNCIONA:
- **Jogos não carregam em iframe** (tela preta) - bloqueado por X-Frame-Options
- Apostas reais não funcionam corretamente
- Callbacks podem não retornar saldo/ganhos
- Não é a API oficial da PGSoft

### 🎯 Solução Atual no Vortexbet:
O sistema já está configurado com **fallback automático** - quando detecta que o iframe está bloqueado, oferece botão para abrir em nova aba.

---

## 📋 Pré-requisitos
- VPS Ubuntu 22.04 (Hostinger ou outro provedor)
- Acesso SSH ao servidor
- **IP público** (domínio é opcional, pode usar só o IP)

## 🚀 Passo a Passo

### 1️⃣ Conectar ao VPS via SSH
```bash
ssh root@seu-ip-ou-dominio
```

### 2️⃣ Atualizar Sistema
```bash
apt update && apt upgrade -y
```

### 3️⃣ Instalar Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node --version  # Verificar instalação
```

### 4️⃣ Instalar MySQL
```bash
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

# Configurar senha do root
mysql_secure_installation
```

### 5️⃣ Instalar Redis
```bash
apt install -y redis-server
systemctl start redis
systemctl enable redis
```

### 6️⃣ Instalar Yarn
```bash
npm install -g yarn
```

### 7️⃣ Clonar API do GitHub
```bash
cd /var/www
git clone https://github.com/mrdamaia/Api-PGSOFT.git
cd Api-PGSOFT
```

### 8️⃣ Instalar Dependências
```bash
yarn install
```

### 9️⃣ Configurar Banco de Dados MySQL
```bash
# Entrar no MySQL
mysql -u root -p

# Criar banco e usuário
CREATE DATABASE pgsoft;
CREATE USER 'pgsoft'@'localhost' IDENTIFIED BY 'SuaSenhaForte123!';
GRANT ALL PRIVILEGES ON pgsoft.* TO 'pgsoft'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Importar estrutura
mysql -u pgsoft -p pgsoft < apidb.sql
```

### 🔟 Configurar Agente no MySQL
```bash
mysql -u pgsoft -p pgsoft
```

```sql
-- Inserir seu agente (IMPORTANTE!)
INSERT INTO agents (
  agentCode, 
  agentToken, 
  secretKey, 
  callbackurl,
  probganho,
  probbonus,
  probganhortp,
  saldo
) VALUES (
  'VORTEX',                    -- Seu código de agente
  'seu_token_aqui_123',         -- Crie um token único
  'sua_chave_secreta_456',      -- Crie uma chave secreta
  'https://ryuexvaocxzqpfcekejh.supabase.co/functions/v1/game-api-callback',  -- URL do callback
  '50',                         -- Probabilidade de ganho padrão
  '10',                         -- Probabilidade de bônus
  '96',                         -- RTP padrão (96%)
  10000                         -- Saldo inicial
);

-- Verificar
SELECT * FROM agents;
EXIT;
```

### 1️⃣1️⃣ Configurar Variáveis de Ambiente
```bash
nano .env
```

Cole e ajuste:
```env
AMBIENTE=PROD
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=pgsoft
DB_PASSWORD=SuaSenhaForte123!
DB_NAME=pgsoft
PORT=3000
API_SECRET=seu_secret_aleatorio_aqui
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Salve com `CTRL+X`, depois `Y`, depois `ENTER`

### 1️⃣2️⃣ Compilar TypeScript
```bash
yarn build
```

### 1️⃣3️⃣ Instalar PM2 (Gerenciador de Processos)
```bash
npm install -g pm2
```

### 1️⃣4️⃣ Iniciar API com PM2
```bash
pm2 start dist/indexprod.js --name "api-jogos"
pm2 save
pm2 startup
```

### 1️⃣5️⃣ Verificar Status
```bash
pm2 status
pm2 logs api-jogos
```

### 1️⃣6️⃣ Configurar Firewall
```bash
ufw allow 3000/tcp
ufw allow 443/tcp
ufw allow 80/tcp
ufw allow 22/tcp
ufw enable
```

### 1️⃣7️⃣ (Opcional) Configurar Nginx como Proxy Reverso
```bash
apt install -y nginx

nano /etc/nginx/sites-available/api-jogos
```

Cole:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;  # ou seu IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Ativar:
```bash
ln -s /etc/nginx/sites-available/api-jogos /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## ✅ Testar API

```bash
curl http://localhost:3000/status
# Deve retornar: {"status":"operational"}
```

Ou no navegador:
```
http://seu-ip:3000/status
```

## 🎯 Configurar no Painel Admin Vortexbet

### **IMPORTANTE**: Use o IP da sua VPS, NÃO precisa de domínio!

1. Acesse `/admin` → Settings
2. Configure:
   - **URL da API**: `http://SEU-IP-VPS:3000` (exemplo: `http://31.97.84.170:3000`)
   - **Agent Token**: o mesmo que colocou no MySQL (da linha 98 do script SQL)
   - **Agent Code**: VORTEX (ou o que você definiu na linha 94)
   - **Secret Key**: o mesmo que colocou no MySQL (da linha 99)
3. Salve

**Nota**: Se quiser usar domínio (opcional), configure Nginx + SSL conforme passo 17

## 🎮 Testar Jogos

1. Acesse a plataforma Vortexbet
2. Clique em qualquer jogo
3. **Comportamento esperado**:
   - ✅ Loading aparece
   - ✅ URL do jogo é gerada (veja nos logs: `pm2 logs api-jogos`)
   - ❌ Tela preta no iframe (X-Frame-Options bloqueia)
   - ✅ Mensagem de fallback aparece: "Abrir em nova aba"
4. Clique em "Abrir em nova aba" - o jogo abre e funciona visualmente

## 📊 Monitoramento

```bash
# Ver logs em tempo real
pm2 logs api-jogos

# Ver status
pm2 status

# Reiniciar se necessário
pm2 restart api-jogos

# Ver logs do MySQL
tail -f /var/log/mysql/error.log
```

## 🔧 Troubleshooting

### Erro de conexão MySQL
```bash
systemctl status mysql
systemctl restart mysql
```

### Erro de conexão Redis
```bash
systemctl status redis
systemctl restart redis
```

### API não inicia
```bash
cd /var/www/Api-PGSOFT
yarn build
pm2 restart api-jogos
pm2 logs
```

### Portas em uso
```bash
netstat -tulpn | grep 3000
# Se algo estiver rodando na porta 3000, mate o processo ou mude a porta no .env
```

## 🎉 Pronto!

Sua API está rodando e integrada com a plataforma Vortexbet!

**URLs importantes:**
- API: `http://SEU-IP-VPS:3000`
- Status: `http://SEU-IP-VPS:3000/status`
- Callback: configurado automaticamente no MySQL

**Credenciais para lembrar:**
- Agent Token (colocou no MySQL linha 98)
- Agent Code (VORTEX - linha 94)
- Secret Key (linha 99)
- URL da API: `http://SEU-IP-VPS:3000` (coloca no painel admin)

---

## 🔴 Limitações Conhecidas (API Clone/Demo)

### Problema: Tela Preta no Iframe
**Causa**: URLs retornadas têm `X-Frame-Options: SAMEORIGIN` que bloqueiam iframe  
**Solução**: O sistema já tem fallback automático - abre em nova aba

### Por que isso acontece?
Esta é uma API clone/demo que:
- Gera tokens válidos da PGSoft
- Mas aponta para servidores demo que bloqueiam iframe
- Não é a integração oficial da PGSoft

### O que você pode fazer:
1. **Aceitar limitação**: Jogos funcionam em nova aba (atual)
2. **Migrar para API oficial**: Requer contrato com PGSoft + domínio whitelistado
3. **Criar jogos próprios**: Desenvolver slots/crash games proprietários

---

**Suporte:** Se tiver problemas, verifique os logs com `pm2 logs api-jogos`
