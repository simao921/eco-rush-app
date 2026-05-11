export const ACTION_TYPES = {
  apagar_luzes: {
    label: "Apagar luzes ao sair",
    points: 5,
    icon: "Lightbulb",
    level: "low",
    color: "text-yellow-500",
    requiresVideo: true,
  },
  reciclagem_correta: {
    label: "Reciclagem correta",
    points: 5,
    icon: "Recycle",
    level: "low",
    color: "text-green-500",
    requiresVideo: true,
  },
  apanhar_lixo: {
    label: "Apanhar/deitar lixo no lixo",
    points: 5,
    icon: "Trash2",
    level: "low",
    color: "text-lime-500",
    requiresVideo: true,
  },
  sala_limpa: {
    label: "Sala limpa sem lixo",
    points: 10,
    icon: "Sparkles",
    level: "medium",
    color: "text-blue-500",
    requiresVideo: true,
  },
  reducao_desperdicio: {
    label: "Redução de desperdício",
    points: 10,
    icon: "TrendingDown",
    level: "medium",
    color: "text-teal-500",
    requiresVideo: true,
  },
  participacao_acoes: {
    label: "Participação em ações ecológicas",
    points: 15,
    icon: "Users",
    level: "high",
    color: "text-purple-500",
    requiresVideo: true,
  },
  iniciativas_espontaneas: {
    label: "Iniciativas ecológicas espontâneas",
    points: 20,
    icon: "Award",
    level: "high",
    color: "text-orange-500",
    requiresVideo: true,
  },
};

export const LEVEL_RULES = {
  low: { maxPoints: 5, requiresApproval: false, label: "Auto-aprovado" },
  medium: { maxPoints: 10, requiresApproval: false, label: "Verificado por IA" },
  high: { maxPoints: 20, requiresApproval: false, label: "Verificado por IA" },
};

export function generateAccessCode(className) {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ECO-${className.toUpperCase()}-${num}`;
}

export function getPointsLevel(points) {
  if (points >= 500) return { level: 5, label: "Eco-Mestre", progress: 100 };
  if (points >= 300) return { level: 4, label: "Eco-Líder", progress: (points - 300) / 200 * 100 };
  if (points >= 150) return { level: 3, label: "Eco-Defensor", progress: (points - 150) / 150 * 100 };
  if (points >= 50) return { level: 2, label: "Eco-Aprendiz", progress: (points - 50) / 100 * 100 };
  return { level: 1, label: "Eco-Iniciante", progress: (points / 50) * 100 };
}