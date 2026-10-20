do $$
declare
  v_updated integer;
begin
  create temporary table _stoa_philo_additions (
    module_title text primary key,
    addition text not null
  ) on commit drop;

  insert into _stoa_philo_additions values ('Douter pour reconstruire', $addition$
<p><b>Les sceptiques grecs parlaient d’épochè :</b> la suspension du jugement. Lorsqu’une question dépasse les preuves disponibles, ils préféraient ne pas fabriquer une certitude pour calmer leur inconfort. Ce n’est pas l’indécision permanente. C’est la discipline de savoir dire « je ne sais pas encore ».</p>

<p>Montaigne reprend ce geste avec son « Que sais-je ? ». Son ignorance n’est pas vide : elle se connaît elle-même. Elle examine ses limites et reste disponible à la contradiction. C’est aussi le sens de l’aporie chez Socrate, ce moment où une discussion honnête mène à une impasse. L’impasse n’est pas un échec ; elle montre précisément l’endroit où la pensée doit recommencer.</p>

<p>La science avance de la même manière. Galilée ne remplace pas une autorité par une autre : il oppose l’observation, la mesure et la possibilité d’être contredit aux certitudes héritées. Une pensée solide ne demande pas d’être crue plus fort. Elle accepte les conditions de sa propre réfutation.</p>

<p><u>Notions associées :</u> doute méthodique, scepticisme, épochè, aporie, falsifiabilité.</p>
<p><a href="https://fr.wikisource.org/wiki/Essais/Livre_II/Chapitre_12" target="_blank" rel="noopener noreferrer">Montaigne — Apologie de Raimond Sebond</a></p>
$addition$);

  insert into _stoa_philo_additions values ('L’homme de la nature avant celui de la société', $addition$
<p>Les Grecs opposaient déjà la <i>physis</i>, ce qui vient de la nature, au <i>nomos</i>, ce que les hommes établissent par la règle et l’habitude. Une convention peut être utile sans devenir vraie par nature. La monnaie, le prestige, les horaires ou les codes vestimentaires organisent une société ; ils ne disent rien, à eux seuls, de la valeur d’un être humain.</p>

<p>Les cyniques, et Diogène en particulier, utilisaient la provocation pour exposer cette confusion. Leur <i>autarkeia</i>, la capacité à se suffire avec peu, était une liberté : moins un homme a besoin de paraître, moins le regard collectif peut le commander. Rousseau reprendra autrement cette tension entre l’homme naturel et l’homme façonné par la comparaison sociale.</p>

<p>La formule du marquis de Sade, « l’homme de la nature avant celui de la société », pose une question utile même sans adopter toute sa philosophie : quelle part de ta conduite vient d’un besoin réel, et quelle part vient du décor social ? Revenir à la nature ne signifie pas abolir la morale. Cela signifie vérifier que la règle sert encore la vie.</p>

<p><u>Notions associées :</u> nature et convention, cynisme antique, autarcie, amour-propre social.</p>
$addition$);

  insert into _stoa_philo_additions values ('Ne dépendre de personne', $addition$
<p>Kant nomme <b>autonomie</b> la capacité de se donner à soi-même une règle que la raison peut défendre. Son contraire est l’hétéronomie : agir parce qu’une autorité, une récompense, une peur ou un désir immédiat commande. Tu peux donc être matériellement indépendant tout en restant gouverné par le regard des autres.</p>

<p>Stirner pousse plus loin la reprise de soi. Sa « propriété » ne se limite pas aux biens : elle désigne ce que l’individu cesse d’abandonner aux idées sacrées, aux rôles et aux institutions. La Boétie observe de son côté que le pouvoir d’un tyran dépend aussi de toute la chaîne de ceux qui le servent, l’imitent et tirent un avantage de son ordre. La servitude peut devenir une habitude avant de devenir une contrainte visible.</p>

<p>La liberté possède ainsi deux faces. La liberté négative protège un espace où personne ne t’empêche d’agir. La liberté positive développe ta capacité réelle à choisir : savoir penser, gagner ta vie, maîtriser tes impulsions et assumer les conséquences. La première ouvre la porte ; la seconde te rend capable de la franchir.</p>

<p><u>Notions associées :</u> autonomie, hétéronomie, individualité, servitude volontaire, liberté négative et positive.</p>
<p><a href="https://fr.wikisource.org/wiki/Discours_de_la_servitude_volontaire" target="_blank" rel="noopener noreferrer">Étienne de La Boétie — Discours de la servitude volontaire</a></p>
$addition$);

  insert into _stoa_philo_additions values ('Être bon sans devenir faible', $addition$
<p>Socrate préfère subir l’injustice plutôt que la commettre parce qu’une injustice reçue blesse une situation, tandis qu’une injustice volontaire abîme celui qui choisit de la faire. Sa priorité n’est pas de gagner chaque affrontement, mais de préserver la qualité de son âme.</p>

<p>Cette idée rencontre la distinction stoïcienne entre ce qui dépend de nous et ce qui n’en dépend pas. La conduite d’un proche ne t’appartient pas. Ta réponse, elle, t’appartient. Marc Aurèle n’invite pas à tout accepter : il rappelle que ressembler à celui que l’on condamne constitue une seconde défaite.</p>

<p>Aristote ajoute une nuance essentielle avec la vertu comme juste mesure. Le courage se tient entre la lâcheté et la témérité ; la générosité entre l’avarice et le gaspillage. La bonté possède elle aussi sa mesure. Elle n’est ni froideur ni effacement. Elle aide de la manière qui produit réellement du bien, et elle sait parfois dire non pour ne pas nourrir ce qui détruit.</p>

<p><u>Notions associées :</u> soin de l’âme, maîtrise de soi, juste milieu, vertu, intégrité morale.</p>
$addition$);

  insert into _stoa_philo_additions values ('Des alliés, pas des rivaux', $addition$
<p>Aristote décrit l’être humain comme un animal politique : il ne devient pleinement lui-même qu’au milieu des autres, par la parole, la délibération et l’action commune. L’individu isolé peut survivre un temps ; il ne transmet ni langage, ni mémoire, ni technique à lui seul.</p>

<p>Hobbes insiste sur la rivalité, la méfiance et la recherche de gloire qui peuvent opposer les hommes. Kropotkine répondra que l’entraide est elle aussi une force constante de la survie. Ces deux regards ne s’annulent pas. L’humain peut concurrencer et coopérer. La sagesse consiste à reconnaître dans quelle situation chaque mouvement apparaît, puis à construire des règles qui rendent l’alliance plus avantageuse que la trahison.</p>

<p>Une hiérarchie naturelle n’a donc rien à voir avec une valeur humaine supérieure. Elle répond à une situation : le plus compétent guide, puis rend la compétence transmissible. Dès que le chef protège sa place en gardant les autres faibles, il ne guide plus une communauté ; il fabrique sa dépendance.</p>

<p><u>Notions associées :</u> animal politique, état de nature, entraide, bien commun, autorité et domination.</p>
$addition$);

  insert into _stoa_philo_additions values ('Aimer sans tenir les comptes', $addition$
<p>Aristote distingue trois formes d’amitié. Certaines reposent sur l’utilité, d’autres sur le plaisir, et les plus accomplies sur l’estime réciproque de deux caractères qui souhaitent réellement le bien l’un de l’autre. Les deux premières ne sont pas honteuses, mais elles durent souvent aussi longtemps que leur avantage.</p>

<p>La relation profonde commence lorsque l’autre cesse d’être remplaçable par une personne qui remplirait mieux la même fonction. Martin Buber parlera d’une rencontre entre un « Je » et un « Tu », opposée au rapport « Je-Cela » dans lequel le monde devient un ensemble d’objets à utiliser. Aimer, c’est rencontrer une présence, pas gérer une ressource.</p>

<p>Cette absence de calcul ne supprime pas la réciprocité. Elle la libère du registre quotidien. Une relation peut traverser un déséquilibre sans devenir une dette, parce que chacun sait que le bien de l’autre compte pour lui-même. C’est ici que le sentiment se distingue du contrat.</p>

<p><u>Notions associées :</u> amitié d’utilité, de plaisir et de vertu, réciprocité, relation Je-Tu, personne comme fin.</p>
$addition$);

  insert into _stoa_philo_additions values ('Choisir ses liens', $addition$
<p>Spinoza juge une rencontre à ce qu’elle fait à notre puissance d’agir. Certaines relations nous rendent plus lucides, plus actifs et plus capables de tenir nos engagements. D’autres nous enferment dans la peur, la jalousie ou l’imitation. Cette lecture ne réduit pas l’autre à son utilité : elle observe la réalité produite lorsque deux manières d’être se rencontrent.</p>

<p>Les existentialistes rappelleront qu’un choix ne se limite pas à préférer une option. En choisissant un lien, tu choisis aussi la personne que tu devras devenir pour l’habiter. Vouloir une famille, une amitié fidèle ou un couple durable implique une certaine disponibilité, des renoncements et une manière d’assumer sa parole.</p>

<p>La question n’est donc pas seulement « qui me plaît ? », mais « quel monde faisons-nous apparaître ensemble ? ». Le lien mérite d’être choisi lorsque chacun peut y grandir sans devoir falsifier son caractère.</p>

<p><u>Notions associées :</u> affects, puissance d’agir, choix existentiel, compatibilité des valeurs, engagement.</p>
$addition$);

  insert into _stoa_philo_additions values ('Entretenir une relation', $addition$
<p>Simone Weil voyait dans l’attention une forme rare de générosité. Être attentif, ce n’est pas seulement rester silencieux pendant que l’autre parle. C’est suspendre quelques instants son propre récit pour recevoir ce qui est réellement dit. Beaucoup de conflits durent parce que chacun écoute uniquement la partie qu’il pourra réfuter.</p>

<p>Aristote rappelle aussi qu’une amitié se maintient par une activité partagée. Le lien n’est pas un objet acquis une fois pour toutes ; il existe dans les actes par lesquels les amis continuent à se reconnaître. Le temps donné, les rites familiaux, l’aide concrète et les conversations difficiles forment cette activité.</p>

<p>Le pardon n’efface pas automatiquement les conséquences. Il renonce à faire de la faute l’identité entière de l’autre, à condition qu’une réparation devienne possible. Sans vérité, le pardon est un déni. Sans possibilité de pardon, toute relation finit prisonnière de son pire moment.</p>

<p><u>Notions associées :</u> attention, reconnaissance, activité partagée, réparation, pardon.</p>
$addition$);

  insert into _stoa_philo_additions values ('Devenir quelqu’un de meilleur', $addition$
<p>Pour Aristote, la vertu n’est pas un talent reçu à la naissance. Elle devient une disposition par la répétition. On devient juste en accomplissant des actes justes, courageux en affrontant progressivement ce qui fait peur, fiable en tenant sa parole assez souvent pour que cela forme un caractère.</p>

<p>Socrate ajoute l’examen de soi : une vie qui ne s’interroge jamais reproduit ses habitudes sans savoir où elles mènent. Cet examen n’a rien d’une culpabilité permanente. Il sert à rapprocher les actes des principes.</p>

<p>Avicenne représente ici une autre vertu : l’humilité intellectuelle. Marcher en sandales jusqu’à ce que la sagesse procure des souliers, c’est accepter l’apprentissage avant le prestige. Celui qui veut d’abord paraître savant cesse souvent d’écouter. Celui qui cherche vraiment à comprendre peut apprendre d’un artisan, d’un enfant ou d’un adversaire.</p>

<p>Devenir meilleur demande donc une direction, des habitudes et des témoins capables de dire la vérité. Choisis des proches qui ne flattent pas tes défauts sous prétexte de t’aimer.</p>

<p><u>Notions associées :</u> éthique des vertus, habitude, examen de soi, humilité intellectuelle, formation du caractère.</p>
$addition$);

  insert into _stoa_philo_additions values ('La mécanique du désir', $addition$
<p>Épicure distingue les désirs naturels et nécessaires, les désirs naturels mais non nécessaires, puis les désirs vains. Manger lorsque l’on a faim répond au premier groupe. Chercher une table raffinée relève du second. Vouloir une gloire sans limite appartient au troisième : aucune quantité précise ne peut enfin le satisfaire.</p>

<p>Schopenhauer voit derrière chaque désir l’expression d’un vouloir qui ne connaît pas de repos. La satisfaction ne supprime pas ce mouvement ; elle lui retire seulement un objet avant qu’il n’en trouve un autre. Démocrite propose une réponse moins sombre avec l’<i>euthymia</i>, une âme stable qui ne s’élève ni ne s’effondre au rythme de chaque gain.</p>

<p>Le problème n’est donc pas de désirer, mais d’abandonner à chaque désir le pouvoir de définir l’urgence. Un désir observé devient une proposition. Un désir obéi immédiatement devient un maître.</p>

<p><u>Notions associées :</u> désirs naturels et vains, vouloir-vivre, satiété, euthymie, maîtrise du manque.</p>
<p><a href="https://fr.wikisource.org/wiki/Sur_la_tranquillit%C3%A9_de_l%E2%80%99%C3%A2me" target="_blank" rel="noopener noreferrer">Sénèque — Sur la tranquillité de l’âme, autour de l’euthymie de Démocrite</a></p>
$addition$);

  insert into _stoa_philo_additions values ('Construire une vie stable et libre', $addition$
<p>Les Anciens donnent plusieurs noms au bonheur. L’<i>hédonè</i> désigne le plaisir. L’<i>ataraxie</i> désigne l’absence de trouble. L’<i>eudaimonia</i> d’Aristote décrit une vie accomplie par l’activité et la vertu. Ces mots évitent une erreur moderne : réduire le bonheur à une émotion agréable que l’on devrait ressentir sans interruption.</p>

<p>Épicure recherche la simplicité qui retire les peurs inutiles. Démocrite cherche la mesure qui stabilise l’âme. Aristote insiste sur une vie entière, car un bon moment ne suffit pas à juger une trajectoire. Diogène ajoute l’indépendance obtenue en ayant besoin de peu.</p>

<p>Ta définition de la réussite peut emprunter à chacun : du plaisir sans dépendance, de la paix sans passivité, de l’ambition sans agitation et assez d’autonomie pour ne pas vendre toute ta vie afin de financer son apparence.</p>

<p><u>Notions associées :</u> plaisir, ataraxie, euthymie, eudaimonia, autarcie.</p>
$addition$);

  insert into _stoa_philo_additions values ('Ne pas attendre la mort', $addition$
<p>Épicure répond à la peur de la mort par un raisonnement radical : tant que nous sommes là, elle n’est pas là ; lorsqu’elle est là, nous ne sommes plus là pour la subir. Montaigne adopte une voie différente. Penser à la mort permet de retirer à l’inconnu une partie de son pouvoir et de rendre la vie plus disponible.</p>

<p>Sénèque déplace encore la question : la vie n’est pas forcément courte, mais nous en perdons une grande partie. Attendre le bon moment, vivre selon le calendrier d’un autre ou remettre sans cesse les liens importants revient à offrir son temps avant même que la mort le prenne.</p>

<p>Ces philosophes ne demandent pas d’aimer la mort. Ils cherchent à empêcher sa peur de gouverner. La conscience de la fin doit produire une hiérarchie : ce qui mérite ton temps, ce qui peut attendre et ce qui n’en méritera jamais davantage.</p>

<p><u>Notions associées :</u> finitude, peur de la mort, préparation, usage du temps, vie différée.</p>
<p><a href="https://fr.wikisource.org/wiki/De_la_bri%C3%A8vet%C3%A9_de_la_vie" target="_blank" rel="noopener noreferrer">Sénèque — De la brièveté de la vie</a></p>
$addition$);

  insert into _stoa_philo_additions values ('Vivre de manière à ne pas regretter', $addition$
<p>Nietzsche propose une épreuve mentale : si tu devais revivre cette vie, avec chaque détail, une infinité de fois, quelles décisions deviendraient insupportables ? L’éternel retour n’a pas besoin d’être pris comme une théorie physique. Il agit comme un révélateur de ce que tu acceptes par inertie.</p>

<p>Marc Aurèle ramène cette exigence au présent : ne perds plus de temps à définir l’homme bon, deviens-le. Montaigne refuse de séparer la pensée de la vie ordinaire ; sa philosophie se vérifie dans la manière de manger, d’aimer, de vieillir, de converser et de mourir.</p>

<p>Le regret utile ne sert donc pas à rejouer éternellement le passé. Il identifie une valeur trahie, puis prépare une conduite différente. Si tu regrettes une absence, rends-toi présent. Si tu regrettes une lâcheté, entraîne ton courage sur une action accessible. Si tu regrettes une parole, répare tant que quelqu’un peut encore l’entendre.</p>

<p><u>Notions associées :</u> éternel retour, cohérence, philosophie comme manière de vivre, regret réparateur, transmission.</p>
$addition$);

  update public.subchapters as section
  set content = case
    when position('<p><u>Sources :</u></p>' in section.content) > 0 then
      replace(
        section.content,
        '<p><u>Sources :</u></p>',
        addition.addition || E'\n\n<p><u>Sources :</u></p>'
      )
    else section.content || E'\n\n' || addition.addition
  end
  from public.modules as module
  join public.chapters as chapter on chapter.id = module.chapter_id
  join public.pillars as pillar on pillar.id = chapter.pillar_id
  join _stoa_philo_additions as addition on addition.module_title = module.title
  where section.module_id = module.id
    and pillar.title = 'VIVRE'
    and chapter.is_visible
    and module.is_visible;

  get diagnostics v_updated = row_count;
  if v_updated <> 13 then
    raise exception 'Enrichissement philosophique incomplet : % leçons mises à jour sur 13.', v_updated;
  end if;
end;
$$;
