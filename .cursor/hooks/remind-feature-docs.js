const KEYWORD_PATTERN =
  /\b(plano|planejar|planejamento|feature|features|nova\s+tela|novo\s+comportamento|implementar|implementação|implementacao|refatorar|refatoração|refatoracao|endpoint|endpoints|módulo|modulo|módulos|modulos|roadmap|arquitetura|multi-?tenant|webhook|scoring|mapa\s+de\s+calor)\b/i;

const REMINDER =
  'LeadsZ: tarefa grande detectada. Ao planejar/implementar, registre a entrega em docs/features/ (copie docs/features/_TEMPLATE.md, use NNN-slug.md e atualize o índice). Consulte docs/README.md e o roadmap em docs/07-roadmap-desenvolvimento.md.';

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.on('error', reject);
    if (process.stdin.isTTY) {
      resolve('');
    }
  });
}

function allow(userMessage) {
  const payload = { continue: true };
  if (userMessage) {
    payload.user_message = userMessage;
  }
  process.stdout.write(JSON.stringify(payload));
}

async function main() {
  try {
    const input = (await readStdin()).replace(/^\uFEFF/, '').trim();
    if (!input) {
      allow();
      return;
    }

    let payload;
    try {
      payload = JSON.parse(input);
    } catch {
      allow();
      return;
    }

    const prompt = String(payload.prompt || payload.text || '');
    if (KEYWORD_PATTERN.test(prompt)) {
      allow(REMINDER);
      return;
    }

    allow();
  } catch {
    allow();
  }
}

main();
