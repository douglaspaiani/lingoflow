import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const caminhoAtual = req.nextUrl.pathname;
  const tokenSessao = req.cookies.get('token')?.value;

  if (tokenSessao) {
    return NextResponse.next();
  }

  const rotaProfessorProtegida = caminhoAtual.startsWith('/teacher/');
  const urlRedirecionamento = new URL(rotaProfessorProtegida ? '/teacher' : '/login', req.url);
  return NextResponse.redirect(urlRedirecionamento);
}

export const config = {
  matcher: [
    '/app',
    '/ranking',
    '/amigos',
    '/perfil',
    '/perfil/:path*',
    '/editar-perfil',
    '/licao/:path*',
    '/jogo/:path*',
    '/teacher/dashboard',
    '/teacher/ranking',
    '/teacher/jogos/:path*'
  ]
};
