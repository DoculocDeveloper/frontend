import * as ftp from "basic-ftp";
import "dotenv/config";
import path from "node:path";
import fs from "node:fs";

async function runDeploy() {
  const host = process.env.FTP_HOST;
  const user = process.env.FTP_USER;
  const password = process.env.FTP_PASSWORD;
  const port = process.env.FTP_PORT ? Number(process.env.FTP_PORT) : 21;
  const remoteDir = process.env.FTP_REMOTE_DIR || "app.doculoc.com.br";
  const secure = process.env.FTP_SECURE === "true";

  if (!host || !user || !password) {
    console.error("\n❌ ERRO: Credenciais de FTP não encontradas no arquivo .env!\n");
    console.error("Por favor, adicione as seguintes variáveis no seu frontend/.env:\n");
    console.error("  FTP_HOST=ftp.doculoc.com.br");
    console.error("  FTP_USER=deploy@doculoc.com.br");
    console.error("  FTP_PASSWORD=sua-senha");
    console.error("  FTP_PORT=21");
    console.error("  FTP_REMOTE_DIR=app.doculoc.com.br");
    console.error("  FTP_SECURE=false\n");
    process.exit(1);
  }

  const distPath = path.resolve(process.cwd(), "dist");
  if (!fs.existsSync(distPath)) {
    console.error("\n❌ ERRO: A pasta 'dist' não existe. Execute 'npm run build' primeiro.\n");
    process.exit(1);
  }

  const client = new ftp.Client();
  client.ftp.verbose = false;
  // Aumenta o tempo limite de resposta para 60 segundos
  client.ftp.timeout = 60000;
  // Força modo passivo IPv4 (PASV), evitando timeout no EPSV da HostGator
  client.prepareTransfer = ftp.enterPassiveModeIPv4;

  console.log(`\n🚀 Conectando ao FTP da HostGator (${host})...`);

  try {
    await client.access({
      host,
      user,
      password,
      port,
      secure,
      secureOptions: {
        rejectUnauthorized: false,
      },
    });

    console.log(`✅ Conexão estabelecida com sucesso!`);

    const currentDir = await client.pwd();
    console.log(`📁 Diretório FTP conectado: ${currentDir}`);

    // Se a pasta for a raiz '/' ou vazia, ou já estiver posicionado nela
    if (remoteDir === "/" || remoteDir === "" || currentDir.endsWith(remoteDir) || currentDir.includes(remoteDir)) {
      console.log(`✅ Já posicionado no diretório raiz do site.`);
      try {
        await client.removeDir("app.doculoc.com.br");
        console.log(`🧹 Subpasta duplicada 'app.doculoc.com.br' removida com sucesso.`);
      } catch {
        // Ignora se não existir ou se não conseguir remover
      }
    } else {
      console.log(`📁 Entrando na pasta: ${remoteDir}`);
      await client.ensureDir(remoteDir);
    }

    console.log(`📤 Enviando arquivos do build para a raiz do site...`);
    const startTime = Date.now();

    await client.uploadFromDir(distPath);

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 Deploy concluído com sucesso em ${elapsedSeconds}s!`);
    console.log(`🌐 O site app.doculoc.com.br já está atualizado na HostGator.\n`);
  } catch (error) {
    console.error("\n❌ Erro durante o deploy via FTP:", error);
    process.exit(1);
  } finally {
    client.close();
  }
}

runDeploy();
