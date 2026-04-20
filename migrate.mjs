import fs from 'fs/promises';
import path from 'path';

async function migrateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');

    // Make sure it has "use client"
    if (!content.includes('"use client"')) {
      content = '"use client";\n' + content;
    }

    // Replace React Router imports
    // Handle useNavigate and useParams
    const hasUseNavigate = content.includes('useNavigate');
    const hasUseParams = content.includes('useParams');
    const hasLink = content.includes('Link');

    // Remove react-router-dom imports completely
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]react-router-dom['"];?/g, (match, p1) => {
      return ''; // We will add next imports below
    });

    let nextNavImports = [];
    if (hasUseNavigate) nextNavImports.push('useRouter');
    if (hasUseParams) nextNavImports.push('useParams');

    if (nextNavImports.length > 0) {
      content = content.replace('"use client";\n', `"use client";\nimport { ${nextNavImports.join(', ')} } from 'next/navigation';\n`);
    }
    
    if (hasLink) {
      content = content.replace('"use client";\n', `"use client";\nimport Link from 'next/link';\n`);
    }

    // Replace usage
    content = content.replace(/const navigate = useNavigate\(\);?/g, 'const router = useRouter();');
    content = content.replace(/navigate\(/g, 'router.push(');
    
    // Fix Link to prop to href
    content = content.replace(/<Link([^>]*)to=/g, '<Link$1href=');

    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`Migrated ${filePath}`);
  } catch (error) {
    console.error(`Error migrating ${filePath}:`, error);
  }
}

async function run() {
  const files = [
    'src/app/page.tsx',
    'src/app/app/page.tsx',
    'src/app/licao/[id]/page.tsx',
    'src/app/ranking/page.tsx',
    'src/app/perfil/page.tsx',
    'src/app/perfil/[userId]/page.tsx',
    'src/app/editar-perfil/page.tsx',
    'src/app/admin/page.tsx',
    'src/app/amigos/page.tsx'
  ];

  for (const file of files) {
    await migrateFile(file);
  }
}

run();
