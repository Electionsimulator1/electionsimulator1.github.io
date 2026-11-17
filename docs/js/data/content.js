/* Conteúdo do jogo: temas, profissões, ideologias, promessas, perguntas, eventos, equipe, projetos e nomes */
(function () {
  const K = (window.CONTENT = {});

  K.TOPICS = {
    saude: { n: 'Saúde', ic: 'HeartPulse' }, educacao: { n: 'Educação', ic: 'GraduationCap' }, seguranca: { n: 'Segurança', ic: 'Shield' },
    economia: { n: 'Emprego', ic: 'Briefcase' }, impostos: { n: 'Impostos', ic: 'Receipt' }, ambiente: { n: 'Meio ambiente', ic: 'Leaf' },
    transporte: { n: 'Transporte', ic: 'Bus' }, moradia: { n: 'Moradia', ic: 'House' }, corrupcao: { n: 'Corrupção', ic: 'Scale' }, valores: { n: 'Valores', ic: 'Church' },
  };
  K.TOPIC_IDS = Object.keys(K.TOPICS);

  // Segmentos derivados dos atributos das regiões
  K.SEGMENTS = {
    pobres: { n: 'Baixa renda', w: (z) => 1 - z.inc }, ricos: { n: 'Alta renda', w: (z) => z.inc },
    religiosos: { n: 'Religiosos', w: (z) => z.rel }, jovens: { n: 'Jovens', w: (z) => z.young * 2 },
    progressistas: { n: 'Progressistas', w: (z) => (1 - z.soc) / 2 }, conservadores: { n: 'Conservadores', w: (z) => (1 + z.soc) / 2 },
    esquerda: { n: 'Esquerda econômica', w: (z) => (1 - z.econ) / 2 }, direita: { n: 'Direita econômica', w: (z) => (1 + z.econ) / 2 },
    rurais: { n: 'Rural', w: (z) => 1 - z.urban },
  };

  K.PROFESSIONS = [
    { id: 'professor', n: 'Professor(a)', ic: 'GraduationCap', fame: 8, money: 3, attrs: { int: 10, ora: 6 }, seg: { jovens: 0.06 }, issue: { educacao: 0.25 }, d: 'Credibilidade em educação e com jovens.' },
    { id: 'empresario', n: 'Empresário(a)', ic: 'Briefcase', fame: 10, money: 14, attrs: { art: 8, int: 4 }, seg: { ricos: 0.08, direita: 0.04 }, issue: { economia: 0.25 }, d: 'Muito dinheiro próprio e trânsito no mercado.' },
    { id: 'policial', n: 'Policial / Militar', ic: 'Shield', fame: 9, money: 4, attrs: { car: 4, intg: 6 }, seg: { conservadores: 0.08 }, issue: { seguranca: 0.3 }, d: 'Forte no tema da segurança.' },
    { id: 'medico', n: 'Médico(a)', ic: 'Stethoscope', fame: 10, money: 8, attrs: { int: 8, intg: 6 }, seg: { pobres: 0.03 }, issue: { saude: 0.3 }, d: 'Confiança da população na saúde.' },
    { id: 'pastor', n: 'Líder religioso(a)', ic: 'Church', fame: 12, money: 5, attrs: { car: 10, ora: 6 }, seg: { religiosos: 0.12, progressistas: -0.04 }, issue: { valores: 0.3 }, d: 'Rede de fiéis engajados.' },
    { id: 'sindicalista', n: 'Sindicalista', ic: 'Users', fame: 10, money: 3, attrs: { art: 10, ora: 6 }, seg: { esquerda: 0.08, pobres: 0.05 }, issue: { economia: 0.2 }, d: 'Base organizada de trabalhadores.' },
    { id: 'influencer', n: 'Influenciador(a) digital', ic: 'Smartphone', fame: 26, money: 7, attrs: { car: 10, int: -4 }, seg: { jovens: 0.12 }, issue: {}, d: 'Muito conhecido, redes sociais rendem 50% mais.' },
    { id: 'advogado', n: 'Advogado(a)', ic: 'Gavel', fame: 8, money: 7, attrs: { ora: 10, int: 6 }, seg: {}, issue: { corrupcao: 0.25 }, d: 'Oratória afiada e defesa jurídica.' },
    { id: 'artista', n: 'Atleta / Artista', ic: 'Music', fame: 30, money: 9, attrs: { car: 12, int: -6 }, seg: { jovens: 0.06 }, issue: {}, d: 'Fama alta, pouca experiência.' },
    { id: 'comunitario', n: 'Líder comunitário(a)', ic: 'HandHeart', fame: 6, money: 2, attrs: { art: 8, car: 6 }, seg: { pobres: 0.1 }, issue: { moradia: 0.2 }, d: 'Muito forte nos bairros populares da sua cidade.' },
    { id: 'jornalista', n: 'Jornalista', ic: 'Newspaper', fame: 15, money: 4, attrs: { ora: 8, int: 6 }, seg: {}, issue: { corrupcao: 0.15 }, d: 'Desenvoltura na mídia (+15% em entrevistas).' },
    { id: 'agro', n: 'Produtor(a) rural', ic: 'Tractor', fame: 6, money: 10, attrs: { art: 6 }, seg: { rurais: 0.12, direita: 0.04 }, issue: { economia: 0.15 }, d: 'Força no interior e no agronegócio.' },
  ];

  K.IDEOLOGIES = [
    { id: 'socialismo', n: 'Socialismo', e: -0.85, s: -0.45 },
    { id: 'pop_esq', n: 'Populismo de esquerda', e: -0.65, s: 0.2 },
    { id: 'progressismo', n: 'Progressismo', e: -0.45, s: -0.75 },
    { id: 'trabalhismo', n: 'Trabalhismo', e: -0.55, s: 0.0 },
    { id: 'ambientalismo', n: 'Ambientalismo', e: -0.35, s: -0.55 },
    { id: 'socialdem', n: 'Social-democracia', e: -0.3, s: -0.25 },
    { id: 'centrismo', n: 'Centrismo', e: 0.0, s: 0.0 },
    { id: 'dem_crista', n: 'Democracia cristã', e: 0.15, s: 0.55 },
    { id: 'liberalismo', n: 'Liberalismo econômico', e: 0.75, s: -0.15 },
    { id: 'lib_cons', n: 'Liberal-conservadorismo', e: 0.6, s: 0.55 },
    { id: 'conservadorismo', n: 'Conservadorismo', e: 0.35, s: 0.8 },
    { id: 'nac_pop', n: 'Nacional-populismo', e: 0.2, s: 0.85 },
    { id: 'libertarianismo', n: 'Libertarianismo', e: 0.95, s: -0.4 },
  ];
  K.spectrum = (e, s) => {
    const v = e * 0.65 + s * 0.35;
    if (v < -0.45) return { id: 'esq', n: 'Esquerda', c: '#ef4444' };
    if (v < -0.14) return { id: 'cesq', n: 'Centro-esquerda', c: '#f97316' };
    if (v <= 0.14) return { id: 'cen', n: 'Centro', c: '#a3a3a3' };
    if (v <= 0.45) return { id: 'cdir', n: 'Centro-direita', c: '#38bdf8' };
    return { id: 'dir', n: 'Direita', c: '#3b82f6' };
  };

  // ---------- Promessas ----------
  const pr = (id, t, topic, e, s, cost) => ({ id, t, topic, e, s, cost });
  K.PROMISES = {
    exec_local: [
      pr('tarifa_zero', 'Tarifa zero no transporte público', 'transporte', -0.6, -0.1, 3),
      pr('upas', 'Novas unidades de saúde 24h', 'saude', -0.2, 0, 2),
      pr('creches', 'Zerar a fila das creches', 'educacao', -0.3, 0, 2),
      pr('guarda', 'Ampliar a guarda municipal e câmeras', 'seguranca', 0.3, 0.45, 2),
      pr('iptu', 'Reduzir o imposto predial (IPTU)', 'impostos', 0.7, 0.1, 2),
      pr('asfalto', 'Asfaltar todas as ruas de terra', 'transporte', 0.1, 0.1, 2),
      pr('moradia_pop', 'Programa de moradia popular', 'moradia', -0.5, 0, 3),
      pr('parques', 'Parques, ciclovias e arborização', 'ambiente', -0.3, -0.4, 1),
      pr('desburocratizar', 'Abrir empresas em 24 horas', 'economia', 0.6, 0, 1),
      pr('auditoria', 'Auditoria em todos os contratos', 'corrupcao', 0.1, 0, 1),
      pr('integral', 'Escola em tempo integral', 'educacao', -0.2, 0, 2),
      pr('ppps', 'Parcerias com a iniciativa privada', 'economia', 0.65, 0, 1),
      pr('acolhimento', 'Acolhimento à população de rua', 'moradia', -0.5, -0.4, 1),
      pr('civico_militar', 'Escolas cívico-militares', 'educacao', 0.4, 0.75, 1),
      pr('familia', 'Programas de apoio à família tradicional', 'valores', 0.2, 0.85, 1),
      pr('diversidade', 'Centro de referência LGBTQIA+ e de igualdade racial', 'valores', -0.3, -0.85, 1),
      pr('empregos_local', 'Frentes de trabalho e qualificação', 'economia', -0.4, 0, 2),
    ],
    exec_big: [
      pr('hospitais', 'Construir hospitais regionais', 'saude', -0.2, 0, 3),
      pr('policia', 'Mais policiais nas ruas e presídios', 'seguranca', 0.45, 0.6, 2),
      pr('prevencao', 'Segurança com prevenção e inteligência', 'seguranca', -0.3, -0.3, 2),
      pr('reforma_trib', 'Simplificar e reduzir impostos', 'impostos', 0.7, 0.1, 2),
      pr('taxar_ricos', 'Taxar grandes fortunas', 'impostos', -0.8, -0.2, 1),
      pr('transferencia', 'Ampliar programas de transferência de renda', 'economia', -0.6, 0, 3),
      pr('privatizar', 'Privatizar estatais', 'economia', 0.85, 0, 1),
      pr('infra', 'Grande plano de infraestrutura e estradas', 'transporte', 0.1, 0, 3),
      pr('metro', 'Novas linhas de metrô e trens', 'transporte', -0.2, -0.2, 3),
      pr('casas', 'Um milhão de moradias populares', 'moradia', -0.5, 0, 3),
      pr('desmatamento', 'Desmatamento ilegal zero', 'ambiente', -0.3, -0.5, 2),
      pr('agro_forte', 'Apoio total ao agronegócio', 'economia', 0.5, 0.3, 1),
      pr('anticorrupcao', 'Pacote anticorrupção e fim de privilégios', 'corrupcao', 0.2, 0.1, 1),
      pr('universidades', 'Mais vagas em universidades e escolas técnicas', 'educacao', -0.4, -0.2, 2),
      pr('homeschool', 'Liberdade educacional e escolas cívico-militares', 'educacao', 0.5, 0.7, 1),
      pr('vida_familia', 'Defesa da vida e da família', 'valores', 0.2, 0.9, 1),
      pr('direitos_civis', 'Ampliar direitos civis e combate ao preconceito', 'valores', -0.4, -0.85, 1),
      pr('teto', 'Responsabilidade fiscal e corte de gastos', 'economia', 0.75, 0.1, 1),
    ],
    leg: [
      pr('fiscalizar', 'Fiscalizar cada centavo do governo', 'corrupcao', 0.15, 0, 1),
      pr('salarios', 'Cortar salários e mordomias de políticos', 'corrupcao', 0.3, 0.1, 1),
      pr('saude_bairro', 'Lutar por mais médicos nos bairros', 'saude', -0.3, 0, 1),
      pr('animal', 'Lei de proteção animal', 'ambiente', -0.1, -0.3, 1),
      pr('praças', 'Iluminação e segurança nas praças', 'seguranca', 0.2, 0.3, 1),
      pr('penas', 'Penas mais duras para crimes violentos', 'seguranca', 0.4, 0.8, 1),
      pr('menos_impostos', 'Votar contra qualquer aumento de imposto', 'impostos', 0.75, 0.1, 1),
      pr('direitos_trab', 'Defender direitos trabalhistas', 'economia', -0.65, 0, 1),
      pr('empreendedor', 'Leis para o pequeno empreendedor', 'economia', 0.5, 0, 1),
      pr('escolas', 'Mais verbas para escolas e professores', 'educacao', -0.4, -0.1, 1),
      pr('moradia_leg', 'Regularização fundiária e moradia', 'moradia', -0.5, 0, 1),
      pr('clima', 'Leis climáticas e energia limpa', 'ambiente', -0.4, -0.5, 1),
      pr('familia_leg', 'Defender valores da família', 'valores', 0.25, 0.9, 1),
      pr('igualdade', 'Leis de igualdade e diversidade', 'valores', -0.4, -0.9, 1),
      pr('transparencia', 'Transparência total do mandato', 'corrupcao', 0, 0, 1),
      pr('mobilidade', 'Melhorar o transporte coletivo', 'transporte', -0.3, -0.1, 1),
    ],
  };
  K.MAX_PROMISES = 6;

  // ---------- Veículos de mídia (fictícios) ----------
  K.OUTLETS = [
    { id: 'mesa_aberta', n: 'Podcast Mesa Aberta', type: 'podcast', ic: 'Podcast', reach: 0.12, nat: true, lean: [0, 0], young: 0.8, diff: 0.5, energy: 2, cost: 0, d: 'Podcast gigante, público jovem e plural. Horas de conversa.' },
    { id: 'cast_prog', n: 'Cast Progressista', type: 'podcast', ic: 'Mic', reach: 0.06, nat: true, lean: [-0.55, -0.6], young: 0.7, diff: 0.4, energy: 2, cost: 0, d: 'Audiência de esquerda e progressista.' },
    { id: 'cast_cons', n: 'Papo Conservador', type: 'podcast', ic: 'Mic', reach: 0.06, nat: true, lean: [0.55, 0.65], young: 0.6, diff: 0.4, energy: 2, cost: 0, d: 'Audiência de direita e conservadora.' },
    { id: 'economia_pauta', n: 'Economia em Pauta', type: 'podcast', ic: 'ChartLine', reach: 0.03, nat: true, lean: [0.45, -0.1], young: 0.5, diff: 0.75, energy: 1, cost: 0, d: 'Nicho técnico: perguntas difíceis, público formador de opinião.' },
    { id: 'radio_local', n: 'Rádio Comunitária', type: 'radio', ic: 'Radio', reach: 0.08, nat: false, lean: [-0.15, 0.35], young: 0.2, diff: 0.3, energy: 1, cost: 0, d: 'Ouvintes mais velhos e de bairros populares.' },
    { id: 'tv_local', n: 'TV Regional — Jornal da Manhã', type: 'tv', ic: 'Tv', reach: 0.16, nat: false, lean: [0.05, 0.1], young: 0.3, diff: 0.55, energy: 2, cost: 0, d: 'Grande alcance local, entrevista dura ao vivo.' },
    { id: 'rede_nacional', n: 'Rede Nacional — Entrevista Central', type: 'tv', ic: 'Tv', reach: 0.22, nat: true, minLevel: 3, lean: [0.1, 0], young: 0.3, diff: 0.75, energy: 3, cost: 0, d: 'Horário nobre, milhões de espectadores. Bancada implacável.' },
    { id: 'jornal', n: 'Jornal O Diário', type: 'print', ic: 'Newspaper', reach: 0.05, nat: false, lean: [0.25, -0.15], young: 0.15, diff: 0.6, energy: 1, cost: 0, d: 'Leitores de alta renda e formadores de opinião.' },
    { id: 'humor', n: 'Programa de Humor da Noite', type: 'tv', ic: 'Laugh', reach: 0.1, nat: true, lean: [-0.1, -0.2], young: 0.75, diff: 0.35, energy: 2, cost: 0, humor: true, d: 'Leveza e carisma contam mais que propostas.' },
  ];

  // ---------- Perguntas (entrevistas, podcasts e debates) ----------
  const q = (topic, text, ...a) => ({ topic, q: text, a: a.map(([t, e, s, tone]) => ({ t, e, s, tone })) });
  K.QUESTIONS = [
    q('saude', 'As filas na saúde pública são enormes. O que você faria na prática?',
      ['Contratar mais médicos e abrir unidades 24h, com orçamento garantido.', -0.4, 0, 'firme'],
      ['Parcerias com hospitais privados e gestão por metas.', 0.5, 0, 'firme'],
      ['Mutirões imediatos e informatização das filas.', 0, 0, 'moderado'],
      ['Saúde é prioridade de todos, vamos ouvir a população.', null, null, 'evasivo']),
    q('seguranca', 'A violência é a maior preocupação de muitos eleitores. Qual a sua linha?',
      ['Polícia na rua, penas mais duras e tolerância zero.', 0.4, 0.8, 'firme'],
      ['Inteligência, prevenção e oportunidades para os jovens.', -0.4, -0.5, 'firme'],
      ['Integração entre polícia, câmeras e programas sociais.', 0, 0.1, 'moderado'],
      ['Bandido bom é bandido preso — e ponto final.', 0.5, 1, 'polemico']),
    q('impostos', 'Você vai aumentar ou reduzir impostos?',
      ['Reduzir. O povo já paga demais e recebe pouco.', 0.8, 0.1, 'firme'],
      ['Quem ganha mais deve pagar mais; os pobres, menos.', -0.7, -0.1, 'firme'],
      ['Nenhum aumento; vou cortar desperdícios primeiro.', 0.3, 0, 'moderado'],
      ['Não é hora de falar de impostos.', null, null, 'evasivo']),
    q('economia', 'Como gerar empregos rapidamente?',
      ['Investimento público em obras e frentes de trabalho.', -0.6, 0, 'firme'],
      ['Menos burocracia e impostos para quem empreende.', 0.7, 0, 'firme'],
      ['Qualificação profissional casada com as vagas das empresas.', 0, 0, 'moderado'],
      ['Empregos vão surgir quando a confiança voltar.', 0.2, 0, 'evasivo']),
    q('educacao', 'Qual é o modelo de escola que você defende?',
      ['Escola pública em tempo integral e professores valorizados.', -0.45, -0.2, 'firme'],
      ['Escolas cívico-militares e disciplina.', 0.4, 0.8, 'firme'],
      ['Vouchers e liberdade para as famílias escolherem.', 0.8, 0.3, 'firme'],
      ['Educação de qualidade para todos, com foco em resultados.', 0, 0, 'moderado']),
    q('ambiente', 'Desenvolvimento ou preservação ambiental?',
      ['Preservação em primeiro lugar: crise climática é real e urgente.', -0.4, -0.6, 'firme'],
      ['Desenvolvimento com bom senso; o meio ambiente não pode travar empregos.', 0.5, 0.3, 'firme'],
      ['Economia verde: dá para crescer preservando.', -0.1, -0.2, 'moderado'],
      ['Esse alarmismo climático é exagerado.', 0.6, 0.7, 'polemico']),
    q('corrupcao', 'Como combater a corrupção sem virar perseguição política?',
      ['Transparência total, dados abertos e auditoria independente.', 0, -0.1, 'moderado'],
      ['Prisão após condenação em segunda instância e fim do foro privilegiado.', 0.4, 0.4, 'firme'],
      ['Reforma política e fim do financiamento das máquinas partidárias.', -0.2, -0.2, 'firme'],
      ['Todo político é igual, só eu sou diferente.', null, null, 'polemico']),
    q('moradia', 'Milhões não têm onde morar. Qual a sua proposta?',
      ['Programa massivo de moradia popular com subsídio.', -0.5, 0, 'firme'],
      ['Crédito facilitado e menos regras para construtoras.', 0.6, 0, 'firme'],
      ['Ocupar imóveis vazios do centro com aluguel social.', -0.7, -0.4, 'firme'],
      ['Regularizar as áreas existentes e levar infraestrutura.', 0, 0, 'moderado']),
    q('transporte', 'O transporte público é caro e lotado. E agora?',
      ['Tarifa zero financiada por quem mais se beneficia.', -0.7, -0.2, 'firme'],
      ['Concessões à iniciativa privada com metas rígidas.', 0.6, 0, 'firme'],
      ['Corredores exclusivos e integração das linhas.', -0.1, 0, 'moderado'],
      ['Precisamos estudar com calma.', null, null, 'evasivo']),
    q('valores', 'Qual sua posição sobre temas de costumes, como drogas e família?',
      ['Sou contra a liberação das drogas e defendo a família tradicional.', 0.3, 0.9, 'firme'],
      ['Defendo a descriminalização e uma política de saúde pública.', -0.4, -0.85, 'firme'],
      ['O Estado não deve se meter na vida privada das pessoas.', 0.6, -0.5, 'firme'],
      ['Esse não é o foco da minha campanha.', null, null, 'evasivo']),
    q('economia', 'Você privatizaria empresas públicas?',
      ['Sim, todas que der. O Estado é mau gestor.', 0.9, 0.1, 'firme'],
      ['Não. Empresas públicas são patrimônio do povo.', -0.8, 0, 'firme'],
      ['Caso a caso, com análise técnica e transparência.', 0.1, 0, 'moderado'],
      ['Privatizar é entregar o país.', -0.9, 0.2, 'polemico']),
    q('saude', 'Programas sociais criam dependência ou combatem a fome?',
      ['Combatem a fome e devem ser ampliados.', -0.7, 0, 'firme'],
      ['Precisam de porta de saída: trabalho e capacitação.', 0.3, 0.2, 'moderado'],
      ['Geram dependência; prefiro reduzir impostos dos pobres.', 0.7, 0.3, 'firme'],
      ['Programa social é compra de voto.', 0.8, 0.5, 'polemico']),
    q('corrupcao', 'Seu partido já teve envolvidos em escândalos. Isso não te preocupa?',
      ['Quem errou deve pagar, inclusive do meu partido.', 0, 0, 'moderado'],
      ['Meu partido foi perseguido, mas eu sou ficha limpa.', null, null, 'firme'],
      ['Não comento casos específicos.', null, null, 'evasivo'],
      ['Os outros partidos são muito piores.', null, null, 'polemico']),
    q('seguranca', 'Você é a favor de facilitar a posse de armas para cidadãos?',
      ['Sim, o cidadão de bem tem direito à legítima defesa.', 0.5, 0.75, 'firme'],
      ['Não, mais armas significam mais mortes.', -0.4, -0.6, 'firme'],
      ['Só com regras rígidas, treinamento e fiscalização.', 0, 0.1, 'moderado'],
      ['Isso é com o governo federal, não comigo.', null, null, 'evasivo']),
    q('economia', 'Como vai pagar todas as suas promessas?',
      ['Cortando privilégios, cargos e desperdícios.', 0.3, 0, 'firme'],
      ['Cobrando mais de quem tem mais.', -0.7, 0, 'firme'],
      ['Com crescimento econômico e parcerias.', 0.4, 0, 'moderado'],
      ['O dinheiro existe, falta vontade política.', -0.2, 0, 'evasivo']),
    q('ambiente', 'O que fazer com as enchentes e desastres que se repetem?',
      ['Obras de drenagem e prevenção, com plano climático.', -0.2, -0.3, 'firme'],
      ['Desburocratizar obras e tirar o Estado do caminho.', 0.5, 0.1, 'firme'],
      ['Defesa civil forte e alertas por celular.', 0, 0, 'moderado'],
      ['É culpa da natureza, não tem muito o que fazer.', null, null, 'polemico']),
    q('educacao', 'Você apoia cotas em universidades e concursos?',
      ['Sim, são fundamentais para reduzir desigualdades.', -0.4, -0.6, 'firme'],
      ['Não, o critério deve ser só o mérito.', 0.5, 0.5, 'firme'],
      ['Prefiro cotas sociais, por renda.', 0, -0.1, 'moderado'],
      ['Tema complexo, prefiro não opinar.', null, null, 'evasivo']),
    q('valores', 'Qual o papel da religião na política?',
      ['O Estado é laico; fé é assunto pessoal.', -0.2, -0.6, 'firme'],
      ['Valores cristãos devem orientar as leis.', 0.3, 0.9, 'firme'],
      ['Respeito todas as crenças e governo para todos.', 0, 0, 'moderado'],
      ['Deus acima de tudo, e quem discordar que se cale.', 0.4, 1, 'polemico']),
    q('impostos', 'Você manteria benefícios fiscais para grandes empresas?',
      ['Sim, eles atraem investimento e empregos.', 0.6, 0, 'firme'],
      ['Não, é dinheiro que falta na saúde e educação.', -0.6, 0, 'firme'],
      ['Só os que comprovarem retorno social.', 0, 0, 'moderado'],
      ['Preciso ver os números antes.', null, null, 'evasivo']),
    q('transporte', 'Carros ou bicicletas e ônibus: para quem é a cidade?',
      ['Para as pessoas: ônibus, ciclovias e calçadas.', -0.3, -0.4, 'firme'],
      ['O motorista não pode ser tratado como vilão.', 0.4, 0.3, 'firme'],
      ['Equilíbrio entre todos os modais.', 0, 0, 'moderado'],
      ['Ciclovia é coisa de rico.', 0.2, 0.4, 'polemico']),
  ];
  K.TONES = { firme: 'Firme', moderado: 'Moderado', evasivo: 'Evasivo', polemico: 'Polêmico' };

  // ---------- Equipe ----------
  K.STAFF = [
    { id: 'marqueteiro', n: 'Marqueteiro(a)', ic: 'Sparkles', cost: 3, d: 'Mídia e propaganda rendem +35%.' },
    { id: 'social', n: 'Gestor(a) de redes', ic: 'Smartphone', cost: 2, d: 'Redes sociais +60% e defesa contra fake news.' },
    { id: 'campo', n: 'Coordenador(a) de campo', ic: 'Footprints', cost: 2, d: 'Ações de rua +35%.' },
    { id: 'estrategista', n: 'Estrategista', ic: 'Brain', cost: 3, d: '+2 de energia por semana.' },
    { id: 'advogado', n: 'Advogado(a) eleitoral', ic: 'Gavel', cost: 2, d: 'Escândalos e processos causam metade do dano.' },
    { id: 'pesquisador', n: 'Instituto de pesquisa', ic: 'ChartColumn', cost: 2, d: 'Pesquisas internas por segmento e menor erro.' },
    { id: 'imprensa', n: 'Assessor(a) de imprensa', ic: 'Newspaper', cost: 2, d: '+12% de desempenho em entrevistas e debates.' },
    { id: 'captador', n: 'Captador(a) de recursos', ic: 'PiggyBank', cost: 1, d: 'Doações espontâneas +60%.' },
  ];

  // ---------- Apoios ----------
  K.ENDORSE = [
    { id: 'comunitarios', n: 'Líderes comunitários', ic: 'HandHeart', seg: { pobres: 0.12 }, fit: () => 1, d: 'Presença nos bairros populares.' },
    { id: 'religiosos', n: 'Líderes religiosos', ic: 'Church', seg: { religiosos: 0.16, progressistas: -0.06 }, fit: (p) => (p.soc + 1) / 2, d: 'Igrejas e templos em peso.' },
    { id: 'sindicatos', n: 'Sindicatos', ic: 'Users', seg: { esquerda: 0.12, pobres: 0.04, direita: -0.04 }, money: 4, fit: (p) => (1 - p.econ) / 2, d: 'Militância organizada e recursos.' },
    { id: 'empresarios', n: 'Associações empresariais', ic: 'Building2', seg: { ricos: 0.12, direita: 0.04, pobres: -0.03 }, money: 10, fit: (p) => (1 + p.econ) / 2, d: 'Dinheiro e credibilidade econômica.' },
    { id: 'influencers', n: 'Influenciadores digitais', ic: 'Smartphone', seg: { jovens: 0.14 }, aw: 0.05, fit: () => 0.8, d: 'Alcance enorme entre jovens.' },
    { id: 'artistas', n: 'Artistas e intelectuais', ic: 'Music', seg: { progressistas: 0.1, jovens: 0.06, conservadores: -0.03 }, aw: 0.03, fit: (p) => (1 - p.soc) / 2, d: 'Visibilidade e prestígio cultural.' },
    { id: 'seguranca', n: 'Forças de segurança', ic: 'Shield', seg: { conservadores: 0.12 }, issue: { seguranca: 0.15 }, fit: (p) => (1 + p.soc) / 2, d: 'Credibilidade no combate ao crime.' },
    { id: 'ambientalistas', n: 'Ambientalistas', ic: 'Leaf', seg: { progressistas: 0.08, jovens: 0.05, rurais: -0.04 }, issue: { ambiente: 0.15 }, fit: (p) => (1 - p.soc) / 2 * 0.9 + 0.05, d: 'Selo verde para sua candidatura.' },
    { id: 'agro', n: 'Produtores rurais', ic: 'Tractor', seg: { rurais: 0.16, direita: 0.04 }, money: 6, fit: (p) => (1 + p.econ) / 2, d: 'Interior e agronegócio com você.' },
  ];

  // ---------- Projetos de governo (mandato executivo) ----------
  const pj = (id, n, topic, cost, dur, appr, seg = {}, rep = 0) => ({ id, n, topic, cost, dur, appr, seg, rep });
  K.PROJECTS = {
    exec_local: [
      pj('postos', 'Mutirão da saúde e novos postos', 'saude', 4, 2, 5, { pobres: 2 }),
      pj('creches_p', 'Creches e escola integral', 'educacao', 5, 3, 6, { jovens: 2 }),
      pj('guarda_p', 'Guarda municipal e câmeras', 'seguranca', 4, 2, 4, { conservadores: 3 }),
      pj('tarifa_p', 'Tarifa zero no ônibus', 'transporte', 6, 2, 7, { pobres: 4, ricos: -2 }),
      pj('asfalto_p', 'Asfalto em todos os bairros', 'transporte', 4, 2, 5, {}),
      pj('moradia_p', 'Programa habitacional', 'moradia', 6, 4, 6, { pobres: 4 }),
      pj('parques_p', 'Parques e arborização', 'ambiente', 2, 2, 2, { progressistas: 3 }),
      pj('iptu_p', 'Redução do IPTU', 'impostos', 3, 1, 3, { ricos: 4 }),
      pj('empresas_p', 'Desburocratização para empresas', 'economia', 2, 2, 3, { direita: 3 }),
      pj('frentes_p', 'Frentes de trabalho', 'economia', 3, 2, 4, { pobres: 3 }),
      pj('transp_p', 'Portal da transparência e auditorias', 'corrupcao', 1, 1, 2, {}, 4),
      pj('acolhe_p', 'Centro de acolhimento', 'moradia', 2, 2, 2, { progressistas: 3 }),
      pj('civico_p', 'Escolas cívico-militares', 'educacao', 2, 2, 3, { conservadores: 4, progressistas: -2 }),
      pj('familia_p', 'Programa família forte', 'valores', 2, 1, 2, { religiosos: 4 }),
      pj('diversidade_p', 'Centro de igualdade e diversidade', 'valores', 2, 1, 2, { progressistas: 4, religiosos: -2 }),
    ],
    exec_big: [
      pj('hospitais_p', 'Hospitais regionais', 'saude', 6, 3, 6, { pobres: 2 }),
      pj('policia_p', 'Reforço das polícias', 'seguranca', 5, 2, 5, { conservadores: 3 }),
      pj('inteligencia_p', 'Segurança com inteligência', 'seguranca', 4, 2, 4, { progressistas: 2 }),
      pj('infra_p', 'Plano de estradas e infraestrutura', 'transporte', 6, 4, 6, { rurais: 3 }),
      pj('metro_p', 'Metrô e trens metropolitanos', 'transporte', 7, 4, 7, { jovens: 2 }),
      pj('casas_p', 'Moradias populares em massa', 'moradia', 7, 4, 7, { pobres: 4 }),
      pj('renda_p', 'Ampliar transferência de renda', 'economia', 5, 1, 6, { pobres: 5, ricos: -2 }),
      pj('reforma_p', 'Reforma e redução de impostos', 'impostos', 3, 2, 4, { ricos: 4, direita: 2 }),
      pj('privat_p', 'Programa de privatizações', 'economia', 1, 2, 2, { direita: 4, esquerda: -3 }),
      pj('ambiente_p', 'Desmatamento zero e energia limpa', 'ambiente', 3, 2, 3, { progressistas: 4, rurais: -2 }),
      pj('agro_p', 'Plano safra e apoio ao agro', 'economia', 3, 1, 3, { rurais: 5 }),
      pj('univ_p', 'Universidades e escolas técnicas', 'educacao', 5, 3, 5, { jovens: 4 }),
      pj('anticorr_p', 'Pacote anticorrupção', 'corrupcao', 1, 1, 3, {}, 5),
      pj('familia_bp', 'Política nacional da família', 'valores', 2, 1, 2, { religiosos: 4, progressistas: -2 }),
      pj('direitos_bp', 'Plano de direitos civis', 'valores', 2, 1, 2, { progressistas: 4, religiosos: -2 }),
      pj('fiscal_p', 'Ajuste fiscal', 'economia', 0, 2, -2, { direita: 3, esquerda: -2 }, 2),
    ],
  };
  K.LEG_ACTIONS = [
    { id: 'pl', n: 'Apresentar projeto de lei', ic: 'ScrollText', d: 'Escolha um tema. Se aprovado, conta como promessa cumprida.', topic: true },
    { id: 'emendas', n: 'Destinar emendas para a base', ic: 'HandCoins', d: '+Aprovação nas regiões atendidas.' },
    { id: 'tribuna', n: 'Discurso na tribuna', ic: 'MicVocal', d: 'Chance de viralizar (oratória).' },
    { id: 'fiscalizar', n: 'Fiscalizar o Executivo', ic: 'Eye', d: '+Fama e reputação, irrita o governo.' },
    { id: 'comissao', n: 'Presidir comissão temática', ic: 'Landmark', d: 'Ganha experiência (+Inteligência, +Articulação).' },
    { id: 'gabinete', n: 'Atender a população no gabinete', ic: 'Users', d: '+Aprovação local.' },
    { id: 'cargos', n: 'Negociar cargos com o governo', ic: 'Handshake', d: '+Dinheiro e influência, −Reputação.' },
  ];
  K.PRE_ACTIONS = [
    { id: 'palestras', n: 'Palestras e eventos', ic: 'Presentation', d: '+Dinheiro, +Fama.' },
    { id: 'midia', n: 'Rodada de podcasts e entrevistas', ic: 'Podcast', d: '+Fama (melhor com carisma).' },
    { id: 'voluntario', n: 'Trabalho voluntário / ONG', ic: 'HandHeart', d: '+Reputação, +Fama.' },
    { id: 'livro', n: 'Escrever um livro', ic: 'BookOpen', d: '+Inteligência, +Fama.' },
    { id: 'oratoria', n: 'Curso de oratória e media training', ic: 'MicVocal', d: '+Oratória, +Carisma.' },
    { id: 'estudar', n: 'Estudar políticas públicas', ic: 'Brain', d: '+Inteligência.' },
    { id: 'rede', n: 'Construir rede de lideranças', ic: 'Network', d: '+Articulação, apoio no partido.' },
    { id: 'arrecadar', n: 'Arrecadar para a próxima campanha', ic: 'PiggyBank', d: '+Dinheiro.' },
    { id: 'viajar', n: 'Viajar e conhecer o eleitorado', ic: 'Map', d: '+Fama.' },
    { id: 'redes', n: 'Produzir conteúdo nas redes', ic: 'Smartphone', d: '+Fama entre jovens, +Carisma.' },
  ];

  // ---------- Eventos de campanha ----------
  // fx: money (unidades de custo), rep, fame, mom (global), zmom (região do evento), aw, seg{}, scandal, energy, oppMom, attr{}, issue{}
  const ev = (o) => o;
  K.EVENTS = [
    ev({ id: 'caixa2', ic: 'Banknote', title: 'Dinheiro por fora', w: 1.2, text: 'Um empresário oferece uma doação generosa — mas “por fora”, sem declarar à Justiça Eleitoral.',
      ch: [
        { t: 'Aceitar o dinheiro', fx: { money: 14, scandal: 3, flag: 'caixa2' }, msg: 'O caixa da campanha engordou. Ninguém precisa saber... certo?' },
        { t: 'Recusar educadamente', fx: { rep: 2 } },
        { t: 'Denunciar publicamente', fx: { rep: 6, mom: 0.05, fame: 2, energy: -1 }, msg: 'Sua denúncia virou manchete: “Candidato recusa caixa 2”.' },
      ] }),
    ev({ id: 'fakenews', ic: 'TriangleAlert', title: 'Fake news contra você', w: 1.2, text: 'Uma montagem com uma frase que você nunca disse está viralizando em grupos de mensagens.',
      ch: [
        { t: 'Gravar vídeo desmentindo', test: { attr: 'ora', diff: 50 }, ok: { mom: 0.05, aw: 0.02, energy: -1 }, fail: { mom: -0.05, energy: -1 } },
        { t: 'Acionar a Justiça', fx: { money: -3, mom: -0.02 }, staffBonus: { advogado: { mom: 0.06 } } },
        { t: 'Ignorar', fx: { mom: -0.1 }, staffBonus: { social: { mom: 0.07 } } },
      ] }),
    ev({ id: 'viral', ic: 'Flame', title: 'Seu vídeo viralizou!', w: 1, text: 'Um trecho espontâneo seu conversando com um eleitor explodiu nas redes.',
      ch: [
        { t: 'Aproveitar com uma live', fx: { energy: -1, aw: 0.07, seg: { jovens: 0.08 } } },
        { t: 'Agradecer e seguir a agenda', fx: { aw: 0.04, mom: 0.02 } },
      ] }),
    ev({ id: 'gafe', ic: 'MicVocal', title: 'Microfone aberto', w: 1, text: 'Você fez uma piada infeliz achando que o microfone estava desligado. O áudio vazou.',
      ch: [
        { t: 'Pedir desculpas sinceras', fx: { rep: 1, mom: -0.04 } },
        { t: 'Dobrar a aposta', fx: { polar: 0.12 }, msg: 'Seus apoiadores adoraram. Os adversários, nem tanto.' },
        { t: 'Dizer que foi tirado de contexto', test: { attr: 'int', diff: 55 }, ok: { mom: 0 }, fail: { mom: -0.1, rep: -3 } },
      ] }),
    ev({ id: 'enchente', ic: 'CloudRain', title: 'Temporal em {zone}', w: 1.1, zone: true, text: 'Uma chuva forte alagou ruas e casas em {zone}. Famílias estão desalojadas.',
      ch: [
        { t: 'Ir ao local ajudar', fx: { energy: -2, zmom: 0.28, zaw: 0.12 } },
        { t: 'Mobilizar doações da campanha', fx: { money: -4, zmom: 0.16, rep: 2 } },
        { t: 'Cobrar as autoridades nas redes', fx: { zmom: 0.06, mom: 0.02 } },
        { t: 'Não se manifestar', fx: { zmom: -0.12 } },
      ] }),
    ev({ id: 'greve', ic: 'Megaphone', title: 'Greve de {categoria}', w: 1, text: 'A greve de {categoria} paralisa a cidade e divide opiniões.',
      ch: [
        { t: 'Apoiar os grevistas', fx: { seg: { esquerda: 0.1, pobres: 0.03, direita: -0.07 } } },
        { t: 'Defender o fim da greve', fx: { seg: { direita: 0.1, ricos: 0.03, esquerda: -0.07 } } },
        { t: 'Propor uma mediação', test: { attr: 'art', diff: 55 }, ok: { mom: 0.07, rep: 2 }, fail: { mom: -0.02 } },
      ] }),
    ev({ id: 'igreja', ic: 'Church', title: 'Convite para o culto', w: 1, text: 'Um líder religioso muito influente oferece apoio e convida você a falar aos fiéis no domingo.',
      ch: [
        { t: 'Aceitar e subir ao púlpito', fx: { seg: { religiosos: 0.15, progressistas: -0.07 }, energy: -1 } },
        { t: 'Visitar discretamente', fx: { seg: { religiosos: 0.07 } } },
        { t: 'Recusar: Estado laico', fx: { seg: { progressistas: 0.05, religiosos: -0.05 }, rep: 1 } },
      ] }),
    ev({ id: 'sindicato', ic: 'Users', title: 'Central sindical quer te apoiar', w: 0.9, text: 'Uma central sindical oferece militância e estrutura para sua campanha.',
      ch: [
        { t: 'Aceitar o apoio', fx: { seg: { esquerda: 0.12, pobres: 0.04, direita: -0.05 }, money: 3 } },
        { t: 'Recusar', fx: { seg: { direita: 0.03 } } },
      ] }),
    ev({ id: 'empresarios', ic: 'Building2', title: 'Jantar com empresários', w: 1, text: 'A associação comercial convida você para um jantar com doadores em potencial.',
      ch: [
        { t: 'Ir e prometer menos impostos', fx: { seg: { ricos: 0.12, pobres: -0.04 }, money: 7, issue: { impostos: 0.1 } } },
        { t: 'Ir e falar de geração de empregos', fx: { seg: { ricos: 0.05, pobres: 0.02 }, money: 3, energy: -1 } },
        { t: 'Não ir', fx: {} },
      ] }),
    ev({ id: 'celebridade', ic: 'Star', title: 'Celebridade declara voto', w: 0.8, text: 'Uma celebridade muito querida declarou voto em você nas redes!',
      ch: [
        { t: 'Gravar um vídeo juntos', fx: { energy: -1, aw: 0.08, seg: { jovens: 0.1 } } },
        { t: 'Agradecer publicamente', fx: { aw: 0.04, seg: { jovens: 0.04 } } },
      ] }),
    ev({ id: 'ataque', ic: 'Swords', title: '{opp} ataca você', w: 1.3, opp: true, text: '{opp} usou a propaganda para dizer que você “não tem experiência nem propostas”.',
      ch: [
        { t: 'Responder à altura', test: { attr: 'ora', diff: 55 }, ok: { oppMom: -0.06, mom: 0.03 }, fail: { mom: -0.06 } },
        { t: 'Ignorar e falar de propostas', fx: { mom: -0.02, rep: 2 } },
        { t: 'Pedir direito de resposta', test: { attr: 'int', diff: 45 }, ok: { mom: 0.05, oppMom: -0.04 }, fail: { money: -2 }, staffBonus: { advogado: { mom: 0.03 } } },
      ] }),
    ev({ id: 'escandalo_opp', ic: 'Siren', title: 'Denúncia contra {opp}', w: 0.9, opp: true, text: 'Uma reportagem acusa {opp} de irregularidades em contratos antigos.',
      ch: [
        { t: 'Explorar ao máximo', fx: { oppMom: -0.15, mom: 0.02, rep: -2 } },
        { t: 'Cobrar investigação com serenidade', fx: { oppMom: -0.08, rep: 1 } },
        { t: 'Não comentar', fx: { rep: 3, oppMom: -0.04 } },
      ] }),
    ev({ id: 'crise_equipe', ic: 'TrendingDown', title: 'Crise na equipe', w: 1, cond: (g) => g.rank > 1 && g.week >= 3, text: 'Depois da última pesquisa, sua equipe está dividida sobre os rumos da campanha.',
      ch: [
        { t: 'Trocar o comando da comunicação', fx: { money: -4, mom: 0.06 } },
        { t: 'Manter a estratégia', fx: { mom: 0.0 } },
        { t: 'Partir para o ataque contra o líder', fx: { leaderMom: -0.07, rep: -2 } },
      ] }),
    ev({ id: 'vice', ic: 'UserX', title: 'Polêmica do seu vice', w: 0.8, cond: (g) => g.hasVice, text: 'Seu vice deu uma declaração polêmica em uma entrevista e o assunto dominou o dia.',
      ch: [
        { t: 'Defender o vice', fx: { polar: 0.06, mom: -0.02 } },
        { t: 'Desautorizar publicamente', fx: { rep: 2, mom: -0.03 } },
      ] }),
    ev({ id: 'partido_op', ic: 'Siren', title: 'Operação mira seu partido', w: 0.8, text: 'Uma operação policial cumpre mandados contra dirigentes do {party}.',
      ch: [
        { t: 'Defender o partido', fx: { mom: -0.08, rep: -3 } },
        { t: 'Pedir apuração rigorosa', fx: { rep: 2, mom: -0.03 } },
        { t: 'Ameaçar deixar o partido', fx: { mom: 0.02, partySupport: -15 } },
      ] }),
    ev({ id: 'desemprego', ic: 'Briefcase', title: 'Desemprego dispara', w: 0.8, text: 'Novos dados mostram alta do desemprego. Emprego vira o tema da eleição.',
      sal: { economia: 1.5 },
      ch: [
        { t: 'Lançar um plano de empregos', fx: { energy: -1, issue: { economia: 0.2 }, mom: 0.03 } },
        { t: 'Culpar os governantes atuais', fx: { mom: 0.03, polar: 0.03 } },
      ] }),
    ev({ id: 'violencia', ic: 'Siren', title: 'Onda de assaltos em {zone}', w: 1, zone: true, sal: { seguranca: 1.5 }, text: 'Uma sequência de crimes assusta os moradores de {zone}.',
      ch: [
        { t: 'Prometer policiamento ostensivo', fx: { seg: { conservadores: 0.08 }, issue: { seguranca: 0.12 } } },
        { t: 'Defender prevenção e iluminação', fx: { seg: { progressistas: 0.06 }, issue: { seguranca: 0.1 } } },
        { t: 'Visitar as famílias', fx: { energy: -2, zmom: 0.22, zaw: 0.1 } },
      ] }),
    ev({ id: 'meme', ic: 'Laugh', title: 'Você virou meme', w: 1, text: 'Uma foto sua com uma careta engraçada virou figurinha em todos os grupos.',
      ch: [
        { t: 'Abraçar o meme', test: { attr: 'car', diff: 50 }, ok: { aw: 0.08, seg: { jovens: 0.1 } }, fail: { mom: -0.04 } },
        { t: 'Ignorar', fx: { aw: 0.03 } },
        { t: 'Reclamar publicamente', fx: { mom: -0.05 } },
      ] }),
    ev({ id: 'cansaco', ic: 'Coffee', title: 'Exaustão', w: 0.9, text: 'A maratona de agendas está cobrando seu preço. Você mal dormiu esta semana.',
      ch: [
        { t: 'Desacelerar um pouco', fx: { energy: -2 } },
        { t: 'Café e seguir em frente', test: { attr: 'car', diff: 35 }, ok: {}, fail: { mom: -0.06 }, msg: 'Cansado(a), você trocou o nome do bairro durante um discurso.' },
      ] }),
    ev({ id: 'multa', ic: 'Gavel', title: 'Multa da Justiça Eleitoral', w: 0.7, country: ['BR'], text: 'Você foi multado(a) por propaganda irregular: placas em local proibido.',
      ch: [
        { t: 'Pagar e corrigir', fx: { money: -3 } },
        { t: 'Recorrer', test: { attr: 'int', diff: 55 }, ok: { money: -1 }, fail: { money: -4, rep: -1 }, staffBonus: { advogado: { money: 3 } } },
      ] }),
    ev({ id: 'boca', ic: 'Vote', title: 'Proposta de boca de urna', w: 2, country: ['BR'], cond: (g) => g.week === g.total, text: 'Um cabo eleitoral propõe pagar pessoas para fazer boca de urna no dia da eleição — o que é crime.',
      ch: [
        { t: 'Recusar', fx: { rep: 2 } },
        { t: 'Aceitar', fx: { aw: 0.03, scandal: 3 }, risk: { p: 0.3, fx: { rep: -10, mom: -0.12 }, msg: 'A polícia flagrou a boca de urna da sua campanha!' } },
      ] }),
    ev({ id: 'publi', ic: 'Smartphone', title: 'Publicidade disfarçada', w: 0.8, text: 'Um influenciador cobra para elogiar você — sem avisar que é publicidade.',
      ch: [
        { t: 'Recusar', fx: { rep: 1 } },
        { t: 'Contratar com transparência', fx: { money: -3, seg: { jovens: 0.06 } } },
        { t: 'Aceitar sem divulgar', fx: { money: -2, seg: { jovens: 0.1 }, scandal: 2 } },
      ] }),
    ev({ id: 'sabatina', ic: 'GraduationCap', title: 'Sabatina na universidade', w: 0.8, text: 'Estudantes convidam você para uma sabatina aberta, ao vivo.',
      ch: [
        { t: 'Aceitar o desafio', test: { attr: 'int', diff: 55 }, ok: { aw: 0.03, seg: { jovens: 0.1 }, energy: -1 }, fail: { seg: { jovens: -0.06 }, energy: -1 } },
        { t: 'Recusar', fx: { seg: { jovens: -0.03 } } },
      ] }),
    ev({ id: 'hacker', ic: 'Bot', title: 'Hacker vaza conversas', w: 3, cond: (g) => g.flags.caixa2, once: true, text: 'Conversas da sua campanha sobre “dinheiro por fora” foram vazadas na internet.',
      ch: [
        { t: 'Negar tudo', test: { attr: 'ora', diff: 70 }, ok: { mom: -0.08, rep: -6 }, fail: { mom: -0.2, rep: -15, scandal: 3 }, staffBonus: { advogado: { mom: 0.06, rep: 5 } } },
        { t: 'Admitir e pedir desculpas', fx: { mom: -0.14, rep: -8, money: -6 } },
      ] }),
    ev({ id: 'moradores', ic: 'House', title: 'Carta dos moradores de {zone}', w: 1, zone: true, text: 'A associação de moradores de {zone} pede um compromisso público com as demandas do bairro.',
      ch: [
        { t: 'Assinar a carta-compromisso', fx: { zmom: 0.2 } },
        { t: 'Prometer uma visita', fx: { energy: -1, zmom: 0.12, zaw: 0.06 } },
        { t: 'Responder que não faz acordos', fx: { zmom: -0.05, rep: 1 } },
      ] }),
    ev({ id: 'ambiental', ic: 'Leaf', title: 'Desastre ambiental', w: 0.7, sal: { ambiente: 1.6 }, text: 'Um vazamento de produtos químicos contamina um rio da região.',
      ch: [
        { t: 'Exigir punição dura à empresa', fx: { seg: { progressistas: 0.08, ricos: -0.03 }, issue: { ambiente: 0.1 } } },
        { t: 'Defender equilíbrio e os empregos', fx: { seg: { direita: 0.06, progressistas: -0.04 } } },
      ] }),
    ev({ id: 'doacoes', ic: 'HandCoins', title: 'Doações espontâneas', w: 0.8, cond: (g) => g.share > 0.2 || g.rank <= 2, text: 'Depois da última pesquisa, as doações online dispararam!',
      ch: [{ t: 'Ótimo!', fx: { money: 6 } }] }),
    ev({ id: 'cachorro', ic: 'Heart', title: 'Um cachorro rouba a cena', w: 0.7, text: 'Um vira-lata caramelo subiu no palco no meio do seu discurso e não quis mais sair.',
      ch: [
        { t: 'Adotar o cachorro', fx: { aw: 0.05, mom: 0.04, money: -1 }, msg: '“Caramelo” virou mascote da campanha.' },
        { t: 'Fazer carinho e seguir o discurso', fx: { aw: 0.02, mom: 0.02 } },
      ] }),
    ev({ id: 'prefeito_apoio', ic: 'Handshake', title: 'Liderança local quer apoio', w: 1, zone: true, arena: ['state', 'country'], text: 'Uma liderança muito popular em {zone} quer subir no seu palanque — em troca de espaço no seu futuro governo.',
      ch: [
        { t: 'Aceitar o acordo', fx: { zmom: 0.25, rep: -1 } },
        { t: 'Recusar', fx: { rep: 1 } },
      ] }),
    ev({ id: 'apagao', ic: 'Zap', title: 'Apagão em {zone}', w: 0.8, zone: true, text: 'Um apagão deixou {zone} sem energia por dois dias.',
      ch: [
        { t: 'Cobrar a concessionária', fx: { zmom: 0.1 } },
        { t: 'Levar ajuda e geradores', fx: { money: -3, zmom: 0.2 } },
      ] }),
    ev({ id: 'perfil_critico', ic: 'Newspaper', title: 'Reportagem crítica', w: 0.9, text: 'Um grande jornal publicou um perfil duro sobre sua trajetória.',
      ch: [
        { t: 'Dar entrevista para rebater', test: { attr: 'ora', diff: 55 }, ok: { mom: 0.04 }, fail: { mom: -0.06 } },
        { t: 'Publicar uma nota', fx: { rep: 1, mom: -0.02 } },
        { t: 'Atacar a imprensa', fx: { seg: { conservadores: 0.05, progressistas: -0.06 }, rep: -2 } },
      ] }),
    ev({ id: 'promessas_caras', ic: 'Calculator', title: 'Suas promessas cabem no orçamento?', w: 2, cond: (g) => g.promiseCost > 8, once: true, text: 'Economistas dizem que suas promessas custam mais do que o orçamento permite.',
      ch: [
        { t: 'Apresentar as fontes de receita', test: { attr: 'int', diff: 60 }, ok: { mom: 0.04, rep: 2 }, fail: { mom: -0.06, rep: -3 } },
        { t: 'Ignorar as críticas', fx: { mom: -0.05, rep: -2 } },
      ] }),
    ev({ id: 'humor_tv', ic: 'Laugh', title: 'Convite para programa de humor', w: 0.7, text: 'Um programa de humor famoso quer você no quadro de entrevistas.',
      ch: [
        { t: 'Ir e se divertir', test: { attr: 'car', diff: 55 }, ok: { aw: 0.07, mom: 0.05, energy: -1 }, fail: { mom: -0.06, energy: -1 } },
        { t: 'Recusar', fx: {} },
      ] }),
    ev({ id: 'padrinho', ic: 'Crown', title: 'Um padrinho político', w: 0.8, text: 'Uma figura muito popular (e polêmica) da política oferece declarar apoio a você.',
      ch: [
        { t: 'Aceitar o apoio', fx: { aw: 0.05, polar: 0.08 } },
        { t: 'Agradecer, mas manter distância', fx: { rep: 1 } },
      ] }),
  ];
  K.GREVE_CAT = ['professores', 'motoristas de ônibus', 'servidores da saúde', 'garis', 'policiais civis'];

  // ---------- Eventos de mandato ----------
  K.MANDATE_EVENTS = [
    { id: 'm_chuvas', ic: 'CloudRain', title: 'Chuvas causam estragos', text: 'Temporais deixaram milhares de desabrigados.', kind: 'exec',
      ch: [{ t: 'Decretar emergência e agir rápido', fx: { budget: -2, appr: 5 } }, { t: 'Pedir ajuda a outras esferas', fx: { appr: 1 } }, { t: 'Culpar gestões anteriores', fx: { appr: -4 } }] },
    { id: 'm_greve', ic: 'Megaphone', title: 'Greve dos servidores', text: 'Servidores cruzam os braços por reajuste.', kind: 'exec',
      ch: [{ t: 'Conceder reajuste', fx: { budget: -3, appr: 3, seg: { esquerda: 2 } } }, { t: 'Endurecer e cortar o ponto', fx: { appr: -2, seg: { direita: 3, esquerda: -3 } } }, { t: 'Abrir mesa de negociação', test: { attr: 'art', diff: 55 }, ok: { appr: 3 }, fail: { appr: -2 } }] },
    { id: 'm_secretario', ic: 'Siren', title: 'Auxiliar acusado de desvio', text: 'Um auxiliar de confiança é acusado de desviar recursos.', kind: 'any',
      ch: [{ t: 'Demitir imediatamente', fx: { rep: 3, appr: 1 } }, { t: 'Defender o auxiliar', fx: { rep: -5, appr: -4, scandal: 2 } }, { t: 'Abrir investigação interna', fx: { appr: -1, rep: 1 } }] },
    { id: 'm_obra', ic: 'Hammer', title: 'Obra atrasada', text: 'Uma obra importante atrasou e o custo disparou.', kind: 'exec',
      ch: [{ t: 'Injetar mais recursos', fx: { budget: -3, appr: 1 } }, { t: 'Rescindir o contrato', fx: { appr: -2, rep: 2 } }] },
    { id: 'm_fiscal', ic: 'TrendingDown', title: 'Queda na arrecadação', text: 'A economia desacelerou e a arrecadação caiu.', kind: 'exec',
      ch: [{ t: 'Cortar gastos', fx: { budget: 3, appr: -3, seg: { direita: 2 } } }, { t: 'Aumentar impostos', fx: { budget: 4, appr: -5 } }, { t: 'Pegar empréstimo', fx: { budget: 3, appr: 0, debt: 3 } }] },
    { id: 'm_cpi', ic: 'Landmark', title: 'Oposição abre investigação', text: 'A oposição abriu uma comissão para investigar atos do seu mandato.', kind: 'any',
      ch: [{ t: 'Colaborar com transparência', fx: { rep: 2, appr: -1 } }, { t: 'Obstruir os trabalhos', fx: { appr: -3, rep: -4 } }] },
    { id: 'm_premio', ic: 'Award', title: 'Prêmio de gestão', text: 'Uma iniciativa do seu mandato ganhou um prêmio nacional!', kind: 'any',
      ch: [{ t: 'Comemorar com a equipe', fx: { appr: 4, fame: 3 } }] },
    { id: 'm_dengue', ic: 'Stethoscope', title: 'Surto de doença', text: 'Um surto de dengue lota as unidades de saúde.', kind: 'exec',
      ch: [{ t: 'Mutirão de saúde', fx: { budget: -2, appr: 4 } }, { t: 'Campanha de comunicação', fx: { appr: 1 } }] },
    { id: 'm_protesto', ic: 'Megaphone', title: 'Protestos nas ruas', text: 'Manifestantes protestam contra o aumento de tarifas.', kind: 'exec',
      ch: [{ t: 'Recuar do aumento', fx: { budget: -2, appr: 3 } }, { t: 'Manter a decisão', fx: { appr: -3, rep: 1 } }, { t: 'Receber uma comissão', test: { attr: 'car', diff: 50 }, ok: { appr: 2 }, fail: { appr: -1 } }] },
    { id: 'm_emendas', ic: 'HandCoins', title: 'Oferta do governo', text: 'O governo oferece recursos para sua base em troca do seu voto num projeto polêmico.', kind: 'leg',
      ch: [{ t: 'Aceitar', fx: { appr: 3, rep: -3, money: 4 } }, { t: 'Recusar', fx: { rep: 3 } }] },
    { id: 'm_votacao', ic: 'Vote', title: 'Votação polêmica', text: 'Uma reforma polêmica vai a voto e todos querem saber sua posição.', kind: 'leg',
      ch: [{ t: 'Votar a favor', fx: { seg: { direita: 3, esquerda: -3 } } }, { t: 'Votar contra', fx: { seg: { esquerda: 3, direita: -3 } } }, { t: 'Se abster', fx: { rep: -1 } }] },
    { id: 'm_viral', ic: 'Flame', title: 'Discurso viraliza', text: 'Um discurso seu foi compartilhado milhões de vezes.', kind: 'any',
      ch: [{ t: 'Surfar a onda', fx: { fame: 4, appr: 1 } }] },
    { id: 'm_apagao', ic: 'Zap', title: 'Crise de energia', text: 'Uma crise de energia afeta a população.', kind: 'exec',
      ch: [{ t: 'Plano emergencial', fx: { budget: -2, appr: 2 } }, { t: 'Cobrar a concessionária', fx: { appr: 1 } }] },
  ];

  // ---------- Institutos de pesquisa (fictícios) ----------
  K.POLLSTERS = ['Instituto Datavox', 'Pulso Opinião', 'Quórum Pesquisas', 'Radar Eleitoral', 'Panorama Dados', 'Tendência & Voto'];

  // ---------- Bairros reais (capitais e grandes cidades) ----------
  K.BAIRROS = {
    3550308: ['Sé', 'Pinheiros', 'Moema', 'Itaquera', 'Capão Redondo', 'Santana', 'Mooca', 'Lapa', 'Butantã', 'Vila Mariana', 'Penha', 'Brasilândia', 'Jabaquara', 'Grajaú', 'Tatuapé', 'Cidade Tiradentes', 'Morumbi', 'Perus'],
    3304557: ['Copacabana', 'Barra da Tijuca', 'Tijuca', 'Campo Grande', 'Madureira', 'Botafogo', 'Bangu', 'Méier', 'Centro', 'Ilha do Governador', 'Santa Cruz', 'Jacarepaguá', 'Penha', 'Leblon', 'Realengo', 'Recreio'],
    3106200: ['Savassi', 'Centro', 'Pampulha', 'Barreiro', 'Venda Nova', 'Lourdes', 'Buritis', 'Santa Efigênia', 'Floresta', 'Padre Eustáquio', 'Castelo', 'Jardim América', 'Serra', 'Santa Tereza'],
    5300108: ['Plano Piloto', 'Ceilândia', 'Taguatinga', 'Samambaia', 'Águas Claras', 'Gama', 'Sobradinho', 'Planaltina', 'Lago Sul', 'Guará', 'Recanto das Emas', 'Santa Maria', 'Vicente Pires', 'Sol Nascente'],
    2927408: ['Barra', 'Pituba', 'Liberdade', 'Itapuã', 'Cajazeiras', 'Rio Vermelho', 'Pelourinho', 'Brotas', 'Cabula', 'Subúrbio Ferroviário', 'Paripe', 'Imbuí', 'Ondina', 'São Caetano'],
    2304400: ['Aldeota', 'Meireles', 'Messejana', 'Barra do Ceará', 'Centro', 'Montese', 'Jangurussu', 'Bom Jardim', 'Parangaba', 'Cocó', 'Mucuripe', 'Conjunto Ceará', 'Benfica', 'Granja Lisboa'],
    2611606: ['Boa Viagem', 'Casa Forte', 'Ibura', 'Santo Amaro', 'Afogados', 'Espinheiro', 'Várzea', 'Nova Descoberta', 'Imbiribeira', 'Graças', 'Água Fria', 'Boa Vista', 'Cohab'],
    4106902: ['Batel', 'Centro', 'Boqueirão', 'Cidade Industrial', 'Santa Felicidade', 'Água Verde', 'Sítio Cercado', 'Portão', 'Bairro Alto', 'Cajuru', 'Pinheirinho', 'Tatuquara', 'Cabral', 'Boa Vista'],
    4314902: ['Moinhos de Vento', 'Centro Histórico', 'Restinga', 'Sarandi', 'Rubem Berta', 'Menino Deus', 'Petrópolis', 'Partenon', 'Lomba do Pinheiro', 'Cidade Baixa', 'Bom Fim', 'Cristal', 'Belém Novo', 'Ipanema'],
    1302603: ['Adrianópolis', 'Cidade Nova', 'Centro', 'Ponta Negra', 'Compensa', 'Jorge Teixeira', 'São José Operário', 'Flores', 'Educandos', 'Tarumã', 'Colônia Terra Nova', 'Novo Aleixo', 'Parque Dez'],
    1501402: ['Nazaré', 'Umarizal', 'Batista Campos', 'Marco', 'Guamá', 'Jurunas', 'Pedreira', 'Terra Firme', 'Icoaraci', 'Cidade Velha', 'Sacramenta', 'Marambaia', 'Mosqueiro'],
    5208707: ['Setor Bueno', 'Setor Marista', 'Centro', 'Setor Oeste', 'Jardim América', 'Campinas', 'Vila Nova', 'Jardim Novo Mundo', 'Pedro Ludovico', 'Jardim Curitiba', 'Parque Atheneu', 'Setor Universitário', 'Vila Mutirão'],
    2111300: ['Centro Histórico', 'Renascença', 'Cohama', 'Calhau', 'Anjo da Guarda', 'Cidade Operária', 'Turu', 'Coroadinho', 'Ponta d’Areia', 'Vila Embratel', 'João Paulo', 'Liberdade'],
    2704302: ['Ponta Verde', 'Pajuçara', 'Jatiúca', 'Benedito Bentes', 'Tabuleiro do Martins', 'Farol', 'Jacintinho', 'Centro', 'Cidade Universitária', 'Serraria', 'Vergel do Lago', 'Cruz das Almas'],
    2408102: ['Ponta Negra', 'Tirol', 'Petrópolis', 'Alecrim', 'Lagoa Nova', 'Felipe Camarão', 'N. S. da Apresentação', 'Potengi', 'Capim Macio', 'Cidade da Esperança', 'Rocas', 'Redinha'],
    2507507: ['Manaíra', 'Tambaú', 'Cabo Branco', 'Centro', 'Mangabeira', 'Bancários', 'Cruz das Armas', 'Valentina', 'Bessa', 'Torre', 'Cristo Redentor', 'Altiplano'],
    2211001: ['Centro', 'Jóquei', 'Fátima', 'Dirceu Arcoverde', 'Mocambinho', 'Pedra Mole', 'Ilhotas', 'Santa Maria da Codipi', 'São Cristóvão', 'Angelim', 'Itararé', 'Satélite'],
    2800308: ['Atalaia', 'Jardins', 'Centro', 'Siqueira Campos', 'Santos Dumont', 'Farolândia', 'Grageru', '13 de Julho', 'Bugio', 'Santa Maria', 'Coroa do Meio', 'Luzia'],
    5103403: ['Centro', 'Goiabeiras', 'Jardim das Américas', 'CPA', 'Coxipó', 'Porto', 'Pedra 90', 'Bosque da Saúde', 'Morada do Ouro', 'Santa Rosa', 'Tijucal', 'Jardim Itália'],
    5002704: ['Centro', 'Jardim dos Estados', 'Coronel Antonino', 'Moreninha', 'Tiradentes', 'Aero Rancho', 'Guanandi', 'Vila Planalto', 'Carandá Bosque', 'Nova Lima', 'Santo Amaro', 'Monte Castelo'],
    3205309: ['Praia do Canto', 'Jardim Camburi', 'Centro', 'Jardim da Penha', 'Maruípe', 'São Pedro', 'Bento Ferreira', 'Santo Antônio', 'Enseada do Suá', 'Mata da Praia', 'Goiabeiras', 'Ilha do Príncipe'],
    4205407: ['Centro', 'Trindade', 'Lagoa da Conceição', 'Ingleses', 'Campeche', 'Canasvieiras', 'Estreito', 'Coqueiros', 'Saco dos Limões', 'Rio Vermelho', 'Agronômica', 'Capoeiras'],
    1100205: ['Centro', 'Embratel', 'Nova Porto Velho', 'Aponiã', 'Caladinho', 'Pedrinhas', 'Olaria', 'Tancredo Neves', 'Cohab', 'São João Bosco', 'Mariana', 'Lagoa'],
    1400100: ['Centro', 'Caçari', 'Pricumã', 'Liberdade', 'Cauamé', 'Senador Hélio Campos', 'Paraviana', 'Buritis', 'Pintolândia', 'São Vicente', 'Mecejana'],
    1600303: ['Centro', 'Trem', 'Buritizal', 'Jardim Equatorial', 'Novo Horizonte', 'Santa Rita', 'Laguinho', 'Pacoval', 'Perpétuo Socorro', 'Brasil Novo', 'Infraero'],
    1200401: ['Centro', 'Bosque', 'Cidade Nova', 'Tancredo Neves', 'Calafate', 'Estação Experimental', 'Floresta', 'Conjunto Universitário', 'Sobral', 'Vila Ivonete', 'Tucumã'],
    1721000: ['Plano Diretor Sul', 'Plano Diretor Norte', 'Taquaralto', 'Aureny III', 'Jardim Taquari', 'Centro', 'Graciosa', 'Lago Sul', 'Taquari', 'Santa Fé', 'Morada do Sol'],
    3509502: ['Cambuí', 'Centro', 'Barão Geraldo', 'Taquaral', 'Ouro Verde', 'Campo Grande', 'Jardim Proença', 'Vila Industrial', 'Sousas', 'Nova Campinas', 'Satélite Íris', 'Jardim Florence'],
    3518800: ['Centro', 'Vila Galvão', 'Pimentas', 'Bonsucesso', 'Cumbica', 'Taboão', 'Picanço', 'Macedo', 'Gopoúva', 'São João', 'Cabuçu', 'Jardim Maia'],
    'New York': ['Manhattan Midtown', 'Harlem', 'Upper East Side', 'Brooklyn Heights', 'Williamsburg', 'Bushwick', 'Queens – Astoria', 'Flushing', 'Jamaica', 'The Bronx – South', 'Riverdale', 'Staten Island', 'Lower East Side', 'Bed-Stuy'],
    'London': ['Westminster', 'Camden', 'Hackney', 'Croydon', 'Tower Hamlets', 'Brent', 'Ealing', 'Islington', 'Lambeth', 'Southwark', 'Newham', 'Barnet', 'Kensington', 'Lewisham'],
    'Paris': ['1er – Louvre', 'Le Marais', 'Quartier Latin', 'Saint-Germain', 'Montmartre', 'Belleville', 'La Villette', 'Bastille', 'Montparnasse', 'Passy', 'Batignolles', 'Bercy', 'La Chapelle', 'Ménilmontant'],
    'Madrid': ['Centro', 'Salamanca', 'Chamberí', 'Retiro', 'Vallecas', 'Carabanchel', 'Tetuán', 'Usera', 'Moncloa', 'Chamartín', 'Latina', 'Hortaleza', 'Villaverde', 'Arganzuela'],
    'Buenos Aires': ['Palermo', 'Recoleta', 'La Boca', 'San Telmo', 'Belgrano', 'Caballito', 'Flores', 'Villa Lugano', 'Mataderos', 'Almagro', 'Núñez', 'Barracas', 'Balvanera', 'Villa Urquiza'],
    'Ciudad de México': ['Iztapalapa', 'Coyoacán', 'Benito Juárez', 'Cuauhtémoc', 'Gustavo A. Madero', 'Tlalpan', 'Álvaro Obregón', 'Miguel Hidalgo', 'Xochimilco', 'Azcapotzalco', 'Venustiano Carranza', 'Tláhuac', 'Iztacalco', 'Magdalena Contreras'],
    'Lisboa': ['Belém', 'Alvalade', 'Benfica', 'Lumiar', 'Olivais', 'Arroios', 'Misericórdia', 'Santa Maria Maior', 'Estrela', 'Marvila', 'Campo de Ourique', 'Parque das Nações'],
    'Barcelona': ['Ciutat Vella', 'Eixample', 'Sants-Montjuïc', 'Les Corts', 'Sarrià-Sant Gervasi', 'Gràcia', 'Horta-Guinardó', 'Nou Barris', 'Sant Andreu', 'Sant Martí'],
    'Los Angeles': ['Downtown', 'Hollywood', 'Koreatown', 'Venice', 'Boyle Heights', 'South LA', 'Echo Park', 'Westwood', 'San Fernando Valley', 'Watts', 'Silver Lake', 'Highland Park'],
  };
  K.BAIRRO_GEN = {
    br: { pre: ['Jardim', 'Vila', 'Parque', 'Conjunto', 'Residencial', 'Alto', 'Bairro', 'Jardim', 'Vila'], suf: ['São José', 'Santa Luzia', 'Esperança', 'Primavera', 'das Flores', 'Bela Vista', 'Boa Vista', 'Santo Antônio', 'Novo Horizonte', 'Aeroporto', 'Universitário', 'dos Pássaros', 'Ipê', 'Planalto', 'Santa Rita', 'Aparecida', 'Liberdade', 'Paraíso', 'do Lago', 'Cidade Nova', 'São Pedro', 'Morada do Sol', 'Tropical', 'Monte Verde', 'Santa Cruz', 'Progresso', 'Alvorada', 'Redenção', 'Bom Jesus', 'Industrial', 'das Palmeiras', 'Santa Mônica'], fixed: ['Centro'], rural: 'Zona Rural' },
    en: { pre: [''], suf: ['Downtown', 'Midtown', 'Riverside', 'Westside', 'Eastside', 'North End', 'South Park', 'Oak Hill', 'Maple Heights', 'Lakeview', 'Cedar Grove', 'Harbor District', 'University District', 'Old Town', 'Pine Ridge', 'Brookside', 'Fairview', 'Hillcrest', 'Elmwood', 'Union Square'], fixed: [], rural: 'Rural County' },
    es: { pre: [''], suf: ['Centro', 'Barrio Norte', 'San José', 'Villa Nueva', 'Las Flores', 'La Esperanza', 'San Martín', 'El Prado', 'Santa Rosa', 'Los Pinos', 'La Paz', 'San Miguel', 'El Mirador', 'Las Palmas', 'Villa del Parque', 'Barrio Sur', 'La Loma', 'El Carmen', 'San Vicente', 'Los Olivos'], fixed: [], rural: 'Zona Rural' },
    pt: { pre: [''], suf: ['Baixa', 'Centro Histórico', 'São Vicente', 'Santa Clara', 'Sé', 'Santo António', 'São João', 'Nossa Senhora', 'Bairro Alto', 'Vila Nova', 'Quinta do Conde', 'Pinhal', 'Ribeira', 'Areeiro', 'Monte', 'São Pedro', 'Senhora da Hora', 'Olival'], fixed: [], rural: 'Freguesias Rurais' },
    fr: { pre: [''], suf: ['Centre-Ville', 'Vieux Port', 'Quartier de la Gare', 'Saint-Michel', 'Les Halles', 'Croix-Rousse', 'Bastide', 'Saint-Pierre', 'La Guillotière', 'Les Chartrons', 'Faubourg', 'Saint-Jean', 'Les Pins', 'Le Port', 'La Madeleine', 'Beaulieu', 'Sainte-Anne'], fixed: [], rural: 'Communes Rurales' },
    gb: { pre: [''], suf: ['City Centre', 'Northside', 'Southbank', 'Old Town', 'Westgate', 'Eastfield', 'Kingsway', 'Riverside', 'Hillside', 'Abbey', 'Castle', 'Harbourside', 'Meadowbank', 'Parkside', 'St Mary’s', 'Newtown', 'Victoria'], fixed: [], rural: 'Rural Wards' },
  };

  // ---------- Geradores de nomes ----------
  K.NAMES = {
    br: {
      m: ['João', 'José', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Pedro', 'Lucas', 'Marcos', 'Luiz', 'Gabriel', 'Rafael', 'Daniel', 'Marcelo', 'Bruno', 'Eduardo', 'Felipe', 'Rodrigo', 'Fernando', 'Gustavo', 'Ricardo', 'André', 'Sérgio', 'Fábio', 'Márcio', 'Roberto', 'Alexandre', 'Thiago', 'Leandro', 'Vinícius', 'Diego', 'Renato', 'Wagner', 'Edson', 'Cláudio', 'Júlio', 'Mateus', 'Henrique', 'Otávio', 'Sebastião'],
      f: ['Maria', 'Ana', 'Francisca', 'Antônia', 'Adriana', 'Juliana', 'Márcia', 'Fernanda', 'Patrícia', 'Aline', 'Camila', 'Amanda', 'Bruna', 'Jéssica', 'Letícia', 'Júlia', 'Luciana', 'Vanessa', 'Mariana', 'Gabriela', 'Larissa', 'Débora', 'Cristina', 'Simone', 'Renata', 'Sandra', 'Raquel', 'Priscila', 'Tatiane', 'Beatriz', 'Carla', 'Helena', 'Rosângela', 'Kátia', 'Elaine'],
      s: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Ramos', 'Gonçalves', 'Santana', 'Teixeira', 'Araújo', 'Moura', 'Cavalcanti', 'Batista', 'Campos', 'Monteiro', 'Pires'],
      tm: ['Professor', 'Dr.', 'Pastor', 'Delegado', 'Sargento', 'Capitão', 'Tio', 'Irmão', 'Coronel', 'Mestre'],
      tf: ['Professora', 'Dra.', 'Pastora', 'Delegada', 'Tia', 'Irmã', 'Enfermeira', 'Dona', 'Mestra'],
      nick: ['da Saúde', 'do Povo', 'da Educação', 'do Esporte', 'da Comunidade', 'do Bairro', 'da Feira'],
    },
    us: {
      m: ['James', 'John', 'Robert', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven', 'Andrew', 'Joshua', 'Kevin', 'Brian', 'Ryan', 'Tyler', 'Marcus', 'Jamal', 'Luis', 'Carlos'],
      f: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Emily', 'Michelle', 'Amanda', 'Melissa', 'Stephanie', 'Rebecca', 'Laura', 'Rachel', 'Maria', 'Keisha', 'Ashley'],
      s: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Carter', 'Mitchell', 'Roberts', 'Turner', 'Murphy', "O'Brien", 'Sullivan', 'Kim', 'Patel'],
    },
    es: {
      m: ['José', 'Juan', 'Carlos', 'Luis', 'Jorge', 'Miguel', 'Javier', 'Alejandro', 'Diego', 'Fernando', 'Pablo', 'Sergio', 'Andrés', 'Ricardo', 'Raúl', 'Martín', 'Gustavo', 'Eduardo', 'Manuel', 'Francisco', 'Héctor', 'Roberto'],
      f: ['María', 'Ana', 'Laura', 'Carmen', 'Lucía', 'Sofía', 'Paula', 'Elena', 'Marta', 'Isabel', 'Gabriela', 'Valeria', 'Daniela', 'Patricia', 'Claudia', 'Verónica', 'Mariana', 'Rocío', 'Silvia', 'Natalia'],
      s: ['García', 'Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez', 'Romero', 'Torres', 'Ramírez', 'Flores', 'Castro', 'Vargas', 'Rojas', 'Herrera', 'Medina', 'Aguilar', 'Ortiz', 'Morales', 'Navarro', 'Domínguez', 'Vega', 'Ríos', 'Suárez'],
    },
    pt: {
      m: ['João', 'José', 'António', 'Manuel', 'Francisco', 'Pedro', 'Luís', 'Rui', 'Miguel', 'Tiago', 'Nuno', 'Ricardo', 'Paulo', 'Carlos', 'Jorge', 'Hugo', 'Bruno', 'Duarte', 'Gonçalo', 'Diogo'],
      f: ['Maria', 'Ana', 'Inês', 'Joana', 'Sofia', 'Catarina', 'Marta', 'Rita', 'Teresa', 'Beatriz', 'Carla', 'Patrícia', 'Sara', 'Helena', 'Mariana', 'Filipa', 'Leonor', 'Cláudia'],
      s: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Soares', 'Vieira', 'Monteiro', 'Cardoso', 'Rocha'],
    },
    fr: {
      m: ['Jean', 'Pierre', 'Michel', 'Philippe', 'Alain', 'Nicolas', 'François', 'Thomas', 'Julien', 'Laurent', 'Antoine', 'Sébastien', 'Olivier', 'Mathieu', 'Hugo', 'Louis', 'Karim', 'Mehdi', 'Yannick', 'Benoît'],
      f: ['Marie', 'Nathalie', 'Isabelle', 'Sylvie', 'Catherine', 'Sophie', 'Camille', 'Julie', 'Claire', 'Léa', 'Manon', 'Chloé', 'Émilie', 'Sandrine', 'Valérie', 'Aurélie', 'Inès', 'Fatima', 'Céline', 'Pauline'],
      s: ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Faure', 'Mercier', 'Blanc', 'Guérin', 'Garnier'],
    },
    gb: {
      m: ['Oliver', 'George', 'Harry', 'Jack', 'Charlie', 'Thomas', 'James', 'William', 'Daniel', 'Samuel', 'David', 'Richard', 'Andrew', 'Paul', 'Mark', 'Simon', 'Rishi', 'Mohammed', 'Callum', 'Rhys', 'Liam'],
      f: ['Olivia', 'Amelia', 'Isla', 'Emily', 'Sophie', 'Jessica', 'Charlotte', 'Lucy', 'Hannah', 'Rachel', 'Sarah', 'Victoria', 'Helen', 'Emma', 'Priya', 'Fiona', 'Siobhan', 'Catherine', 'Grace', 'Bethany'],
      s: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright', 'Thompson', 'Evans', 'Walker', 'White', 'Roberts', 'Green', 'Hall', 'Wood', 'Jackson', 'Clarke', 'Patel', 'Khan', 'Hughes', 'Edwards', 'Turner', 'Hill', 'Ward', 'Morris', 'Baker', 'Harris', 'Cooper', 'King', 'Lewis', 'Campbell', 'MacDonald', 'Murray', "O'Neill", 'Kelly'],
    },
  };
})();
