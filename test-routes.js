// Test se as rotas estão funcionando
const routes = [
  'http://localhost:3000/requisicoes',
  'http://localhost:3000/requisicoes/nova',
];

async function testRoute(url) {
  try {
    const response = await fetch(url);
    console.log(`${response.status} - ${url}`);
    return response.status;
  } catch (error) {
    console.log(`ERROR - ${url}: ${error.message}`);
    return null;
  }
}

async function run() {
  console.log('🔍 Testando rotas...\n');

  for (const route of routes) {
    await testRoute(route);
  }

  // Testar com um ID fictício
  await testRoute('http://localhost:3000/requisicoes/123e4567-e89b-12d3-a456-426614174000');
}

run();
