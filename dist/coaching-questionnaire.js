export const coachingQuestionnaire = [
  { key:'contexte', title:'Votre contexte', eyebrow:'01 — FAIRE CONNAISSANCE', intro:'Quelques repères utiles pour comprendre votre quotidien.', questions:[
    {key:'birth_date',label:'Date de naissance',type:'date',required:true},
    {key:'country',label:'Pays de résidence',type:'text',required:true,placeholder:'France'},
    {key:'life_situation',label:'Situation actuelle',type:'choice',required:true,options:['Études','Salariat','Indépendant','Recherche d’emploi','Retraite','Autre']},
    {key:'work_details',label:'Que faites-vous actuellement ?',type:'textarea',placeholder:'Métier, études, rythme général…'},
    {key:'schedule',label:'Vos horaires sont-ils réguliers ?',type:'choice',required:true,options:['Oui','Variables','Travail de nuit','Travail posté','Sans horaires fixes']},
    {key:'home',label:'Composition du foyer',type:'choice',options:['Seul·e','En couple','Avec enfant(s)','Famille ou colocation','Autre']},
    {key:'environment',label:'Votre environnement de vie',type:'multiselect',options:['Urbain','Périurbain','Rural','Calme','Bruyant','Accès facile à la nature','Peu d’espace extérieur']}
  ]},
  { key:'objectifs', title:'Vos objectifs', eyebrow:'02 — DONNER UNE DIRECTION', intro:'Le coach part de ce qui compte réellement pour vous.', questions:[
    {key:'main_goal_category',label:'Domaine prioritaire',type:'choice',required:true,options:['Physique','Alimentation','Énergie','Sommeil','Organisation','Performance','Environnement','Autonomie','Habitudes','Autre']},
    {key:'main_goal',label:'Décrivez votre objectif principal avec vos propres mots',type:'textarea',required:true,maxlength:800},
    {key:'secondary_goals',label:'Objectifs secondaires',type:'multiselect',options:['Mieux manger','Bouger davantage','Gagner en force','Mieux dormir','Réduire la fatigue','Mieux m’organiser','Retrouver de la constance','Apprendre','Autre']},
    {key:'priority_1',label:'Priorité n°1',type:'text',required:true},{key:'priority_2',label:'Priorité n°2',type:'text'},{key:'priority_3',label:'Priorité n°3',type:'text'},
    {key:'time_horizon',label:'Horizon envisagé',type:'choice',required:true,options:['Moins de 1 mois','1–3 mois','3–6 mois','6–12 mois','Long terme']},
    {key:'success_definition',label:'À quoi reconnaîtrez-vous que vous avez progressé ?',type:'textarea'}
  ]},
  { key:'nourrir', title:'Nourrir', eyebrow:'03 — ALIMENTATION & HYDRATATION', intro:'Vos habitudes actuelles, sans jugement ni modèle imposé.', questions:[
    {key:'meals_count',label:'Nombre habituel de repas',type:'choice',options:['1','2','3','4 ou plus','Variable']},
    {key:'meal_regular',label:'Horaires des repas',type:'choice',options:['Réguliers','Plutôt réguliers','Variables','Très imprévisibles']},
    {key:'food_habits',label:'Situations fréquentes',type:'multiselect',options:['Grignotage','Repas à l’extérieur','Livraison','Cuisine maison','Repas préparés à l’avance','Repas improvisés','Repas sociaux fréquents']},
    {key:'hunger_satiety',label:'Repérez-vous facilement faim et satiété ?',type:'scale',min:1,max:10,low:'Difficilement',high:'Très facilement'},
    {key:'food_constraints',label:'Contraintes alimentaires utiles à connaître',type:'textarea',optional:true,help:'Allergies déclarées, choix personnels, contraintes culturelles. Vous pouvez passer cette question.'},
    {key:'food_preferences',label:'Aliments appréciés ou détestés',type:'textarea'},
    {key:'cooking_level',label:'Aisance en cuisine',type:'choice',options:['Je ne cuisine pas','Débutant','À l’aise','Très à l’aise']},
    {key:'food_organization',label:'Organisation disponible',type:'multiselect',options:['Courses planifiées','Budget contraint','Moins de 20 min par repas','Cuisine équipée','Batch cooking possible','Peu d’équipement']},
    {key:'hydration',label:'Eau consommée par jour',type:'choice',options:['Moins de 0,5 L','0,5–1 L','1–1,5 L','1,5–2 L','Plus de 2 L','Je ne sais pas']},
    {key:'drinks',label:'Boissons habituelles',type:'multiselect',options:['Eau','Café','Thé','Boissons sucrées','Boissons énergisantes','Alcool','Autre']},
    {key:'nutrition_change',label:'Qu’aimeriez-vous réellement améliorer ici ?',type:'textarea'}
  ]},
  { key:'corps', title:'Corps & mouvement', eyebrow:'04 — BOUGER AVEC JUSTESSE', intro:'Votre pratique, vos contraintes et votre récupération.', questions:[
    {key:'active_now',label:'Pratiquez-vous une activité physique ?',type:'choice',required:true,options:['Oui','Non']},
    {key:'inactive_reason',label:'Qu’est-ce qui vous freine ?',type:'multiselect',options:['Manque de temps','Motivation','Douleur','Je ne sais pas quoi faire','Accès ou budget','Autre'],showIf:{key:'active_now',equals:'Non'}},
    {key:'activity_types',label:'Types de pratique',type:'multiselect',options:['Musculation','Course','Sport collectif','Marche','Mobilité','Vélo','Natation','Autre'],showIf:{key:'active_now',equals:'Oui'}},
    {key:'activity_frequency',label:'Fréquence hebdomadaire',type:'choice',options:['1 fois','2 fois','3 fois','4 fois','5 fois ou plus'],showIf:{key:'active_now',equals:'Oui'}},
    {key:'strength_experience',label:'Expérience en musculation',type:'choice',options:['Moins de 6 mois','6–18 mois','2–4 ans','5 ans ou plus'],showIf:{key:'activity_types',includes:'Musculation'}},
    {key:'strength_program',label:'Programme et exercices principaux',type:'textarea',showIf:{key:'activity_types',includes:'Musculation'}},
    {key:'movement_level',label:'Niveau perçu',type:'scale',min:1,max:10,low:'Très débutant',high:'Très expérimenté',showIf:{key:'active_now',equals:'Oui'}},
    {key:'daily_walk',label:'Marche quotidienne approximative',type:'choice',options:['Moins de 3 000 pas','3 000–6 000','6 000–10 000','Plus de 10 000','Je ne sais pas']},
    {key:'pain_present',label:'Une douleur ou blessure déclarée limite-t-elle votre activité ?',type:'choice',options:['Oui','Non','Je préfère ne pas répondre']},
    {key:'pain_details',label:'Zone, ancienneté et activités concernées',type:'textarea',optional:true,help:'Cette information sert uniquement à adapter les échanges et ne constitue pas un diagnostic.',showIf:{key:'pain_present',equals:'Oui'}},
    {key:'professional_followup',label:'Êtes-vous déjà accompagné par un professionnel pour cela ?',type:'choice',options:['Oui','Non','Pas actuellement'],showIf:{key:'pain_present',equals:'Oui'}},
    {key:'recovery_quality',label:'Qualité de récupération',type:'scale',min:1,max:10,low:'Insuffisante',high:'Excellente'}
  ]},
  { key:'sommeil', title:'Sommeil & récupération', eyebrow:'05 — RETROUVER DU RYTHME', intro:'Une perception simple de votre récupération actuelle.', questions:[
    {key:'sleep_duration',label:'Durée moyenne',type:'choice',options:['Moins de 5 h','5–6 h','6–7 h','7–8 h','8–9 h','Plus de 9 h']},
    {key:'sleep_schedule',label:'Régularité des horaires',type:'scale',min:1,max:10,low:'Très variables',high:'Très réguliers'},
    {key:'sleep_difficulties',label:'Difficultés rencontrées',type:'multiselect',options:['Endormissement','Réveils nocturnes','Réveil trop tôt','Réveil difficile','Somnolence en journée','Aucune']},
    {key:'screen_evening',label:'Écrans dans l’heure avant le coucher',type:'choice',options:['Jamais','Parfois','Souvent','Tous les soirs']},
    {key:'sleep_quality',label:'Qualité perçue',type:'scale',min:1,max:10,low:'Très faible',high:'Très bonne'},
    {key:'fatigue',label:'Fatigue ressentie actuellement',type:'scale',min:1,max:10,low:'Très faible',high:'Très forte'},
    {key:'sleep_change',label:'Quel changement aurait le plus d’impact ?',type:'textarea'}
  ]},
  { key:'proteger', title:'Protéger', eyebrow:'06 — ENVIRONNEMENT & RÉSILIENCE', intro:'Quelques dimensions pratiques de votre environnement.', questions:[
    {key:'home_exposures',label:'Sujets que vous souhaitez explorer',type:'multiselect',options:['Qualité de l’air','Produits ménagers','Cosmétiques','Matériaux','Pollution','Sécurité du domicile','Préparation aux imprévus','Aucun actuellement']},
    {key:'home_control',label:'Maîtrise perçue de votre environnement',type:'scale',min:1,max:10,low:'Peu de maîtrise',high:'Bonne maîtrise'},
    {key:'safety_priorities',label:'Priorités pratiques',type:'multiselect',options:['Prévention des accidents','Premiers réflexes','Sécurité personnelle','Protection des proches','Continuité familiale','Trousse essentielle']},
    {key:'protect_context',label:'Une contrainte particulière à prendre en compte ?',type:'textarea',optional:true}
  ]},
  { key:'construire', title:'Vivre & construire', eyebrow:'07 — TEMPS, TRAVAIL & RESSOURCES', intro:'Comment votre organisation soutient ou freine votre projet.', questions:[
    {key:'organization',label:'Organisation quotidienne',type:'scale',min:1,max:10,low:'Subie',high:'Maîtrisée'},
    {key:'time_pressure',label:'Charge temporelle perçue',type:'scale',min:1,max:10,low:'Faible',high:'Très forte'},
    {key:'mental_load',label:'Charge mentale perçue',type:'scale',min:1,max:10,low:'Faible',high:'Très forte'},
    {key:'organization_issues',label:'Difficultés principales',type:'multiselect',options:['Priorités','Procrastination','Distractions','Horaires','Trop de projets','Manque de routines','Entourage','Budget']},
    {key:'current_projects',label:'Projets importants du moment',type:'textarea'},
    {key:'relationships_support',label:'Votre entourage soutient-il votre démarche ?',type:'choice',options:['Oui','Plutôt oui','Neutre','Plutôt non','Non']},
    {key:'resources_context',label:'Une contrainte financière utile au plan ?',type:'textarea',optional:true,help:'Ne communiquez aucun identifiant bancaire ni donnée inutile.'}
  ]},
  { key:'se_construire', title:'Se construire', eyebrow:'08 — AUTONOMIE & SENS', intro:'Ce qui donne de la cohérence au changement recherché.', questions:[
    {key:'values',label:'Trois valeurs importantes pour vous',type:'text',required:true},
    {key:'long_term_vision',label:'À quoi aimeriez-vous que votre quotidien ressemble dans trois ans ?',type:'textarea'},
    {key:'learning_style',label:'Vous apprenez mieux avec',type:'multiselect',options:['Lecture','Vidéo','Pratique','Échange','Schémas','Répétition']},
    {key:'autonomy_level',label:'Autonomie perçue face aux décisions',type:'scale',min:1,max:10,low:'Besoin d’un cadre fort',high:'Très autonome'},
    {key:'identity_change',label:'Quelle personne cherchez-vous à devenir ?',type:'textarea'},
    {key:'meaning',label:'Pourquoi ce changement compte-t-il maintenant ?',type:'textarea',required:true}
  ]},
  { key:'engagement', title:'Motivation & engagement', eyebrow:'09 — RENDRE LE PLAN RÉALISTE', intro:'Construire un accompagnement que vous pourrez réellement suivre.', questions:[
    {key:'change_reason',label:'Pourquoi souhaitez-vous changer maintenant ?',type:'textarea',required:true},
    {key:'past_attempts',label:'Qu’avez-vous déjà essayé ?',type:'textarea'},
    {key:'worked_before',label:'Qu’est-ce qui a déjà fonctionné ?',type:'textarea'},
    {key:'blocked_before',label:'Qu’est-ce qui vous a freiné ?',type:'textarea'},
    {key:'weekly_time',label:'Temps réellement disponible chaque semaine',type:'choice',required:true,options:['Moins de 1 h','1–2 h','2–4 h','4–7 h','7 h ou plus']},
    {key:'engagement_level',label:'Niveau d’engagement actuel',type:'scale',min:1,max:10,low:'Prudent',high:'Très engagé'},
    {key:'anticipated_difficulties',label:'Difficultés anticipées',type:'multiselect',options:['Temps','Énergie','Motivation','Organisation','Entourage','Budget','Imprévus','Perfectionnisme']}
  ]},
  { key:'preferences', title:'Votre accompagnement', eyebrow:'10 — TROUVER LE BON TON', intro:'Le coach adapte sa manière de vous accompagner.', questions:[
    {key:'coach_style',label:'Style préféré',type:'multiselect',required:true,options:['Très direct','Pédagogique','Analytique','Encourageant','Challengeant','Équilibré']},
    {key:'contact_frequency',label:'Fréquence de contact',type:'choice',required:true,options:['Faible','Modérée','Élevée']},
    {key:'communication',label:'Formats utiles',type:'multiselect',options:['Messages','Appels','Vidéos','Documents','Tâches','Combinaison']},
    {key:'feedback_style',label:'Comment souhaitez-vous recevoir un retour quand quelque chose ne fonctionne pas ?',type:'textarea',required:true},
    {key:'accountability',label:'Quel niveau de responsabilisation souhaitez-vous ?',type:'scale',min:1,max:10,low:'Très souple',high:'Très cadré'}
  ]},
  { key:'vigilance', title:'Points de vigilance', eyebrow:'11 — ADAPTER SANS DIAGNOSTIQUER', intro:'Seulement les informations utiles à un accompagnement prudent.', questions:[
    {key:'professional_constraints',label:'Un professionnel vous a-t-il donné une consigne qui concerne cet accompagnement ?',type:'choice',options:['Oui','Non','Je préfère ne pas répondre']},
    {key:'professional_constraints_details',label:'Quelle consigne devons-nous respecter ?',type:'textarea',optional:true,showIf:{key:'professional_constraints',equals:'Oui'}},
    {key:'avoid_topics',label:'Y a-t-il un sujet que vous ne souhaitez pas aborder ?',type:'textarea',optional:true},
    {key:'coach_should_know',label:'Que devrait absolument savoir votre coach ?',type:'textarea',optional:true},
    {key:'medical_notice',label:'Je comprends que STOA est éducatif et ne remplace pas un suivi médical',type:'checkbox',required:true}
  ]},
  { key:'confirmation', title:'Votre point de départ', eyebrow:'12 — RELIRE & TRANSMETTRE', intro:'Vos réponses seront accessibles uniquement à votre coach STOA et aux administrateurs autorisés.', questions:[
    {key:'final_message',label:'Un dernier message pour votre coach ?',type:'textarea',optional:true},
    {key:'accuracy_confirmed',label:'Je confirme que ces informations reflètent ma situation actuelle',type:'checkbox',required:true},
    {key:'privacy_confirmed',label:'J’accepte l’utilisation de ces réponses pour mon accompagnement individuel',type:'checkbox',required:true}
  ]}
];

export const isQuestionVisible = (question, answers = {}) => {
  if (!question.showIf) return true;
  const value = answers[question.showIf.key];
  if ('equals' in question.showIf) return value === question.showIf.equals;
  if ('includes' in question.showIf) return Array.isArray(value) && value.includes(question.showIf.includes);
  return true;
};

export const visibleQuestions = (step, answers = {}) => step.questions.filter((question) => isQuestionVisible(question, answers));

export const validateCoachingStep = (step, answers = {}) => visibleQuestions(step, answers).filter((question) => {
  if (!question.required) return false;
  const value = answers[question.key];
  return question.type === 'checkbox' ? value !== true : Array.isArray(value) ? !value.length : value === undefined || value === null || String(value).trim() === '';
});
