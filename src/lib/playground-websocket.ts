import { WebSocketServer, WebSocket } from 'ws';

type ParticipanteSessaoWebsocket = {
  usuarioId: string;
  nome: string;
  avatar?: string;
  role: string;
};

type EstadoServidorWebsocketPlayground = {
  iniciado: boolean;
  porta: number;
  servidor: WebSocketServer | null;
  salasPorSessao: Map<string, Set<WebSocket>>;
  participantesPorSessao: Map<string, Map<WebSocket, ParticipanteSessaoWebsocket>>;
};

type EventoTempoRealPlayground = {
  tipo: string;
  dados: Record<string, unknown>;
  enviadoEm: string;
};

const CHAVE_GLOBAL_SERVIDOR_WS = '__servidor_ws_playground__';

function obterPortaWebsocketPlayground() {
  const porta = Number(process.env.PLAYGROUND_WS_PORT || 4010);
  return Number.isFinite(porta) ? porta : 4010;
}

function obterEstadoGlobal() {
  return globalThis as typeof globalThis & {
    [CHAVE_GLOBAL_SERVIDOR_WS]?: EstadoServidorWebsocketPlayground;
  };
}

function obterAlunosConectadosSessao(
  participantesDaSessao: Map<WebSocket, ParticipanteSessaoWebsocket> | undefined
) {
  if (!participantesDaSessao) return [];

  const mapaAlunosUnicos = new Map<string, { alunoId: string; nome: string; avatar: string }>();
  for (const participante of participantesDaSessao.values()) {
    if (participante.role !== 'ALUNO') continue;
    if (!participante.usuarioId) continue;

    mapaAlunosUnicos.set(participante.usuarioId, {
      alunoId: participante.usuarioId,
      nome: participante.nome || 'Aluno',
      avatar: participante.avatar || ''
    });
  }

  return [...mapaAlunosUnicos.values()];
}

function enviarAtualizacaoParticipantesSessao(
  idSessao: string,
  salaSessao: Set<WebSocket> | undefined,
  participantesDaSessao: Map<WebSocket, ParticipanteSessaoWebsocket> | undefined
) {
  if (!salaSessao || salaSessao.size === 0) return;

  const alunosConectados = obterAlunosConectadosSessao(participantesDaSessao);
  const payload: EventoTempoRealPlayground = {
    tipo: 'participantes_atualizados',
    dados: {
      sessaoId: idSessao,
      alunosConectados
    },
    enviadoEm: new Date().toISOString()
  };

  const mensagem = JSON.stringify(payload);
  for (const socket of salaSessao) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(mensagem);
    }
  }
}

export function garantirServidorWebsocketPlayground() {
  const estadoGlobal = obterEstadoGlobal();
  if (estadoGlobal[CHAVE_GLOBAL_SERVIDOR_WS]?.iniciado) {
    return estadoGlobal[CHAVE_GLOBAL_SERVIDOR_WS]!;
  }

  const porta = obterPortaWebsocketPlayground();
  const salasPorSessao = new Map<string, Set<WebSocket>>();
  const participantesPorSessao = new Map<string, Map<WebSocket, ParticipanteSessaoWebsocket>>();

  try {
    const servidor = new WebSocketServer({ port: porta });

    servidor.on('connection', (socket, requisicao) => {
      const urlConexao = new URL(requisicao.url || '/', `ws://localhost:${porta}`);
      const idSessao = urlConexao.searchParams.get('sessaoId');
      const usuarioId = (urlConexao.searchParams.get('usuarioId') || '').trim();
      const nome = (urlConexao.searchParams.get('nome') || '').trim();
      const avatar = (urlConexao.searchParams.get('avatar') || '').trim();
      const role = (urlConexao.searchParams.get('role') || '').trim().toUpperCase();

      if (!idSessao) {
        socket.close();
        return;
      }

      const sala = salasPorSessao.get(idSessao) || new Set<WebSocket>();
      sala.add(socket);
      salasPorSessao.set(idSessao, sala);

      const participantesDaSessao = participantesPorSessao.get(idSessao) || new Map<WebSocket, ParticipanteSessaoWebsocket>();
      if (usuarioId) {
        participantesDaSessao.set(socket, {
          usuarioId,
          nome: nome || 'Participante',
          avatar: avatar || '',
          role: role || 'ALUNO'
        });
      }
      participantesPorSessao.set(idSessao, participantesDaSessao);

      socket.send(
        JSON.stringify({
          tipo: 'conexao_estabelecida',
          dados: {
            sessaoId: idSessao,
            alunosConectados: obterAlunosConectadosSessao(participantesDaSessao)
          },
          enviadoEm: new Date().toISOString()
        } satisfies EventoTempoRealPlayground)
      );

      enviarAtualizacaoParticipantesSessao(idSessao, sala, participantesDaSessao);

      socket.on('close', () => {
        const salaAtual = salasPorSessao.get(idSessao);
        const participantesAtuais = participantesPorSessao.get(idSessao);

        if (participantesAtuais) {
          participantesAtuais.delete(socket);
          if (participantesAtuais.size === 0) {
            participantesPorSessao.delete(idSessao);
          } else {
            participantesPorSessao.set(idSessao, participantesAtuais);
          }
        }

        if (!salaAtual) return;

        salaAtual.delete(socket);
        if (salaAtual.size === 0) {
          salasPorSessao.delete(idSessao);
          return;
        }

        enviarAtualizacaoParticipantesSessao(idSessao, salaAtual, participantesAtuais);
      });
    });

    const estadoServidor: EstadoServidorWebsocketPlayground = {
      iniciado: true,
      porta,
      servidor,
      salasPorSessao,
      participantesPorSessao
    };

    estadoGlobal[CHAVE_GLOBAL_SERVIDOR_WS] = estadoServidor;
    return estadoServidor;
  } catch (erro: any) {
    if (erro?.code === 'EADDRINUSE') {
      const estadoServidor: EstadoServidorWebsocketPlayground = {
        iniciado: false,
        porta,
        servidor: null,
        salasPorSessao,
        participantesPorSessao
      };
      estadoGlobal[CHAVE_GLOBAL_SERVIDOR_WS] = estadoServidor;
      return estadoServidor;
    }
    throw erro;
  }
}

export function obterPortaServidorWebsocketPlayground() {
  const estado = garantirServidorWebsocketPlayground();
  return estado.porta;
}

export function enviarEventoSessaoPlayground(
  idSessao: string,
  tipo: string,
  dados: Record<string, unknown>
) {
  const estado = garantirServidorWebsocketPlayground();
  if (!estado.servidor) return;

  const sala = estado.salasPorSessao.get(idSessao);
  if (!sala || sala.size === 0) return;

  const payload: EventoTempoRealPlayground = {
    tipo,
    dados,
    enviadoEm: new Date().toISOString()
  };

  const mensagem = JSON.stringify(payload);
  for (const socket of sala) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(mensagem);
    }
  }
}
