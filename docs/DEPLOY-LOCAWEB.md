# Publicando a GetFesta na Locaweb

## Antes de tudo: qual plano da Locaweb usar

Este projeto é uma aplicação **Next.js** (Node.js) com banco **PostgreSQL**. Isso **não roda** na
"Hospedagem de Sites" clássica da Locaweb (o plano de cPanel voltado a PHP/MySQL) — esse plano não
executa processos Node.js nem oferece PostgreSQL.

O plano certo é o **Locaweb Cloud (Cloud Server / VPS Linux)**. Recomendação de ponto de partida:

- Ubuntu 22.04 LTS
- 2 vCPUs / 4 GB RAM (dá folga para o Next.js + PostgreSQL no mesmo servidor na fase inicial)
- Disco 40 GB+ (o plano já orienta não hospedar vídeo — só fotos comprimidas — então isso é confortável)

Se você já tem um plano de hospedagem de sites da Locaweb, ele **não serve para este projeto** —
será necessário contratar (ou migrar para) um Cloud Server.

Este guia assume acesso SSH root/sudo ao servidor e um domínio já apontado ou pronto para apontar
para o IP do servidor (isso se configura no painel da Locaweb, em "Domínios" → DNS, criando um
registro `A` para o IP do Cloud Server).

---

## 1. Preparar o servidor

Conecte via SSH e atualize o sistema:

```bash
ssh root@SEU_IP_AQUI
apt update && apt upgrade -y
```

Instale o Node.js 20 LTS (via NodeSource):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # confirme v20.x
```

Instale o PostgreSQL:

```bash
apt install -y postgresql postgresql-contrib
systemctl enable postgresql --now
```

Instale o PM2 (mantém o processo Next.js no ar e reinicia sozinho em caso de queda ou reboot):

```bash
npm install -g pm2
```

Instale o Nginx (proxy reverso na porta 80/443 → Next.js na 3000) e o Certbot (SSL gratuito):

```bash
apt install -y nginx certbot python3-certbot-nginx
```

---

## 2. Criar o banco de dados

```bash
sudo -u postgres psql -c "CREATE USER getfesta WITH PASSWORD 'escolha-uma-senha-forte';"
sudo -u postgres psql -c "CREATE DATABASE getfesta OWNER getfesta;"
```

> Guarde essa senha — ela vai para o `DATABASE_URL` no passo 4.

---

## 3. Enviar o projeto para o servidor

Envie a pasta `convidde-mvp/` (o código deste MVP) para o servidor — por `git clone` (se o
código estiver em um repositório privado) ou por SFTP (ex.: FileZilla, WinSCP), para um diretório
como `/var/www/getfesta`.

```bash
mkdir -p /var/www/getfesta
# envie os arquivos para /var/www/getfesta (git clone ou SFTP)
cd /var/www/getfesta
```

---

## 4. Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

Ajuste:

```
DATABASE_URL="postgresql://getfesta:escolha-uma-senha-forte@localhost:5432/getfesta"
SESSION_SECRET="gere-um-valor-aleatorio-aqui"
```

Gere um `SESSION_SECRET` forte com:

```bash
openssl rand -hex 32
```

---

## 5. Aplicar o schema e os dados iniciais

```bash
psql -U getfesta -d getfesta -h localhost -f db/schema.sql
```

O `db/seed.ts` cria **dados de demonstração** (empresas fictícias, cliente de teste, senha
`teste123`) — útil para testar antes do lançamento, mas **não deve ir para produção como está**.
Antes de rodar em produção, abra `db/seed.ts` e mantenha apenas os blocos de cidades/bairros e
categorias (que são dados de referência reais), removendo os blocos de empresas/pedidos fictícios.
Depois disso:

```bash
npm run seed
```

---

## 6. Build e primeira execução

```bash
npm ci
npm run build
pm2 start npm --name getfesta -- run start -- -p 3000
pm2 save
pm2 startup   # siga a instrução impressa para o PM2 iniciar sozinho no boot do servidor
```

Confirme que está no ar localmente no próprio servidor:

```bash
curl -I http://localhost:3000
```

---

## 7. Configurar o Nginx (proxy reverso) e o domínio

Crie `/etc/nginx/sites-available/getfesta`:

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative e reinicie:

```bash
ln -s /etc/nginx/sites-available/getfesta /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Emita o certificado SSL gratuito (o domínio precisa já estar apontando para o IP do servidor):

```bash
certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

---

## 8. Firewall básico

```bash
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw enable
```

O PostgreSQL (porta 5432) não precisa ficar acessível pela internet — por padrão, o pacote do
Ubuntu já o mantém escutando só em `localhost`, o que é o comportamento desejado aqui.

---

## 9. Atualizações futuras (deploy de uma nova versão)

```bash
cd /var/www/getfesta
git pull                # ou reenvie os arquivos alterados por SFTP
npm ci
npm run build
pm2 reload getfesta
```

---

## 10. Backup do banco (recomendado desde o dia 1)

Backup manual:

```bash
pg_dump -U getfesta -h localhost getfesta > backup-$(date +%F).sql
```

Para automatizar diariamente, adicione ao `crontab -e`:

```
0 3 * * * pg_dump -U getfesta -h localhost getfesta > /var/backups/getfesta-$(date +\%F).sql
```

---

## O que ainda está mockado (ver `README.md`)

Pagamento (Mercado Pago), SMS de verificação e consulta de CNPJ à Receita Federal ainda não têm
integração real nesta versão — o app funciona, mas esses três pontos precisam ser implementados
antes de cobrar de fornecedores de verdade ou depender da verificação automática de identidade.
