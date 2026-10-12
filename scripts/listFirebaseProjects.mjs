import fs from 'fs';
import path from 'path';
import os from 'os';

async function main() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    console.log('Arquivo de config não encontrado:', configPath);
    return;
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const refreshToken = config.tokens?.refresh_token;
  if (!refreshToken) {
    console.log('Sem refresh token');
    return;
  }

  // Obter novo access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: '', // firebase-tools uses installed app flow or basic
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  
  const tokenData = await tokenRes.json();
  let accessToken = tokenData.access_token || config.tokens?.access_token;
  console.log('Token obtido:', accessToken ? 'Sim' : 'Não');

  // Listar projetos Firebase
  const projectsRes = await fetch('https://firebase.googleapis.com/v1beta1/projects?pageSize=100', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!projectsRes.ok) {
    console.log('Erro ao listar projetos:', projectsRes.status, await projectsRes.text());
    return;
  }

  const projectsData = await projectsRes.json();
  console.log('Projetos encontrados:');
  const list = projectsData.results || [];
  list.forEach(p => {
    console.log(`- ${p.projectId} (${p.displayName})`);
  });
}

main().catch(console.error);
