import * as ftp from "basic-ftp";
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

async function cleanupFtp() {
  const host = process.env.FTP_HOST;
  const user = process.env.FTP_USER;
  const password = process.env.FTP_PASSWORD;
  const port = process.env.FTP_PORT ? Number(process.env.FTP_PORT) : 21;
  const secure = process.env.FTP_SECURE === "true";

  const client = new ftp.Client();
  client.ftp.verbose = false;
  client.ftp.timeout = 30000;
  client.prepareTransfer = ftp.enterPassiveModeIPv4;

  try {
    await client.access({ host, user, password, port, secure });
    console.log("Conectado ao FTP para limpeza...");

    // 1. Remover Arquivo.zip se existir
    try {
      await client.remove("Arquivo.zip");
      console.log("✅ Arquivo.zip removido (liberou ~4MB)!");
    } catch (e) {
      console.log("Arquivo.zip não encontrado ou não pôde ser removido.");
    }

    // 2. Remover __MACOSX se existir
    try {
      await client.removeDir("__MACOSX");
      console.log("✅ Pasta __MACOSX removida!");
    } catch (e) {
      // Ignora
    }

    // 3. Limpar assets obsoletos
    const distAssetsPath = path.resolve(process.cwd(), "dist", "assets");
    const currentAssets = fs.existsSync(distAssetsPath) ? fs.readdirSync(distAssetsPath) : [];
    console.log(`Assets atuais locais (${currentAssets.length}):`, currentAssets);

    try {
      await client.cd("assets");
      const remoteAssets = await client.list();
      let removedCount = 0;
      let freedBytes = 0;

      for (const file of remoteAssets) {
        if (!currentAssets.includes(file.name)) {
          try {
            await client.remove(file.name);
            removedCount++;
            freedBytes += file.size;
            console.log(`🗑️ Removido asset obsoleto: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
          } catch (err) {
            console.warn(`Não foi possível remover ${file.name}:`, err.message);
          }
        }
      }

      console.log(`\n🎉 Limpeza concluída: ${removedCount} arquivos obsoletos removidos!`);
      console.log(`Espaço liberado em assets: ${(freedBytes / (1024 * 1024)).toFixed(2)} MB`);
    } catch (e) {
      console.error("Erro ao limpar assets:", e);
    }
  } catch (err) {
    console.error("Erro na conexão FTP:", err);
  } finally {
    client.close();
  }
}

cleanupFtp();
