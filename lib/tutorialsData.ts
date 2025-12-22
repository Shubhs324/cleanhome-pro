export interface Tutorial {
  id: number;
  taskId?: number; // Lié à une tâche spécifique (optionnel)
  zone: string;
  title: string;
  youtubeUrl?: string;
  tips: string[];
  recommendedProducts: {
    name: string;
    type: string;
    why: string;
  }[];
  safetyWarnings: string[];
}

export const TUTORIALS: Tutorial[] = [
  // CUISINE
  {
    id: 1,
    taskId: 1,
    zone: 'Cuisine',
    title: 'Nettoyer le plan de travail',
    tips: [
      '🧽 Toujours nettoyer dans le sens du grain pour le bois',
      '💧 Utiliser de l\'eau chaude savonneuse en premier',
      '🦠 Désinfecter après avoir manipulé de la viande crue',
      '✨ Finir avec un chiffon microfibre sec pour éviter les traces'
    ],
    recommendedProducts: [
      { name: 'Spray désinfectant multi-surfaces', type: 'Nettoyant', why: 'Élimine 99.9% des bactéries' },
      { name: 'Microfibre antibactérienne', type: 'Accessoire', why: 'Ne raye pas les surfaces délicates' },
      { name: 'Vinaigre blanc 14°', type: 'Naturel', why: 'Écologique et économique' }
    ],
    safetyWarnings: [
      '⚠️ Ne jamais mélanger eau de javel et vinaigre (gaz toxique)',
      '⚠️ Porter des gants pour les produits concentrés',
      '⚠️ Bien aérer la pièce pendant le nettoyage'
    ]
  },
  {
    id: 2,
    taskId: 2,
    zone: 'Cuisine',
    title: 'Nettoyer le four',
    tips: [
      '🔥 Nettoyer le four tiède (pas chaud) pour plus d\'efficacité',
      '🧂 Saupoudrer de bicarbonate sur les taches tenaces',
      '⏰ Laisser agir toute la nuit pour les fours très sales',
      '💨 Utiliser la fonction pyrolyse si disponible (four se nettoie seul)'
    ],
    recommendedProducts: [
      { name: 'Décapant four sans soude caustique', type: 'Nettoyant', why: 'Moins agressif pour les mains' },
      { name: 'Grattoir à four', type: 'Accessoire', why: 'Enlève les résidus carbonisés sans rayer' },
      { name: 'Bicarbonate de soude', type: 'Naturel', why: 'Solution écologique et efficace' }
    ],
    safetyWarnings: [
      '⚠️ Débrancher le four avant nettoyage',
      '⚠️ Ne jamais nettoyer les résistances directement',
      '⚠️ Porter des gants résistants aux produits chimiques',
      '⚠️ Bien rincer pour éviter les fumées toxiques à la prochaine utilisation'
    ]
  },

  // SALLE DE BAIN
  {
    id: 3,
    taskId: 10,
    zone: 'Salle de bain',
    title: 'Détartrer les robinets',
    tips: [
      '🍋 Frotter avec un demi-citron pour les traces légères',
      '🧻 Enrouler du sopalin imbibé de vinaigre blanc autour du robinet',
      '⏰ Laisser agir 30 minutes minimum',
      '🪥 Utiliser une vieille brosse à dents pour les recoins'
    ],
    recommendedProducts: [
      { name: 'Vinaigre blanc ménager', type: 'Naturel', why: 'Anti-calcaire naturel puissant' },
      { name: 'Spray anti-calcaire', type: 'Nettoyant', why: 'Action rapide pour usage régulier' },
      { name: 'Éponge douce', type: 'Accessoire', why: 'N\'abîme pas le chromé' }
    ],
    safetyWarnings: [
      '⚠️ Ne pas utiliser de produits abrasifs sur le chromé',
      '⚠️ Tester sur une petite zone pour les robinets dorés/noirs',
      '⚠️ Bien rincer après le vinaigre'
    ]
  },
  {
    id: 4,
    taskId: 11,
    zone: 'Salle de bain',
    title: 'Nettoyer les joints de carrelage',
    tips: [
      '🧴 Préparer une pâte : bicarbonate + eau oxygénée',
      '🖌️ Appliquer avec une vieille brosse à dents',
      '⏰ Laisser agir 15 minutes',
      '💦 Frotter énergiquement puis rincer abondamment',
      '🌬️ Sécher avec un chiffon pour éviter les moisissures'
    ],
    recommendedProducts: [
      { name: 'Bicarbonate de soude', type: 'Naturel', why: 'Blanchit et désinfecte' },
      { name: 'Eau oxygénée 10 volumes', type: 'Naturel', why: 'Effet blanchissant puissant' },
      { name: 'Brosse à joints', type: 'Accessoire', why: 'Forme adaptée aux espaces étroits' }
    ],
    safetyWarnings: [
      '⚠️ Porter des gants (eau oxygénée peut irriter)',
      '⚠️ Ne pas utiliser d\'eau de javel sur joints colorés',
      '⚠️ Bien aérer la pièce'
    ]
  },

  // SALON
  {
    id: 5,
    zone: 'Salon',
    title: 'Dépoussiérer les surfaces',
    tips: [
      '🌪️ Commencer par le haut (étagères) vers le bas',
      '🧲 Utiliser un chiffon microfibre légèrement humide',
      '📺 Nettoyer les écrans avec un chiffon spécial (pas de produit)',
      '🪴 Ne pas oublier les plantes et cadres photos'
    ],
    recommendedProducts: [
      { name: 'Chiffon microfibre', type: 'Accessoire', why: 'Capture la poussière sans produit' },
      { name: 'Plumeau télescopique', type: 'Accessoire', why: 'Accès aux endroits en hauteur' },
      { name: 'Spray anti-poussière', type: 'Nettoyant', why: 'Empêche la poussière de se redéposer' }
    ],
    safetyWarnings: [
      '⚠️ Débrancher les appareils électroniques avant nettoyage',
      '⚠️ Ne jamais vaporiser de produit directement sur un écran'
    ]
  },

  // CHAMBRES
  {
    id: 6,
    zone: 'Chambres',
    title: 'Changer et laver les draps',
    tips: [
      '🔄 Changer les draps toutes les 1-2 semaines',
      '🌡️ Laver à 60°C pour éliminer acariens et bactéries',
      '☀️ Faire sécher au soleil si possible (effet désinfectant)',
      '🧺 Secouer les draps avant de les mettre dans la machine'
    ],
    recommendedProducts: [
      { name: 'Lessive hypoallergénique', type: 'Nettoyant', why: 'Respecte les peaux sensibles' },
      { name: 'Bicarbonate de soude', type: 'Naturel', why: 'Neutralise les odeurs et ravive le blanc' },
      { name: 'Huile essentielle de lavande', type: 'Naturel', why: 'Parfum frais et effet apaisant' }
    ],
    safetyWarnings: [
      '⚠️ Vérifier l\'étiquette de lavage du linge',
      '⚠️ Ne pas surcharger la machine (mauvais rinçage)'
    ]
  },

  // GÉNÉRAL
  {
    id: 7,
    zone: 'Toutes',
    title: 'Aspirateur & Serpillière',
    tips: [
      '🔄 Toujours aspirer AVANT de passer la serpillière',
      '↔️ Passer l\'aspirateur en mouvements croisés',
      '💧 Serpillière légèrement humide (pas trempée)',
      '🚪 Commencer par le fond de la pièce, finir vers la sortie',
      '🌬️ Laisser sécher avant de marcher'
    ],
    recommendedProducts: [
      { name: 'Aspirateur avec filtre HEPA', type: 'Appareil', why: 'Capture les allergènes' },
      { name: 'Microfibre lavable', type: 'Accessoire', why: 'Écologique et efficace' },
      { name: 'Nettoyant sol pH neutre', type: 'Nettoyant', why: 'Respecte tous types de sols' }
    ],
    safetyWarnings: [
      '⚠️ Ne jamais passer l\'aspirateur sur de l\'eau',
      '⚠️ Vider le sac/bac régulièrement (perte d\'aspiration)',
      '⚠️ Attention aux parquets : pas d\'eau stagnante'
    ]
  }
];

// Fonction utilitaire pour obtenir un tutoriel par tâche
export function getTutorialByTaskId(taskId: number): Tutorial | undefined {
  return TUTORIALS.find(t => t.taskId === taskId);
}

// Fonction pour obtenir les tutoriels d'une zone
export function getTutorialsByZone(zone: string): Tutorial[] {
  return TUTORIALS.filter(t => t.zone === zone || t.zone === 'Toutes');
}