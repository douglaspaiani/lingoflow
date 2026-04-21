"use client";

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useRef, useState, ChangeEvent, PointerEvent as EventoPonteiro } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Flame,
  Target,
  Star,
  MoreHorizontal,
  User as UserIcon,
  Camera,
  UserPlus,
  UserMinus,
  Pencil,
  AlertTriangle,
  X,
  RotateCcw,
  ZoomIn,
  Move
} from 'lucide-react';
import { User, AppData } from '@/types';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';

const TAMANHO_PREVIEW_RECORTE_AVATAR = 280;
const TAMANHO_SAIDA_RECORTE_AVATAR = 512;
const ZOOM_MINIMO_RECORTE_AVATAR = 1;
const ZOOM_MAXIMO_RECORTE_AVATAR = 3;
const ROTACAO_MINIMA_RECORTE_AVATAR = -45;
const ROTACAO_MAXIMA_RECORTE_AVATAR = 45;
const LIMITE_TAMANHO_ARQUIVO_FOTO = 8 * 1024 * 1024;

type TipoFotoPerfil = 'avatar' | 'coverPhoto';

type EstadoArrasteRecorteAvatar = {
  ponteiroId: number;
  posicaoXInicial: number;
  posicaoYInicial: number;
  deslocamentoXInicial: number;
  deslocamentoYInicial: number;
};

async function lerArquivoComoBase64(arquivo: File) {
  return await new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = String(leitor.result || '');
      if (!resultado.startsWith('data:image/')) {
        reject(new Error('Formato de imagem inválido.'));
        return;
      }
      resolve(resultado);
    };
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
    leitor.readAsDataURL(arquivo);
  });
}

async function carregarImagem(base64Imagem: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
    imagem.src = base64Imagem;
  });
}

export default function PerfilAluno() {
  const { userId: idUsuarioParametro } = useParams() as { userId?: string };
  const router = useRouter();
  const {
    currentUser: usuarioSessao,
    registrarConquistasDesbloqueadas,
    refreshData: atualizarDadosGlobais
  } = useUser();

  const [usuarioPerfil, setUsuarioPerfil] = useState<User | null>(null);
  const [usuarioAtual, setUsuarioAtual] = useState<User | null>(null);
  const [exibirOpcoes, setExibirOpcoes] = useState(false);
  const [adminSemPerfil, setAdminSemPerfil] = useState(false);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [erroPerfil, setErroPerfil] = useState('');
  const [erroUploadFotoPerfil, setErroUploadFotoPerfil] = useState('');

  const [modalRecorteAvatarAberto, setModalRecorteAvatarAberto] = useState(false);
  const [avatarOriginalParaRecorte, setAvatarOriginalParaRecorte] = useState('');
  const [larguraAvatarOriginal, setLarguraAvatarOriginal] = useState(0);
  const [alturaAvatarOriginal, setAlturaAvatarOriginal] = useState(0);
  const [zoomRecorteAvatar, setZoomRecorteAvatar] = useState(1);
  const [rotacaoRecorteAvatar, setRotacaoRecorteAvatar] = useState(0);
  const [deslocamentoXRecorteAvatar, setDeslocamentoXRecorteAvatar] = useState(0);
  const [deslocamentoYRecorteAvatar, setDeslocamentoYRecorteAvatar] = useState(0);
  const [salvandoRecorteAvatar, setSalvandoRecorteAvatar] = useState(false);
  const [tipoFotoEmProcessamento, setTipoFotoEmProcessamento] = useState<TipoFotoPerfil | null>(null);

  const referenciaOpcoes = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const estadoArrasteRecorteAvatarRef = useRef<EstadoArrasteRecorteAvatar | null>(null);

  const idUsuarioSessao = usuarioSessao?.id || '';
  const idPerfilAlvo =
    (typeof idUsuarioParametro === 'string' && idUsuarioParametro)
      ? idUsuarioParametro
      : idUsuarioSessao;
  const perfilEhDoUsuarioLogado = idPerfilAlvo !== '' && idPerfilAlvo === idUsuarioSessao;

  const escalaBasePreviewRecorteAvatar = larguraAvatarOriginal > 0 && alturaAvatarOriginal > 0
    ? Math.max(
        TAMANHO_PREVIEW_RECORTE_AVATAR / larguraAvatarOriginal,
        TAMANHO_PREVIEW_RECORTE_AVATAR / alturaAvatarOriginal
      )
    : 1;

  const larguraPreviewRecorteAvatar =
    larguraAvatarOriginal * escalaBasePreviewRecorteAvatar * zoomRecorteAvatar;
  const alturaPreviewRecorteAvatar =
    alturaAvatarOriginal * escalaBasePreviewRecorteAvatar * zoomRecorteAvatar;

  useEffect(() => {
    const fecharMenuAoClicarFora = (evento: MouseEvent) => {
      if (referenciaOpcoes.current && !referenciaOpcoes.current.contains(evento.target as Node)) {
        setExibirOpcoes(false);
      }
    };

    document.addEventListener('mousedown', fecharMenuAoClicarFora);
    return () => document.removeEventListener('mousedown', fecharMenuAoClicarFora);
  }, []);

  const buscarDadosPerfil = async () => {
    if (!idPerfilAlvo || !idUsuarioSessao) {
      setUsuarioPerfil(null);
      setUsuarioAtual(null);
      setErroPerfil('Usuário inválido.');
      setCarregandoPerfil(false);
      return;
    }

    setCarregandoPerfil(true);
    setErroPerfil('');

    try {
      const resposta = await fetch('/api/data', { cache: 'no-store' });
      if (!resposta.ok) {
        throw new Error('Falha ao carregar perfil.');
      }

      const data = await resposta.json() as AppData;
      setUsuarioPerfil(data.users.find((u) => u.id === idPerfilAlvo) || null);
      setUsuarioAtual(data.users.find((u) => u.id === idUsuarioSessao) || null);
    } catch (erro) {
      console.error('Erro ao carregar perfil:', erro);
      setUsuarioPerfil(null);
      setUsuarioAtual(null);
      setErroPerfil('Não foi possível carregar os dados do perfil.');
    } finally {
      setCarregandoPerfil(false);
    }
  };

  useEffect(() => {
    if (!usuarioSessao) {
      router.replace('/login');
      return;
    }

    if ((usuarioSessao?.role || '').toUpperCase() === 'PROFESSOR') {
      router.replace('/app');
      return;
    }

    const ehAdminLogado = usuarioSessao?.role === 'ADMIN';
    if (ehAdminLogado) {
      setAdminSemPerfil(true);
      setCarregandoPerfil(false);
      return;
    }

    setAdminSemPerfil(false);
    void buscarDadosPerfil();
  }, [router, idPerfilAlvo, usuarioSessao?.role, idUsuarioSessao]);

  const fecharModalRecorteAvatar = () => {
    if (salvandoRecorteAvatar) return;

    setModalRecorteAvatarAberto(false);
    setAvatarOriginalParaRecorte('');
    setLarguraAvatarOriginal(0);
    setAlturaAvatarOriginal(0);
    setZoomRecorteAvatar(1);
    setRotacaoRecorteAvatar(0);
    setDeslocamentoXRecorteAvatar(0);
    setDeslocamentoYRecorteAvatar(0);
    estadoArrasteRecorteAvatarRef.current = null;
  };

  const abrirModalRecorteAvatar = async (base64ImagemAvatar: string) => {
    const imagem = await carregarImagem(base64ImagemAvatar);

    setAvatarOriginalParaRecorte(base64ImagemAvatar);
    setLarguraAvatarOriginal(imagem.width);
    setAlturaAvatarOriginal(imagem.height);
    setZoomRecorteAvatar(1);
    setRotacaoRecorteAvatar(0);
    setDeslocamentoXRecorteAvatar(0);
    setDeslocamentoYRecorteAvatar(0);
    setModalRecorteAvatarAberto(true);
  };

  const enviarAtualizacaoFotoPerfil = async (tipoFoto: TipoFotoPerfil, urlFoto: string) => {
    const resposta = await fetch('/api/user/update-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: tipoFoto, url: urlFoto })
    });

    if (!resposta.ok) {
      const corpoErro = await resposta.json().catch(() => null);
      throw new Error(corpoErro?.error || 'Não foi possível atualizar a foto.');
    }
  };

  const lidarCliqueFoto = (tipoFoto: TipoFotoPerfil) => {
    if (!perfilEhDoUsuarioLogado) return;

    if (tipoFoto === 'avatar') {
      avatarInputRef.current?.click();
      return;
    }

    coverInputRef.current?.click();
  };

  const lidarMudancaArquivoFoto = async (
    evento: ChangeEvent<HTMLInputElement>,
    tipoFoto: TipoFotoPerfil
  ) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';

    if (!arquivo || !perfilEhDoUsuarioLogado) return;

    if (!arquivo.type.startsWith('image/')) {
      setErroUploadFotoPerfil('Selecione apenas arquivos de imagem.');
      return;
    }

    if (arquivo.size > LIMITE_TAMANHO_ARQUIVO_FOTO) {
      setErroUploadFotoPerfil('Use uma imagem de até 8MB para manter o upload rápido.');
      return;
    }

    setErroUploadFotoPerfil('');
    setTipoFotoEmProcessamento(tipoFoto);

    try {
      const fotoBase64 = await lerArquivoComoBase64(arquivo);

      if (tipoFoto === 'avatar') {
        await abrirModalRecorteAvatar(fotoBase64);
        return;
      }

      await enviarAtualizacaoFotoPerfil(tipoFoto, fotoBase64);
      await buscarDadosPerfil();
      await atualizarDadosGlobais();
    } catch (erro) {
      console.error(erro);
      const mensagem = erro instanceof Error ? erro.message : 'Não foi possível processar a imagem.';
      setErroUploadFotoPerfil(mensagem);
    } finally {
      setTipoFotoEmProcessamento(null);
    }
  };

  const iniciarArrasteRecorteAvatar = (evento: EventoPonteiro<HTMLDivElement>) => {
    if (salvandoRecorteAvatar || !avatarOriginalParaRecorte) return;

    evento.currentTarget.setPointerCapture(evento.pointerId);
    estadoArrasteRecorteAvatarRef.current = {
      ponteiroId: evento.pointerId,
      posicaoXInicial: evento.clientX,
      posicaoYInicial: evento.clientY,
      deslocamentoXInicial: deslocamentoXRecorteAvatar,
      deslocamentoYInicial: deslocamentoYRecorteAvatar
    };
  };

  const movimentarArrasteRecorteAvatar = (evento: EventoPonteiro<HTMLDivElement>) => {
    const estadoArrasteAtual = estadoArrasteRecorteAvatarRef.current;
    if (!estadoArrasteAtual || estadoArrasteAtual.ponteiroId !== evento.pointerId) return;

    const deltaX = evento.clientX - estadoArrasteAtual.posicaoXInicial;
    const deltaY = evento.clientY - estadoArrasteAtual.posicaoYInicial;

    setDeslocamentoXRecorteAvatar(estadoArrasteAtual.deslocamentoXInicial + deltaX);
    setDeslocamentoYRecorteAvatar(estadoArrasteAtual.deslocamentoYInicial + deltaY);
  };

  const finalizarArrasteRecorteAvatar = (evento: EventoPonteiro<HTMLDivElement>) => {
    const estadoArrasteAtual = estadoArrasteRecorteAvatarRef.current;
    if (!estadoArrasteAtual || estadoArrasteAtual.ponteiroId !== evento.pointerId) return;

    try {
      evento.currentTarget.releasePointerCapture(evento.pointerId);
    } catch {
      // Ignora erro de release quando o ponteiro já foi liberado pelo navegador.
    }

    estadoArrasteRecorteAvatarRef.current = null;
  };

  const resetarPosicaoRecorteAvatar = () => {
    setDeslocamentoXRecorteAvatar(0);
    setDeslocamentoYRecorteAvatar(0);
    setZoomRecorteAvatar(1);
    setRotacaoRecorteAvatar(0);
  };

  const salvarFotoRecortada = async () => {
    if (!avatarOriginalParaRecorte || larguraAvatarOriginal <= 0 || alturaAvatarOriginal <= 0) return;

    setSalvandoRecorteAvatar(true);
    setErroUploadFotoPerfil('');

    try {
      const imagem = await carregarImagem(avatarOriginalParaRecorte);
      const canvas = document.createElement('canvas');
      canvas.width = TAMANHO_SAIDA_RECORTE_AVATAR;
      canvas.height = TAMANHO_SAIDA_RECORTE_AVATAR;

      const contexto = canvas.getContext('2d');
      if (!contexto) {
        throw new Error('Não foi possível preparar o recorte da foto.');
      }

      // Converte exatamente o enquadramento do preview para a saída final em alta resolução.
      const fatorEscalaPreviewParaSaida = TAMANHO_SAIDA_RECORTE_AVATAR / TAMANHO_PREVIEW_RECORTE_AVATAR;
      const escalaBaseSaida = Math.max(
        TAMANHO_SAIDA_RECORTE_AVATAR / imagem.width,
        TAMANHO_SAIDA_RECORTE_AVATAR / imagem.height
      );
      const escalaFinalSaida = escalaBaseSaida * zoomRecorteAvatar;
      const deslocamentoXSaida = deslocamentoXRecorteAvatar * fatorEscalaPreviewParaSaida;
      const deslocamentoYSaida = deslocamentoYRecorteAvatar * fatorEscalaPreviewParaSaida;

      contexto.clearRect(0, 0, TAMANHO_SAIDA_RECORTE_AVATAR, TAMANHO_SAIDA_RECORTE_AVATAR);
      contexto.save();
      contexto.translate(
        TAMANHO_SAIDA_RECORTE_AVATAR / 2 + deslocamentoXSaida,
        TAMANHO_SAIDA_RECORTE_AVATAR / 2 + deslocamentoYSaida
      );
      contexto.rotate((rotacaoRecorteAvatar * Math.PI) / 180);
      contexto.drawImage(
        imagem,
        -(imagem.width * escalaFinalSaida) / 2,
        -(imagem.height * escalaFinalSaida) / 2,
        imagem.width * escalaFinalSaida,
        imagem.height * escalaFinalSaida
      );
      contexto.restore();

      const avatarRecortado = canvas.toDataURL('image/webp', 0.92);
      await enviarAtualizacaoFotoPerfil('avatar', avatarRecortado);
      fecharModalRecorteAvatar();
      await buscarDadosPerfil();
      await atualizarDadosGlobais();
    } catch (erro) {
      console.error(erro);
      const mensagem = erro instanceof Error ? erro.message : 'Não foi possível salvar sua foto de perfil.';
      setErroUploadFotoPerfil(mensagem);
    } finally {
      setSalvandoRecorteAvatar(false);
      setTipoFotoEmProcessamento(null);
    }
  };

  const alternarSeguimentoPerfil = async () => {
    if (adminSemPerfil) return;

    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: idUsuarioSessao, targetId: idPerfilAlvo })
      });

      if (res.ok) {
        const corpoResposta = await res.json().catch(() => null);
        if (Array.isArray(corpoResposta?.novasConquistasDesbloqueadas)) {
          registrarConquistasDesbloqueadas(corpoResposta.novasConquistasDesbloqueadas);
        }
        void buscarDadosPerfil();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const abrirTelaConexoes = (aba: 'seguindo' | 'seguidores') => {
    if (!idPerfilAlvo) return;
    router.push(`/perfil/${idPerfilAlvo}/conexoes?aba=${aba}`);
  };

  if (adminSemPerfil) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-16"
      >
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 text-center shadow-sm">
            <div className="h-20 w-20 rounded-3xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mb-3">
              Perfil indisponível para administrador
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">
              Esta área social não está disponível no modo administrador. Seguir usuários também está desativado.
            </p>
            <button
              onClick={() => router.push('/app')}
              className="bg-blue-500 hover:bg-blue-400 text-white font-black py-4 px-8 rounded-2xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-sm"
            >
              Voltar ao App
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (carregandoPerfil) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-bold text-slate-400">Carregando Perfil...</span>
      </div>
    );
  }

  if (!usuarioPerfil) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 px-6 text-center">
        <span className="font-bold text-slate-400">{erroPerfil || 'Perfil não encontrado.'}</span>
        <button
          onClick={() => router.push('/app')}
          className="bg-blue-500 hover:bg-blue-400 text-white font-black py-3 px-6 rounded-2xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-xs"
        >
          Voltar ao app
        </button>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="pb-8"
      >
        <input
          type="file"
          ref={avatarInputRef}
          className="hidden"
          accept="image/*"
          onChange={(evento) => lidarMudancaArquivoFoto(evento, 'avatar')}
        />
        <input
          type="file"
          ref={coverInputRef}
          className="hidden"
          accept="image/*"
          onChange={(evento) => lidarMudancaArquivoFoto(evento, 'coverPhoto')}
        />

        <div className="relative pt-12 pb-8 flex flex-col items-center">
          <div className="absolute top-4 right-4" ref={referenciaOpcoes}>
            {perfilEhDoUsuarioLogado ? (
              <div className="relative">
                <button
                  onClick={() => setExibirOpcoes(!exibirOpcoes)}
                  className="h-12 w-12 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                  title="Opções"
                >
                  <MoreHorizontal className="h-6 w-6" />
                </button>

                <AnimatePresence>
                  {exibirOpcoes && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute right-0 top-14 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-100 dark:border-slate-800 py-2 z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setExibirOpcoes(false);
                          router.push('/editar-perfil');
                        }}
                        className="w-full px-4 py-3 text-left font-black text-xs uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                      >
                        <Pencil className="h-4 w-4 text-blue-500" />
                        Editar Perfil
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={alternarSeguimentoPerfil}
                className={cn(
                  'px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg',
                  usuarioAtual?.following?.includes(usuarioPerfil.id)
                    ? 'bg-slate-100 dark:bg-slate-800 border-b-4 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    : 'bg-blue-500 text-white border-b-4 border-blue-700 hover:bg-blue-400'
                )}
              >
                {usuarioAtual?.following?.includes(usuarioPerfil.id) ? (
                  <UserMinus className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {usuarioAtual?.following?.includes(usuarioPerfil.id) ? 'Seguindo' : 'Seguir'}
              </button>
            )}
          </div>

          <div
            onClick={() => lidarCliqueFoto('avatar')}
            className={cn(
              'h-40 w-40 rounded-[3rem] border-4 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xl relative mb-6',
              perfilEhDoUsuarioLogado && 'cursor-pointer group'
            )}
          >
            <img
              src={usuarioPerfil.avatar || `https://picsum.photos/seed/${usuarioPerfil.id}/200`}
              alt={usuarioPerfil.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {perfilEhDoUsuarioLogado && (
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {tipoFotoEmProcessamento === 'avatar' ? (
                  <div className="h-9 w-9 border-4 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="h-10 w-10 text-white" />
                )}
              </div>
            )}
          </div>

          {erroUploadFotoPerfil && perfilEhDoUsuarioLogado && (
            <div className="mb-4 max-w-md px-4 py-3 rounded-2xl border-2 border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold text-center">
              {erroUploadFotoPerfil}
            </div>
          )}

          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
              {usuarioPerfil.name}
              {usuarioPerfil.level > 3 && <Target className="h-6 w-6 text-blue-500 fill-blue-500" />}
            </h1>
            <p className="text-blue-500 font-black text-lg">@{usuarioPerfil.username || usuarioPerfil.name.toLowerCase()}</p>

            <div className="flex justify-center gap-6 mt-4">
              <button
                onClick={() => abrirTelaConexoes('seguindo')}
                className="flex flex-col items-center hover:opacity-80 transition-opacity"
              >
                <span className="text-xl font-black text-slate-800 dark:text-slate-100">{(usuarioPerfil.following || []).length}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seguindo</span>
              </button>
              <button
                onClick={() => abrirTelaConexoes('seguidores')}
                className="flex flex-col items-center hover:opacity-80 transition-opacity"
              >
                <span className="text-xl font-black text-slate-800 dark:text-slate-100">{(usuarioPerfil.followers || []).length}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seguidores</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-400" />
              <span className="text-slate-500 font-bold">Entrou em Abril de 2026</span>
            </div>
            <div className="flex items-center -space-x-3">
              {[1, 2, 3].map((indice) => (
                <div
                  key={indice}
                  className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 overflow-hidden"
                >
                  <img src={`https://picsum.photos/seed/friend${indice}/50`} alt="" referrerPolicy="no-referrer" />
                </div>
              ))}
              <div className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                +12
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-2 shadow-sm">
              <Flame className="h-8 w-8 text-orange-500 fill-orange-500 mb-1" />
              <span className="text-xl font-black text-slate-800 dark:text-slate-100">{usuarioPerfil.streak}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ofensiva</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-2 shadow-sm">
              <Star className="h-8 w-8 text-blue-400 fill-blue-400 mb-1" />
              <span className="text-xl font-black text-slate-800 dark:text-slate-100">{usuarioPerfil.points}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total XP</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-2 shadow-sm">
              <Target className="h-8 w-8 text-yellow-400 fill-yellow-400 mb-1" />
              <span className="text-xl font-black text-slate-800 dark:text-slate-100">{usuarioPerfil.level}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-2 shadow-sm">
              <UserIcon className="h-8 w-8 text-green-500 mb-1" />
              <span className="text-xl font-black text-slate-800 dark:text-slate-100">Top 3</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ranking</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 mb-4 px-2">Conquistas Recentes</h2>
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
            {[
              {
                icon: Star,
                color: 'text-yellow-400',
                title: 'Colecionador de XP',
                desc: 'Acumulou mais de 1000 pontos',
                progress: 100
              },
              {
                icon: Flame,
                color: 'text-orange-500',
                title: 'Fogo nos Olhos',
                desc: 'Manteve 5 dias de ofensiva',
                progress: 100
              },
              {
                icon: Target,
                color: 'text-blue-500',
                title: 'Atirador de Elite',
                desc: 'Concluiu 10 lições perfeitas',
                progress: 60
              }
            ].map((desafio, indice) => (
              <div key={indice} className="flex items-center gap-6">
                <div
                  className={cn(
                    'h-16 w-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-inner',
                    desafio.color
                  )}
                >
                  <desafio.icon className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-slate-100">{desafio.title}</h4>
                      <p className="text-sm font-bold text-slate-400">{desafio.desc}</p>
                    </div>
                    <span className="text-xs font-black text-slate-500">{desafio.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${desafio.progress}%` }}
                      className={cn('h-full rounded-full', desafio.color.replace('text', 'bg'))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {modalRecorteAvatarAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm px-4 py-6 md:py-10 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-2xl p-6 md:p-8"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Ajustar foto de perfil</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                    Arraste para posicionar, ajuste o zoom e finalize com uma foto bem enquadrada.
                  </p>
                </div>
                <button
                  onClick={fecharModalRecorteAvatar}
                  disabled={salvandoRecorteAvatar}
                  className="h-11 w-11 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_310px] items-start">
                <div className="space-y-4">
                  <div className="rounded-[2rem] bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 p-4 md:p-6 border border-white/60 dark:border-slate-600/40">
                    <div
                      className="relative mx-auto rounded-[2.4rem] overflow-hidden border-4 border-white/80 dark:border-slate-500/60 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.55)] bg-slate-950 touch-none cursor-grab active:cursor-grabbing"
                      style={{
                        width: TAMANHO_PREVIEW_RECORTE_AVATAR,
                        height: TAMANHO_PREVIEW_RECORTE_AVATAR
                      }}
                      onPointerDown={iniciarArrasteRecorteAvatar}
                      onPointerMove={movimentarArrasteRecorteAvatar}
                      onPointerUp={finalizarArrasteRecorteAvatar}
                      onPointerCancel={finalizarArrasteRecorteAvatar}
                    >
                      {avatarOriginalParaRecorte && (
                        <img
                          src={avatarOriginalParaRecorte}
                          alt="Pré-visualização do recorte do avatar"
                          className="absolute left-1/2 top-1/2 select-none pointer-events-none"
                          draggable={false}
                          style={{
                            width: `${larguraPreviewRecorteAvatar}px`,
                            height: `${alturaPreviewRecorteAvatar}px`,
                            transform: `translate(-50%, -50%) translate(${deslocamentoXRecorteAvatar}px, ${deslocamentoYRecorteAvatar}px) rotate(${rotacaoRecorteAvatar}deg)`
                          }}
                        />
                      )}
                      <div className="pointer-events-none absolute inset-0 rounded-full border-[3px] border-white/95 shadow-[0_0_0_9999px_rgba(15,23,42,0.5)]" />
                      <div className="pointer-events-none absolute inset-5 rounded-full border border-white/30" />
                    </div>
                  </div>

                  <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-2">
                    <Move className="h-4 w-4" />
                    Arraste a imagem para ajustar o enquadramento dentro do círculo.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <ZoomIn className="h-4 w-4" /> Zoom
                    </label>
                    <input
                      type="range"
                      min={ZOOM_MINIMO_RECORTE_AVATAR}
                      max={ZOOM_MAXIMO_RECORTE_AVATAR}
                      step={0.01}
                      value={zoomRecorteAvatar}
                      onChange={(evento) => setZoomRecorteAvatar(Number(evento.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {Math.round(zoomRecorteAvatar * 100)}%
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" /> Rotação
                    </label>
                    <input
                      type="range"
                      min={ROTACAO_MINIMA_RECORTE_AVATAR}
                      max={ROTACAO_MAXIMA_RECORTE_AVATAR}
                      step={1}
                      value={rotacaoRecorteAvatar}
                      onChange={(evento) => setRotacaoRecorteAvatar(Number(evento.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {rotacaoRecorteAvatar > 0 ? `+${rotacaoRecorteAvatar}` : rotacaoRecorteAvatar}°
                    </p>
                  </div>

                  <button
                    onClick={resetarPosicaoRecorteAvatar}
                    disabled={salvandoRecorteAvatar}
                    className="w-full py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    Resetar ajuste
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  onClick={fecharModalRecorteAvatar}
                  disabled={salvandoRecorteAvatar}
                  className="px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarFotoRecortada}
                  disabled={salvandoRecorteAvatar}
                  className="px-6 py-3 rounded-2xl bg-blue-500 text-white border-b-4 border-blue-700 hover:bg-blue-400 transition-all active:border-b-0 active:translate-y-1 font-black text-xs uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {salvandoRecorteAvatar ? 'Salvando foto...' : 'Salvar foto'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
