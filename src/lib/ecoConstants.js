export const ACTION_TYPES = {
  apagar_luzes: {
    label: "Apagar luzes ao sair",
    points: 15,
    icon: "Lightbulb",
    level: "low",
    color: "text-yellow-500",
    requiresVideo: true,
  },
  reciclagem_correta: {
    label: "Reciclagem correta",
    points: 15,
    icon: "Recycle",
    level: "low",
    color: "text-green-500",
    requiresVideo: true,
  },
  apanhar_lixo: {
    label: "Apanhar/deitar lixo no lixo",
    points: 15,
    icon: "Trash2",
    level: "low",
    color: "text-lime-500",
    requiresVideo: true,
  },
  sala_limpa: {
    label: "Sala limpa sem lixo",
    points: 15,
    icon: "Sparkles",
    level: "medium",
    color: "text-blue-500",
    requiresVideo: true,
  },
  reducao_desperdicio: {
    label: "Redução de desperdício",
    points: 15,
    icon: "TrendingDown",
    level: "medium",
    color: "text-teal-500",
    requiresVideo: true,
  },
  participacao_acoes: {
    label: "Participação em ações ecológicas",
    points: 20,
    icon: "Users",
    level: "high",
    color: "text-purple-500",
    requiresVideo: true,
  },
  iniciativas_espontaneas: {
    label: "Iniciativas ecológicas espontâneas",
    points: 25,
    icon: "Award",
    level: "high",
    color: "text-orange-500",
    requiresVideo: true,
  },
};

export const LEVEL_RULES = {
  low: { maxPoints: 15, requiresApproval: false, label: "Verificado por IA" },
  medium: { maxPoints: 15, requiresApproval: false, label: "Verificado por IA" },
  high: { maxPoints: 25, requiresApproval: false, label: "Verificado por IA" },
};

export function generateAccessCode(className) {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ECO-${className.toUpperCase()}-${num}`;
}

export function getPointsLevel(points) {
  if (points >= 1200) return { level: 5, label: "Eco-Mestre", progress: 100 };
  if (points >= 600) return { level: 4, label: "Eco-Líder", progress: (points - 600) / 600 * 100 };
  if (points >= 300) return { level: 3, label: "Eco-Defensor", progress: (points - 300) / 300 * 100 };
  if (points >= 100) return { level: 2, label: "Eco-Aprendiz", progress: (points - 100) / 200 * 100 };
  return { level: 1, label: "Eco-Iniciante", progress: (points / 100) * 100 };
}