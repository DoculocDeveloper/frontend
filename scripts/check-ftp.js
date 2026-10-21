import * as ftp from "basic-ftp";
import "dotenv/config";

async function checkFtp() {
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
    console.log("Conectado ao FTP.");
    const list = await client.list();
    console.log("Arquivos na raiz:", list.map(f => `${f.name} (${f.size} bytes)`));

    try {
      await client.cd("assets");
      const assets = await client.list();
      console.log(`Encontrados ${assets.length} arquivos na pasta assets.`);
      let totalSize = 0;
      assets.forEach(a => totalSize += a.size);
      console.log(`Tamanho total da pasta assets: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    } catch (e) {
      console.log("Não conseguiu acessar pasta assets:", e.message);
    }
  } catch (err) {
    console.error("Erro no FTP:", err);
  } finally {
    client.close();
  }
}

checkFtp();
