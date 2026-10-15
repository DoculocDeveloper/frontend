import * as ftp from "basic-ftp";
import "dotenv/config";
import path from "node:path";
import fs from "node:fs";

async function runDeploy() {
  const host = process.env.FTP_HOST;
  const user = process.env.FTP_USER;
  const password = process.env.FTP_PASSWORD;
  const port = process.env.FTP_PORT ? Number(process.env.FTP_PORT) : 21;
  const remoteDir = process.env.FTP_REMOTE_DIR || "public_html";
  const secure = process.env.FTP_SECURE === "true";

  if (!host || !user || !password) {
    console.error("\n❌ ERRO: Credenciais de FTP não encontradas no arquivo .env!\n");
    console.error("Por favor, adicione as seguintes variáveis no seu frontend/.env:\n");
    console.error("  FTP_HOST=ftp.seudominio.com.br");
    console.error("  FTP_USER=usuario@seudominio.com.br");
    console.error("  FTP_PASSWORD=sua-senha");
    console.error("  FTP_PORT=21");
    console.error("  FTP_REMOTE_DIR=public_html");
    console.error("  FTP_SECURE=false  # ou true se a HostGator exigir FTPS/TLS\n");
    process.exit(1);
  }

  const distPath = path.resolve(process.cwd(), "dist");
  if (!fs.existsSync(distPath)) {
    console.error("\n❌ ERRO: A pasta 'dist' não existe. Execute 'npm run build' primeiro.\n");
    process.exit(1);
  }

  const client = new ftp.Client();
  client.ftp.verbose = false; // Defina como true se quiser ver os comandos FTP brutos no console

  console.log(`\n🚀 Conectando ao FTP da HostGator (${host})...`);

  try {
    await client.access({
      host,
      user,
      password,
      port,
      secure,
      secureOptions: {
        rejectUnauthorized: false, // Permite certificados auto-assinados da HostGator
      },
    });

    console.log(`✅ Conexão estabelecida com sucesso!`);

    if (remoteDir && remoteDir !== "/" && remoteDir !== ".") {
      console.log(`📁 Navegando para o diretório remoto: ${remoteDir}`);
      await client.ensureDir(remoteDir);
    } else {
      console.log(`📁 Enviando diretamente para a raiz da conta FTP`);
    }

    console.log(`📤 Enviando arquivos do build ('dist')...`);
    const startTime = Date.now();

    await client.uploadFromDir(distPath);

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 Deploy concluído com sucesso em ${elapsedSeconds}s!`);
    console.log(`🌐 O site já deve estar atualizado na HostGator.\n`);
  } catch (error) {
    console.error("\n❌ Erro durante o deploy via FTP:", error);
    process.exit(1);
  } finally {
    client.close();
  }
}

runDeploy();
