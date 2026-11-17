/* Configuração dos países: regiões, cargos, sistemas eleitorais, partidos e políticos reais.
   Políticos reais: dados simplificados e neutros (todos com atributos base iguais);
   partidos iniciais podem estar desatualizados e podem ser trocados no jogo. */
(function () {
  const C = (window.COUNTRIES = {});
  // avatar: g gênero, sk tom de pele (0-5), hs cabelo, hc cor cabelo, bd barba, gl óculos, oc roupa, tc gravata/detalhe, ot tipo
  const HC = { black: '#1f1a17', dbrown: '#3b2a20', brown: '#6b4a2f', lbrown: '#8d6a45', blonde: '#d8b26a', red: '#a5482a', gray: '#9ca3af', white: '#e5e7eb', salt: '#6b7280' };
  const A = (g, sk, hs, hc, bd = 'none', gl = false, oc = '#1e293b', tc = '#b91c1c', ot = 'suit') => ({ g, sk, hs, hc: HC[hc] || hc, bd, bc: HC[hc] || hc, gl, oc, tc, ot });
  const REAL_ATTRS = (exp) => ({ car: 70, ora: 70, int: 70, intg: 60, art: 55 + exp * 6 });
  const P = (id, name, color, e, s, size, num, extra = {}) => Object.assign({ id, name, color, e, s, size, num }, extra);
  const R = (id, name, party, birth, fame, held, home, av, bio) => ({ id, name, party, birth, fame, held, home, av, bio, attrs: REAL_ATTRS(held.length) });

  // ======================= BRASIL =======================
  const brReg = {};
  [
    ['AC', 'Acre', 0.35, 0.35, 0.4, 0.65, 8], ['AL', 'Alagoas', -0.3, 0.2, 0.33, 0.6, 9], ['AP', 'Amapá', 0, 0.3, 0.4, 0.65, 8],
    ['AM', 'Amazonas', 0.05, 0.35, 0.45, 0.65, 8], ['BA', 'Bahia', -0.45, 0.1, 0.4, 0.55, 39], ['CE', 'Ceará', -0.4, 0.15, 0.38, 0.6, 22],
    ['DF', 'Distrito Federal', 0.15, 0.1, 0.85, 0.5, 8], ['ES', 'Espírito Santo', 0.2, 0.3, 0.6, 0.55, 10], ['GO', 'Goiás', 0.35, 0.35, 0.55, 0.6, 17],
    ['MA', 'Maranhão', -0.45, 0.15, 0.3, 0.6, 18], ['MT', 'Mato Grosso', 0.45, 0.35, 0.65, 0.6, 8], ['MS', 'Mato Grosso do Sul', 0.35, 0.3, 0.6, 0.6, 8],
    ['MG', 'Minas Gerais', 0.05, 0.2, 0.55, 0.55, 53], ['PA', 'Pará', -0.1, 0.3, 0.4, 0.65, 17], ['PB', 'Paraíba', -0.35, 0.15, 0.38, 0.6, 12],
    ['PR', 'Paraná', 0.35, 0.3, 0.65, 0.5, 30], ['PE', 'Pernambuco', -0.45, 0.15, 0.4, 0.58, 25], ['PI', 'Piauí', -0.5, 0.15, 0.35, 0.6, 10],
    ['RJ', 'Rio de Janeiro', 0.2, 0.2, 0.65, 0.55, 46], ['RN', 'Rio Grande do Norte', -0.3, 0.15, 0.42, 0.58, 8], ['RS', 'Rio Grande do Sul', 0.15, 0.05, 0.65, 0.45, 31],
    ['RO', 'Rondônia', 0.45, 0.4, 0.5, 0.65, 8], ['RR', 'Roraima', 0.5, 0.4, 0.45, 0.65, 8], ['SC', 'Santa Catarina', 0.45, 0.3, 0.7, 0.5, 16],
    ['SP', 'São Paulo', 0.15, 0.05, 0.75, 0.5, 70], ['SE', 'Sergipe', -0.3, 0.15, 0.4, 0.58, 8], ['TO', 'Tocantins', 0.15, 0.3, 0.45, 0.6, 8],
  ].forEach(([id, n, e, s, inc, rel, fed]) => (brReg[id] = { id, n, lean: [e, s], inc, rel, fed, seats: fed }));

  const brVereadores = (pop) => {
    const t = [[15e3, 9], [30e3, 11], [50e3, 13], [80e3, 15], [120e3, 17], [160e3, 19], [300e3, 21], [450e3, 23], [600e3, 25], [750e3, 27], [900e3, 29], [1.05e6, 31], [1.2e6, 33], [1.35e6, 35], [1.5e6, 37], [1.8e6, 39], [2.4e6, 41], [3e6, 43], [4e6, 45], [5e6, 47], [6e6, 49], [7e6, 51], [8e6, 53]];
    for (const [lim, s] of t) if (pop <= lim) return s;
    return 55;
  };
  const councilSeats = (pop) => Math.max(7, Math.min(65, Math.round(5 + 3.2 * Math.log2(Math.max(pop, 5000) / 5000))));

  C.BR = {
    id: 'BR', name: 'Brasil', flag: 'br', cur: 'R$', costMult: 1, accent: '#22c55e', accent2: '#facc15',
    desc: 'Urna eletrônica, voto obrigatório, dois turnos e eleição proporcional com quociente eleitoral.',
    tags: ['Urna eletrônica', '2 turnos', 'Quociente eleitoral', 'Horário eleitoral'],
    elecRatio: 0.76, turnout: 0.79, voting: 'urna', tvFree: true, names: 'br', bairroLang: 'br',
    regionLabel: 'Estado', regionsLabel: 'Estados', cityLabel: 'Município', capital: 'Brasília',
    regions: brReg,
    noLegCoalition: true,
    offices: [
      { id: 'vereador', name: 'Vereador(a)', arena: 'city', sys: 'list_open', level: 1, minAge: 18, term: 4, every: 4, offset: 2028, digits: 5, kind: 'leg', scope: 'leg', seats: (a) => brVereadores(a.pop), house: 'Câmara Municipal' },
      { id: 'prefeito', name: 'Prefeito(a)', arena: 'city', sys: 'majority', runoff: 'br', level: 1, minAge: 21, term: 4, every: 4, offset: 2028, digits: 2, kind: 'exec', scope: 'exec_local', vice: 'Vice-prefeito(a)', maxConsec: 2 },
      { id: 'dep_estadual', name: 'Deputado(a) Estadual', arena: 'state', sys: 'list_open', level: 2, minAge: 21, term: 4, every: 4, offset: 2030, digits: 5, kind: 'leg', scope: 'leg', seats: (a) => { const f = brReg[a.region].fed; return f <= 12 ? 3 * f : 36 + (f - 12); }, house: 'Assembleia Legislativa', req: { any: ['vereador', 'prefeito'], fame: 10, alt: 30 } },
      { id: 'dep_federal', name: 'Deputado(a) Federal', arena: 'state', sys: 'list_open', level: 3, minAge: 21, term: 4, every: 4, offset: 2030, digits: 4, kind: 'leg', scope: 'leg', seats: (a) => brReg[a.region].fed, house: 'Câmara dos Deputados', req: { any: ['vereador', 'prefeito', 'dep_estadual'], fame: 20, alt: 40 } },
      { id: 'governador', name: 'Governador(a)', arena: 'state', sys: 'majority', runoff: 'br', level: 3, minAge: 30, term: 4, every: 4, offset: 2030, digits: 2, kind: 'exec', scope: 'exec_big', vice: 'Vice-governador(a)', maxConsec: 2, req: { any: ['prefeito', 'dep_estadual', 'dep_federal', 'senador'], fame: 35, alt: 60 } },
      { id: 'senador', name: 'Senador(a)', arena: 'state', sys: 'plurality', level: 4, minAge: 35, term: 8, every: 4, offset: 2030, digits: 3, kind: 'leg', scope: 'leg', seatsFn: (year) => ((year - 2026) % 8 === 0 ? 2 : 1), req: { any: ['dep_federal', 'governador', 'prefeito', 'dep_estadual'], fame: 40, alt: 65 } },
      { id: 'presidente', name: 'Presidente da República', arena: 'country', sys: 'majority', runoff: 'always', level: 5, minAge: 35, term: 4, every: 4, offset: 2030, digits: 2, kind: 'exec', scope: 'exec_big', vice: 'Vice-presidente', maxConsec: 2, top: true, req: { any: ['governador', 'senador', 'dep_federal', 'prefeito'], fame: 55, alt: 80 } },
    ],
    parties: [
      P('PT', 'Partido dos Trabalhadores', '#e11d48', -0.55, -0.25, 0.85, 13),
      P('PL', 'Partido Liberal', '#1e40af', 0.55, 0.75, 0.95, 22),
      P('UNIAO', 'União Brasil', '#0ea5e9', 0.45, 0.35, 0.75, 44),
      P('PP', 'Progressistas', '#38bdf8', 0.5, 0.45, 0.65, 11),
      P('MDB', 'Movimento Democrático Brasileiro', '#16a34a', 0.2, 0.15, 0.7, 15),
      P('PSD', 'Partido Social Democrático', '#f59e0b', 0.3, 0.2, 0.7, 55),
      P('REPUBLICANOS', 'Republicanos', '#0f766e', 0.45, 0.7, 0.6, 10),
      P('PSDB', 'Partido da Social Democracia Brasileira', '#3b82f6', 0.35, 0.0, 0.35, 45),
      P('PDT', 'Partido Democrático Trabalhista', '#b91c1c', -0.4, -0.05, 0.3, 12),
      P('PSB', 'Partido Socialista Brasileiro', '#eab308', -0.3, -0.2, 0.4, 40),
      P('PSOL', 'Partido Socialismo e Liberdade', '#a21caf', -0.85, -0.8, 0.3, 50),
      P('NOVO', 'Partido Novo', '#f97316', 0.85, 0.2, 0.2, 30),
      P('PODE', 'Podemos', '#22c55e', 0.3, 0.3, 0.3, 20),
      P('REDE', 'Rede Sustentabilidade', '#14b8a6', -0.3, -0.5, 0.12, 18),
      P('PCdoB', 'Partido Comunista do Brasil', '#dc2626', -0.8, -0.3, 0.15, 65),
      P('PV', 'Partido Verde', '#65a30d', -0.2, -0.4, 0.12, 43),
      P('SD', 'Solidariedade', '#fb923c', 0.0, 0.1, 0.15, 77),
      P('AVANTE', 'Avante', '#06b6d4', 0.2, 0.3, 0.15, 70),
      P('DC', 'Democracia Cristã', '#1d4ed8', 0.3, 0.8, 0.05, 27),
    ],
    real: [
      R('lula', 'Lula', 'PT', 1945, 98, ['presidente', 'dep_federal'], 3548708, A('m', 2, 'short', 'gray', 'full', false, '#1e293b', '#b91c1c'), 'Ex-metalúrgico e líder sindical do ABC paulista.'),
      R('haddad', 'Fernando Haddad', 'PT', 1963, 72, ['prefeito'], 3550308, A('m', 1, 'side', 'salt', 'none', false, '#334155', '#b91c1c'), 'Professor universitário, ex-prefeito de São Paulo.'),
      R('boulos', 'Guilherme Boulos', 'PSOL', 1982, 70, ['dep_federal'], 3550308, A('m', 1, 'short', 'dbrown', 'stubble', false, '#374151', '#a21caf', 'shirt'), 'Professor e ativista de movimentos de moradia.'),
      R('marina', 'Marina Silva', 'REDE', 1958, 75, ['senador', 'vereador', 'dep_estadual'], 1200401, A('f', 3, 'bun', 'dbrown', 'none', false, '#14532d', '#14b8a6', 'blazer'), 'Ambientalista nascida no Acre, ex-senadora.'),
      R('tabata', 'Tabata Amaral', 'PSB', 1993, 50, ['dep_federal'], 3550308, A('f', 1, 'long', 'black', 'none', false, '#1e3a8a', '#eab308', 'blazer'), 'Cientista política e ativista da educação.'),
      R('tebet', 'Simone Tebet', 'MDB', 1970, 62, ['senador', 'prefeito', 'dep_estadual'], 5008305, A('f', 1, 'bob', 'dbrown', 'none', false, '#14532d', '#16a34a', 'blazer'), 'Professora de direito, ex-prefeita de Três Lagoas.'),
      R('ratinho', 'Ratinho Júnior', 'PSD', 1981, 60, ['governador', 'dep_federal', 'dep_estadual'], 4106902, A('m', 1, 'short', 'black', 'none', false, '#1e293b', '#f59e0b'), 'Empresário e político paranaense.'),
      R('tarcisio', 'Tarcísio de Freitas', 'REPUBLICANOS', 1975, 80, ['governador'], 3550308, A('m', 1, 'buzz', 'black', 'none', false, '#0f172a', '#0f766e'), 'Engenheiro militar, governa São Paulo desde 2023.'),
      R('zema', 'Romeu Zema', 'NOVO', 1964, 65, ['governador'], 3104007, A('m', 0, 'side', 'white', 'none', true, '#1e293b', '#f97316'), 'Empresário mineiro, ex-governador de MG.'),
      R('michelle', 'Michelle Bolsonaro', 'PL', 1982, 82, [], 5300108, A('f', 1, 'long', 'lbrown', 'none', false, '#1e3a8a', '#facc15', 'blazer'), 'Ex-primeira-dama e líder do PL Mulher.'),
      R('nikolas', 'Nikolas Ferreira', 'PL', 1996, 70, ['dep_federal', 'vereador'], 3106200, A('m', 0, 'side', 'lbrown', 'none', false, '#0f172a', '#1e40af'), 'Deputado federal mineiro, forte nas redes.'),
    ],
  };

  // ======================= ESTADOS UNIDOS =======================
  const usReg = {};
  [
    ['AL', 'Alabama', 5.02, 9, 15, 0.35, 0.85], ['AK', 'Alaska', 0.73, 3, 8, 0.6, 0.5], ['AZ', 'Arizona', 7.15, 11, 2, 0.5, 0.55], ['AR', 'Arkansas', 3.01, 6, 16, 0.3, 0.85],
    ['CA', 'California', 39.54, 54, -13, 0.75, 0.4], ['CO', 'Colorado', 5.77, 10, -4, 0.7, 0.45], ['CT', 'Connecticut', 3.61, 7, -7, 0.8, 0.45], ['DE', 'Delaware', 0.99, 3, -7, 0.6, 0.5],
    ['DC', 'District of Columbia', 0.69, 3, -43, 0.85, 0.4], ['FL', 'Florida', 21.54, 30, 3, 0.55, 0.6], ['GA', 'Georgia', 10.71, 16, 3, 0.5, 0.75], ['HI', 'Hawaii', 1.46, 4, -14, 0.65, 0.45],
    ['ID', 'Idaho', 1.84, 4, 18, 0.45, 0.7], ['IL', 'Illinois', 12.81, 19, -7, 0.65, 0.5], ['IN', 'Indiana', 6.79, 11, 11, 0.45, 0.7], ['IA', 'Iowa', 3.19, 6, 6, 0.5, 0.6],
    ['KS', 'Kansas', 2.94, 6, 10, 0.5, 0.7], ['KY', 'Kentucky', 4.51, 8, 16, 0.35, 0.8], ['LA', 'Louisiana', 4.66, 8, 12, 0.35, 0.8], ['ME', 'Maine', 1.36, 4, -2, 0.5, 0.4],
    ['MD', 'Maryland', 6.18, 10, -14, 0.8, 0.55], ['MA', 'Massachusetts', 7.03, 11, -15, 0.85, 0.35], ['MI', 'Michigan', 10.08, 15, 1, 0.5, 0.55], ['MN', 'Minnesota', 5.71, 10, -1, 0.65, 0.5],
    ['MS', 'Mississippi', 2.96, 6, 11, 0.25, 0.9], ['MO', 'Missouri', 6.15, 10, 10, 0.45, 0.7], ['MT', 'Montana', 1.08, 4, 11, 0.45, 0.6], ['NE', 'Nebraska', 1.96, 5, 13, 0.55, 0.65],
    ['NV', 'Nevada', 3.1, 6, 1, 0.5, 0.45], ['NH', 'New Hampshire', 1.38, 4, -1, 0.7, 0.35], ['NJ', 'New Jersey', 9.29, 14, -6, 0.8, 0.5], ['NM', 'New Mexico', 2.12, 5, -3, 0.35, 0.55],
    ['NY', 'New York', 20.2, 28, -10, 0.75, 0.45], ['NC', 'North Carolina', 10.44, 16, 3, 0.5, 0.7], ['ND', 'North Dakota', 0.78, 3, 20, 0.55, 0.65], ['OH', 'Ohio', 11.8, 17, 6, 0.5, 0.6],
    ['OK', 'Oklahoma', 3.96, 7, 20, 0.4, 0.85], ['OR', 'Oregon', 4.24, 8, -6, 0.6, 0.35], ['PA', 'Pennsylvania', 13.0, 19, 2, 0.55, 0.55], ['RI', 'Rhode Island', 1.1, 4, -8, 0.6, 0.45],
    ['SC', 'South Carolina', 5.12, 9, 8, 0.4, 0.8], ['SD', 'South Dakota', 0.89, 3, 16, 0.5, 0.65], ['TN', 'Tennessee', 6.91, 11, 14, 0.45, 0.8], ['TX', 'Texas', 29.15, 40, 5, 0.55, 0.7],
    ['UT', 'Utah', 3.27, 6, 13, 0.55, 0.85], ['VT', 'Vermont', 0.64, 3, -16, 0.55, 0.3], ['VA', 'Virginia', 8.63, 13, -3, 0.7, 0.6], ['WA', 'Washington', 7.71, 12, -8, 0.75, 0.35],
    ['WV', 'West Virginia', 1.79, 4, 22, 0.3, 0.75], ['WI', 'Wisconsin', 5.89, 10, 2, 0.55, 0.5], ['WY', 'Wyoming', 0.58, 3, 25, 0.55, 0.65],
  ].forEach(([id, n, pop, ev, pvi, inc, rel]) => (usReg[id] = { id, n, pop: pop * 1e6, ev, lean: [Math.max(-1, Math.min(1, pvi / 32)), Math.max(-1, Math.min(1, pvi / 28))], inc, rel }));
  C.US = {
    id: 'US', name: 'Estados Unidos', flag: 'us', cur: 'US$', costMult: 1.2, accent: '#3b82f6', accent2: '#ef4444',
    desc: 'Primárias partidárias, sistema bipartidário e Colégio Eleitoral: 270 delegados para chegar à Casa Branca.',
    tags: ['Primárias', 'Colégio Eleitoral', 'Voto facultativo', 'Anúncios pagos'],
    elecRatio: 0.72, turnout: 0.62, voting: 'paper', tvFree: false, names: 'us', bairroLang: 'en',
    regionLabel: 'Estado', regionsLabel: 'Estados', cityLabel: 'Cidade', capital: 'Washington, D.C.',
    regions: usReg,
    offices: [
      { id: 'council', name: 'Vereador(a) (City Council)', arena: 'city', sys: 'plurality', seats: 1, level: 1, minAge: 18, term: 4, every: 2, offset: 2028, kind: 'leg', scope: 'leg', nonpartisan: true },
      { id: 'mayor', name: 'Prefeito(a) (Mayor)', arena: 'city', sys: 'plurality', level: 1, minAge: 18, term: 4, every: 2, offset: 2028, kind: 'exec', scope: 'exec_local', nonpartisan: true },
      { id: 'state_rep', name: 'Deputado(a) Estadual (State House)', arena: 'district', distPop: 120000, sys: 'plurality', primary: true, level: 2, minAge: 21, term: 2, every: 2, offset: 2028, kind: 'leg', scope: 'leg', req: { any: ['council', 'mayor'], fame: 10, alt: 30 } },
      { id: 'us_rep', name: 'Deputado(a) Federal (U.S. House)', arena: 'district', distPop: 760000, sys: 'plurality', primary: true, level: 3, minAge: 25, term: 2, every: 2, offset: 2028, kind: 'leg', scope: 'leg', req: { any: ['council', 'mayor', 'state_rep'], fame: 20, alt: 40 } },
      { id: 'governor', name: 'Governador(a)', arena: 'state', sys: 'plurality', primary: true, level: 3, minAge: 30, term: 4, every: 2, offset: 2028, kind: 'exec', scope: 'exec_big', req: { any: ['mayor', 'state_rep', 'us_rep', 'senator'], fame: 35, alt: 60 } },
      { id: 'senator', name: 'Senador(a)', arena: 'state', sys: 'plurality', primary: true, level: 4, minAge: 30, term: 6, every: 2, offset: 2028, kind: 'leg', scope: 'leg', req: { any: ['us_rep', 'governor', 'mayor', 'state_rep'], fame: 40, alt: 65 } },
      { id: 'president', name: 'Presidente dos EUA', arena: 'country', sys: 'college', primary: true, level: 5, minAge: 35, term: 4, every: 4, offset: 2028, kind: 'exec', scope: 'exec_big', vice: 'Vice-presidente', maxTotal: 2, top: true, req: { any: ['governor', 'senator', 'us_rep'], fame: 55, alt: 80 } },
    ],
    parties: [
      P('DEM', 'Partido Democrata', '#2563eb', -0.4, -0.5, 1, 0, { major: true }),
      P('GOP', 'Partido Republicano', '#dc2626', 0.55, 0.6, 1, 0, { major: true }),
      P('LIB', 'Partido Libertário', '#eab308', 0.9, -0.3, 0.08, 0),
      P('GRN', 'Partido Verde', '#16a34a', -0.8, -0.7, 0.05, 0),
      P('FWD', 'Forward Party', '#8b5cf6', 0.0, -0.1, 0.04, 0),
    ],
    cities: [
      ['New York', 'NY', 8.34e6], ['Los Angeles', 'CA', 3.82e6], ['Chicago', 'IL', 2.66e6], ['Houston', 'TX', 2.31e6], ['Phoenix', 'AZ', 1.65e6], ['Philadelphia', 'PA', 1.57e6],
      ['San Antonio', 'TX', 1.5e6], ['San Diego', 'CA', 1.39e6], ['Dallas', 'TX', 1.3e6], ['Jacksonville', 'FL', 0.99e6], ['Austin', 'TX', 0.98e6], ['Columbus', 'OH', 0.91e6],
      ['Charlotte', 'NC', 0.9e6], ['San Francisco', 'CA', 0.81e6], ['Seattle', 'WA', 0.76e6], ['Denver', 'CO', 0.72e6], ['Nashville', 'TN', 0.69e6], ['Las Vegas', 'NV', 0.66e6],
      ['Boston', 'MA', 0.65e6], ['Detroit', 'MI', 0.63e6], ['Portland', 'OR', 0.63e6], ['Milwaukee', 'WI', 0.56e6], ['Atlanta', 'GA', 0.51e6], ['Miami', 'FL', 0.45e6],
      ['Pittsburgh', 'PA', 0.3e6], ['Boise', 'ID', 0.24e6], ['Charleston', 'SC', 0.15e6], ['Springfield', 'IL', 0.11e6], ['Cheyenne', 'WY', 0.065e6], ['Burlington', 'VT', 0.045e6],
      ['Anchorage', 'AK', 0.29e6], ['Honolulu', 'HI', 0.35e6], ['Salt Lake City', 'UT', 0.2e6], ['Des Moines', 'IA', 0.21e6], ['Birmingham', 'AL', 0.2e6], ['Dover', 'DE', 0.039e6],
    ],
    real: [
      R('trump', 'Donald Trump', 'GOP', 1946, 99, ['president'], 'New York', A('m', 0, 'side', 'blonde', 'none', false, '#0f172a', '#dc2626'), 'Empresário e apresentador; presidente em dois mandatos.'),
      R('vance', 'JD Vance', 'GOP', 1984, 75, ['senator'], 'Columbus', A('m', 0, 'side', 'dbrown', 'full', false, '#0f172a', '#dc2626'), 'Escritor e ex-senador por Ohio.'),
      R('desantis', 'Ron DeSantis', 'GOP', 1978, 70, ['governor', 'us_rep'], 'Jacksonville', A('m', 0, 'short', 'black', 'none', false, '#1e293b', '#dc2626'), 'Ex-militar da Marinha, governador da Flórida.'),
      R('haley', 'Nikki Haley', 'GOP', 1972, 62, ['governor', 'state_rep'], 'Charleston', A('f', 2, 'long', 'black', 'none', false, '#7f1d1d', '#dc2626', 'blazer'), 'Ex-governadora da Carolina do Sul.'),
      R('newsom', 'Gavin Newsom', 'DEM', 1967, 74, ['governor', 'mayor'], 'San Francisco', A('m', 0, 'side', 'salt', 'none', false, '#1e293b', '#2563eb'), 'Ex-prefeito de São Francisco, governador da Califórnia.'),
      R('aoc', 'Alexandria Ocasio-Cortez', 'DEM', 1989, 76, ['us_rep'], 'New York', A('f', 2, 'long', 'dbrown', 'none', false, '#1e293b', '#dc2626', 'blazer'), 'Deputada federal por Nova York.'),
      R('harris', 'Kamala Harris', 'DEM', 1964, 85, ['senator'], 'Los Angeles', A('f', 3, 'bob', 'black', 'none', false, '#1e293b', '#2563eb', 'blazer'), 'Ex-promotora e ex-vice-presidente.'),
      R('shapiro', 'Josh Shapiro', 'DEM', 1973, 58, ['governor'], 'Philadelphia', A('m', 0, 'short', 'dbrown', 'none', false, '#1e293b', '#2563eb'), 'Governador da Pensilvânia.'),
    ],
  };

  // ======================= ARGENTINA =======================
  const arReg = {};
  [
    ['AR-B', 'Buenos Aires', 17.52, -0.1, 0.15, 0.5, 0.45, 70], ['AR-C', 'Ciudad de Buenos Aires', 3.12, 0.3, -0.25, 0.8, 0.35, 25], ['AR-X', 'Córdoba', 3.84, 0.4, 0.25, 0.6, 0.5, 18],
    ['AR-S', 'Santa Fe', 3.54, 0.15, 0.15, 0.6, 0.5, 19], ['AR-M', 'Mendoza', 2.04, 0.35, 0.25, 0.55, 0.5, 10], ['AR-T', 'Tucumán', 1.73, -0.1, 0.3, 0.4, 0.6, 9],
    ['AR-A', 'Salta', 1.44, 0.05, 0.35, 0.4, 0.65, 7], ['AR-E', 'Entre Ríos', 1.43, 0.15, 0.25, 0.5, 0.55, 9], ['AR-N', 'Misiones', 1.28, 0.0, 0.3, 0.4, 0.6, 7],
    ['AR-H', 'Chaco', 1.13, -0.2, 0.3, 0.35, 0.6, 7], ['AR-W', 'Corrientes', 1.21, 0.1, 0.35, 0.4, 0.6, 7], ['AR-G', 'Santiago del Estero', 1.06, -0.45, 0.35, 0.3, 0.65, 7],
    ['AR-J', 'San Juan', 0.82, 0.15, 0.3, 0.45, 0.6, 6], ['AR-Y', 'Jujuy', 0.81, 0.0, 0.3, 0.35, 0.6, 6], ['AR-R', 'Río Negro', 0.76, 0.1, 0.1, 0.5, 0.45, 5],
    ['AR-Q', 'Neuquén', 0.71, 0.2, 0.1, 0.6, 0.45, 5], ['AR-P', 'Formosa', 0.61, -0.4, 0.3, 0.3, 0.6, 5], ['AR-U', 'Chubut', 0.6, 0.1, 0.1, 0.55, 0.45, 5],
    ['AR-D', 'San Luis', 0.54, 0.25, 0.3, 0.45, 0.55, 5], ['AR-K', 'Catamarca', 0.43, -0.15, 0.35, 0.35, 0.65, 5], ['AR-F', 'La Rioja', 0.38, -0.2, 0.35, 0.35, 0.65, 5],
    ['AR-L', 'La Pampa', 0.36, 0.1, 0.2, 0.5, 0.5, 5], ['AR-Z', 'Santa Cruz', 0.34, -0.1, 0.1, 0.6, 0.4, 5], ['AR-V', 'Tierra del Fuego', 0.19, 0.0, 0.0, 0.65, 0.4, 5],
  ].forEach(([id, n, pop, e, s, inc, rel, dip]) => (arReg[id] = { id, n, pop: pop * 1e6, lean: [e, s], inc, rel, seats: dip }));
  C.AR = {
    id: 'AR', name: 'Argentina', flag: 'ar', cur: 'AR$', costMult: 900, accent: '#38bdf8', accent2: '#facc15',
    desc: 'Presidência com regra própria: vence com 45% ou 40% e 10 pontos de vantagem. Listas fechadas no Congresso.',
    tags: ['Regra 45% / 40%+10', 'Listas fechadas', 'Voto obrigatório', 'Senado 2+1'],
    elecRatio: 0.76, turnout: 0.74, voting: 'paper', tvFree: true, names: 'es', bairroLang: 'es',
    regionLabel: 'Província', regionsLabel: 'Províncias', cityLabel: 'Município', capital: 'Buenos Aires',
    regions: arReg,
    offices: [
      { id: 'concejal', name: 'Vereador(a) (Concejal)', arena: 'city', sys: 'list_closed', level: 1, minAge: 18, term: 4, every: 2, offset: 2027, kind: 'leg', scope: 'leg', seats: (a) => Math.ceil(councilSeats(a.pop) / 2), house: 'Concejo Deliberante' },
      { id: 'intendente', name: 'Prefeito(a) (Intendente)', arena: 'city', sys: 'plurality', level: 1, minAge: 21, term: 4, every: 4, offset: 2027, kind: 'exec', scope: 'exec_local' },
      { id: 'diputado', name: 'Deputado(a) Nacional', arena: 'state', sys: 'list_closed', level: 2, minAge: 25, term: 4, every: 2, offset: 2027, kind: 'leg', scope: 'leg', seats: (a) => Math.ceil(arReg[a.region].seats / 2), house: 'Cámara de Diputados', req: { any: ['concejal', 'intendente'], fame: 12, alt: 32 } },
      { id: 'gobernador', name: 'Governador(a)', arena: 'state', sys: 'plurality', level: 3, minAge: 30, term: 4, every: 4, offset: 2027, kind: 'exec', scope: 'exec_big', vice: 'Vicegobernador(a)', maxConsec: 2, req: { any: ['intendente', 'diputado', 'senador'], fame: 35, alt: 60 } },
      { id: 'senador', name: 'Senador(a) Nacional', arena: 'state', sys: 'plurality', seats: 2, level: 4, minAge: 30, term: 6, every: 2, offset: 2027, kind: 'leg', scope: 'leg', req: { any: ['diputado', 'gobernador', 'intendente'], fame: 40, alt: 65 } },
      { id: 'presidente', name: 'Presidente da Nação', arena: 'country', sys: 'majority', runoff: 'ar', level: 5, minAge: 30, term: 4, every: 4, offset: 2027, kind: 'exec', scope: 'exec_big', vice: 'Vicepresidente', maxConsec: 2, top: true, req: { any: ['gobernador', 'senador', 'diputado'], fame: 55, alt: 80 } },
    ],
    parties: [
      P('LLA', 'La Libertad Avanza', '#7c3aed', 0.95, 0.4, 0.85, 0),
      P('FP', 'Fuerza Patria (Peronismo)', '#0ea5e9', -0.5, -0.15, 0.9, 0),
      P('PRO', 'Propuesta Republicana', '#eab308', 0.55, 0.15, 0.4, 0),
      P('UCR', 'Unión Cívica Radical', '#dc2626', 0.15, -0.05, 0.4, 0),
      P('PU', 'Provincias Unidas', '#22c55e', 0.1, 0.05, 0.3, 0),
      P('FIT', 'Frente de Izquierda', '#b91c1c', -1, -0.7, 0.15, 0),
    ],
    cities: [
      ['Buenos Aires', 'AR-C', 3.12e6], ['La Matanza', 'AR-B', 1.84e6], ['Córdoba', 'AR-X', 1.5e6], ['Rosario', 'AR-S', 1.0e6], ['La Plata', 'AR-B', 0.77e6],
      ['Lomas de Zamora', 'AR-B', 0.69e6], ['Mar del Plata', 'AR-B', 0.68e6], ['Salta', 'AR-A', 0.62e6], ['San Miguel de Tucumán', 'AR-T', 0.55e6], ['Santa Fe', 'AR-S', 0.42e6],
      ['Posadas', 'AR-N', 0.36e6], ['Bahía Blanca', 'AR-B', 0.34e6], ['Neuquén', 'AR-Q', 0.29e6], ['Resistencia', 'AR-H', 0.29e6], ['Tigre', 'AR-B', 0.45e6],
      ['Mendoza', 'AR-M', 0.12e6], ['San Juan', 'AR-J', 0.12e6], ['Ushuaia', 'AR-V', 0.08e6], ['Santa Rosa', 'AR-L', 0.11e6], ['Río Gallegos', 'AR-Z', 0.1e6],
    ],
    real: [
      R('milei', 'Javier Milei', 'LLA', 1970, 95, ['presidente', 'diputado'], 'Buenos Aires', A('m', 0, 'wavy', 'dbrown', 'none', false, '#0f172a', '#7c3aed'), 'Economista; presidente desde 2023.'),
      R('bullrich', 'Patricia Bullrich', 'LLA', 1956, 72, ['diputado', 'senador'], 'Buenos Aires', A('f', 0, 'bob', 'blonde', 'none', false, '#1e293b', '#7c3aed', 'blazer'), 'Ex-ministra da Segurança.'),
      R('kicillof', 'Axel Kicillof', 'FP', 1971, 75, ['gobernador', 'diputado'], 'La Plata', A('m', 0, 'short', 'dbrown', 'stubble', false, '#374151', '#0ea5e9', 'shirt'), 'Economista, governador de Buenos Aires.'),
      R('massa', 'Sergio Massa', 'FP', 1972, 70, ['diputado', 'intendente'], 'Tigre', A('m', 0, 'short', 'dbrown', 'none', false, '#1e293b', '#0ea5e9'), 'Ex-ministro da Economia, ex-intendente de Tigre.'),
      R('bregman', 'Myriam Bregman', 'FIT', 1972, 52, ['diputado'], 'Buenos Aires', A('f', 0, 'curly', 'dbrown', 'none', false, '#7f1d1d', '#b91c1c', 'blazer'), 'Advogada de direitos humanos.'),
      R('lousteau', 'Martín Lousteau', 'UCR', 1970, 55, ['senador', 'diputado'], 'Buenos Aires', A('m', 0, 'side', 'dbrown', 'none', false, '#1e293b', '#dc2626'), 'Economista e senador radical.'),
    ],
  };

  // ======================= MÉXICO =======================
  const mxReg = {};
  [
    ['MX-MEX', 'Estado de México', 16.99, -0.25, 0.1, 0.45, 0.6], ['MX-DIF', 'Ciudad de México', 9.21, -0.3, -0.35, 0.7, 0.45], ['MX-JAL', 'Jalisco', 8.35, 0.2, 0.35, 0.55, 0.7],
    ['MX-VER', 'Veracruz', 8.06, -0.25, 0.25, 0.35, 0.65], ['MX-PUE', 'Puebla', 6.58, -0.2, 0.35, 0.4, 0.7], ['MX-GUA', 'Guanajuato', 6.17, 0.35, 0.5, 0.5, 0.8],
    ['MX-NLE', 'Nuevo León', 5.78, 0.3, 0.3, 0.75, 0.6], ['MX-CHP', 'Chiapas', 5.54, -0.3, 0.3, 0.2, 0.7], ['MX-MIC', 'Michoacán', 4.75, -0.15, 0.35, 0.35, 0.7],
    ['MX-OAX', 'Oaxaca', 4.13, -0.35, 0.25, 0.25, 0.7], ['MX-CHH', 'Chihuahua', 3.74, 0.25, 0.35, 0.6, 0.6], ['MX-GRO', 'Guerrero', 3.54, -0.3, 0.3, 0.25, 0.65],
    ['MX-BCN', 'Baja California', 3.77, 0.05, 0.15, 0.6, 0.5], ['MX-TAM', 'Tamaulipas', 3.53, 0.0, 0.25, 0.55, 0.6], ['MX-HID', 'Hidalgo', 3.08, -0.25, 0.3, 0.4, 0.65],
    ['MX-SIN', 'Sinaloa', 3.03, -0.1, 0.25, 0.5, 0.6], ['MX-SON', 'Sonora', 2.94, 0.05, 0.25, 0.6, 0.55], ['MX-COA', 'Coahuila', 3.15, 0.2, 0.3, 0.65, 0.6],
    ['MX-TAB', 'Tabasco', 2.4, -0.4, 0.25, 0.4, 0.6], ['MX-YUC', 'Yucatán', 2.32, 0.1, 0.3, 0.5, 0.65], ['MX-SLP', 'San Luis Potosí', 2.82, 0.0, 0.35, 0.45, 0.7],
    ['MX-QUE', 'Querétaro', 2.37, 0.25, 0.4, 0.6, 0.7], ['MX-MOR', 'Morelos', 1.97, -0.2, 0.2, 0.45, 0.6], ['MX-DUR', 'Durango', 1.83, 0.05, 0.35, 0.45, 0.65],
    ['MX-ZAC', 'Zacatecas', 1.62, -0.15, 0.35, 0.4, 0.7], ['MX-ROO', 'Quintana Roo', 1.86, -0.2, 0.1, 0.55, 0.5], ['MX-AGU', 'Aguascalientes', 1.43, 0.3, 0.45, 0.6, 0.75],
    ['MX-TLA', 'Tlaxcala', 1.34, -0.2, 0.3, 0.4, 0.7], ['MX-NAY', 'Nayarit', 1.24, -0.15, 0.3, 0.45, 0.65], ['MX-CAM', 'Campeche', 0.93, -0.2, 0.25, 0.5, 0.6],
    ['MX-COL', 'Colima', 0.73, -0.05, 0.3, 0.55, 0.65], ['MX-BCS', 'Baja California Sur', 0.8, -0.1, 0.15, 0.65, 0.5],
  ].forEach(([id, n, pop, e, s, inc, rel]) => (mxReg[id] = { id, n, pop: pop * 1e6, lean: [e, s], inc, rel }));
  C.MX = {
    id: 'MX', name: 'México', flag: 'mx', cur: 'MX$', costMult: 18, accent: '#16a34a', accent2: '#dc2626',
    desc: 'Mandato presidencial único de 6 anos, maioria simples e Senado com vaga para a primeira minoria.',
    tags: ['Sexenio', 'Maioria simples', 'Sem reeleição presidencial', 'Senado 2+1'],
    elecRatio: 0.75, turnout: 0.6, voting: 'paper', tvFree: true, names: 'es', bairroLang: 'es',
    regionLabel: 'Estado', regionsLabel: 'Estados', cityLabel: 'Município', capital: 'Cidade do México',
    regions: mxReg, skipZones: ['MX-X01~'],
    offices: [
      { id: 'regidor', name: 'Vereador(a) (Regidor)', arena: 'city', sys: 'list_closed', level: 1, minAge: 18, term: 3, every: 3, offset: 2027, kind: 'leg', scope: 'leg', seats: (a) => Math.round(councilSeats(a.pop) * 0.6), house: 'Cabildo' },
      { id: 'pres_municipal', name: 'Prefeito(a) (Presidente Municipal)', arena: 'city', sys: 'plurality', level: 1, minAge: 21, term: 3, every: 3, offset: 2027, kind: 'exec', scope: 'exec_local' },
      { id: 'diputado', name: 'Deputado(a) Federal', arena: 'district', distPop: 420000, sys: 'plurality', level: 2, minAge: 21, term: 3, every: 3, offset: 2027, kind: 'leg', scope: 'leg', req: { any: ['regidor', 'pres_municipal'], fame: 12, alt: 32 } },
      { id: 'gobernador', name: 'Governador(a)', arena: 'state', sys: 'plurality', level: 3, minAge: 30, term: 6, every: 3, offset: 2027, kind: 'exec', scope: 'exec_big', maxTotal: 1, req: { any: ['pres_municipal', 'diputado', 'senador'], fame: 35, alt: 60 } },
      { id: 'senador', name: 'Senador(a)', arena: 'state', sys: 'plurality', seats: 2, level: 4, minAge: 25, term: 6, every: 6, offset: 2030, kind: 'leg', scope: 'leg', req: { any: ['diputado', 'gobernador', 'pres_municipal'], fame: 40, alt: 65 } },
      { id: 'presidente', name: 'Presidente da República', arena: 'country', sys: 'plurality', level: 5, minAge: 35, term: 6, every: 6, offset: 2030, kind: 'exec', scope: 'exec_big', maxTotal: 1, top: true, req: { any: ['gobernador', 'senador', 'diputado'], fame: 55, alt: 80 } },
    ],
    parties: [
      P('MORENA', 'Morena', '#9f1239', -0.45, -0.1, 1, 0),
      P('PAN', 'Partido Acción Nacional', '#1d4ed8', 0.5, 0.55, 0.55, 0),
      P('PRI', 'Partido Revolucionario Institucional', '#16a34a', 0.15, 0.2, 0.35, 0),
      P('MC', 'Movimiento Ciudadano', '#f97316', 0.0, -0.3, 0.35, 0),
      P('PTM', 'Partido del Trabajo', '#dc2626', -0.6, -0.1, 0.15, 0),
      P('PVEM', 'Partido Verde Ecologista', '#22c55e', 0.1, 0.0, 0.25, 0),
    ],
    cities: [
      ['Ciudad de México', 'MX-DIF', 9.21e6], ['Tijuana', 'MX-BCN', 1.92e6], ['León', 'MX-GUA', 1.72e6], ['Puebla', 'MX-PUE', 1.69e6], ['Ecatepec', 'MX-MEX', 1.65e6],
      ['Juárez', 'MX-CHH', 1.51e6], ['Zapopan', 'MX-JAL', 1.48e6], ['Guadalajara', 'MX-JAL', 1.39e6], ['Monterrey', 'MX-NLE', 1.14e6], ['Querétaro', 'MX-QUE', 1.05e6],
      ['Culiacán', 'MX-SIN', 1.0e6], ['Mérida', 'MX-YUC', 0.99e6], ['Hermosillo', 'MX-SON', 0.94e6], ['Toluca', 'MX-MEX', 0.91e6], ['Cancún', 'MX-ROO', 0.91e6],
      ['Acapulco', 'MX-GRO', 0.78e6], ['Oaxaca de Juárez', 'MX-OAX', 0.27e6], ['Colima', 'MX-COL', 0.16e6], ['Tlaxcala', 'MX-TLA', 0.1e6], ['La Paz', 'MX-BCS', 0.29e6],
    ],
    real: [
      R('sheinbaum', 'Claudia Sheinbaum', 'MORENA', 1962, 95, ['presidente', 'gobernador'], 'Ciudad de México', A('f', 0, 'bun', 'dbrown', 'none', false, '#4c0519', '#9f1239', 'blazer'), 'Cientista ambiental; presidente desde 2024.'),
      R('ebrard', 'Marcelo Ebrard', 'MORENA', 1959, 70, ['gobernador'], 'Ciudad de México', A('m', 0, 'side', 'gray', 'none', false, '#1e293b', '#9f1239'), 'Ex-chefe de governo da Cidade do México.'),
      R('xochitl', 'Xóchitl Gálvez', 'PAN', 1963, 65, ['senador'], 'Ciudad de México', A('f', 2, 'bob', 'black', 'none', false, '#1e3a8a', '#1d4ed8', 'blazer'), 'Engenheira e empresária de origem indígena.'),
      R('samuel', 'Samuel García', 'MC', 1987, 60, ['gobernador', 'senador'], 'Monterrey', A('m', 0, 'side', 'black', 'none', false, '#1e293b', '#f97316'), 'Governador de Nuevo León.'),
      R('tellez', 'Lilly Téllez', 'PAN', 1967, 50, ['senador'], 'Hermosillo', A('f', 0, 'long', 'blonde', 'none', false, '#1e293b', '#1d4ed8', 'blazer'), 'Jornalista e senadora por Sonora.'),
    ],
  };

  // ======================= PORTUGAL =======================
  const ptReg = {};
  [
    ['PT-11', 'Lisboa', 2275, -0.05, -0.2, 0.7, 0.35, 48], ['PT-13', 'Porto', 1786, -0.05, 0.05, 0.6, 0.5, 40], ['PT-03', 'Braga', 848, 0.15, 0.3, 0.5, 0.6, 19],
    ['PT-15', 'Setúbal', 875, -0.35, -0.1, 0.5, 0.35, 19], ['PT-01', 'Aveiro', 700, 0.15, 0.25, 0.55, 0.55, 16], ['PT-10', 'Leiria', 465, 0.2, 0.25, 0.55, 0.55, 10],
    ['PT-08', 'Faro', 467, 0.05, 0.15, 0.55, 0.4, 9], ['PT-06', 'Coimbra', 408, -0.05, 0.05, 0.55, 0.5, 9], ['PT-14', 'Santarém', 425, 0.0, 0.15, 0.5, 0.5, 9],
    ['PT-18', 'Viseu', 351, 0.3, 0.35, 0.45, 0.65, 8], ['PT-16', 'Viana do Castelo', 231, 0.2, 0.35, 0.45, 0.65, 6], ['PT-17', 'Vila Real', 185, 0.3, 0.35, 0.4, 0.65, 5],
    ['PT-05', 'Castelo Branco', 179, -0.05, 0.2, 0.45, 0.55, 4], ['PT-09', 'Guarda', 143, 0.2, 0.3, 0.4, 0.6, 3], ['PT-07', 'Évora', 152, -0.3, 0.0, 0.45, 0.4, 3],
    ['PT-02', 'Beja', 144, -0.4, 0.0, 0.4, 0.4, 3], ['PT-04', 'Bragança', 122, 0.35, 0.35, 0.4, 0.65, 3], ['PT-12', 'Portalegre', 104, -0.2, 0.05, 0.4, 0.45, 2],
    ['PT-30', 'Madeira', 251, 0.35, 0.35, 0.5, 0.6, 6], ['PT-20', 'Açores', 236, 0.0, 0.25, 0.45, 0.6, 5],
  ].forEach(([id, n, pop, e, s, inc, rel, seats]) => (ptReg[id] = { id, n, pop: pop * 1000, lean: [e, s], inc, rel, seats }));
  C.PT = {
    id: 'PT', name: 'Portugal', flag: 'pt', cur: '€', costMult: 0.2, accent: '#16a34a', accent2: '#dc2626',
    desc: 'Sistema parlamentar: lidere o partido, vença as legislativas pelo método D’Hondt e forme governo. Presidente eleito em dois turnos.',
    tags: ['Parlamentarismo', "Método D'Hondt", 'Coligações', 'Presidente em 2 voltas'],
    elecRatio: 0.85, turnout: 0.58, voting: 'paper', tvFree: true, names: 'pt', bairroLang: 'pt',
    regionLabel: 'Distrito', regionsLabel: 'Distritos', cityLabel: 'Concelho', capital: 'Lisboa',
    regions: ptReg,
    offices: [
      { id: 'vereador', name: 'Vereador(a) Municipal', arena: 'city', sys: 'list_closed', level: 1, minAge: 18, term: 4, every: 4, offset: 2029, kind: 'leg', scope: 'leg', seats: (a) => Math.max(5, Math.round(councilSeats(a.pop) * 0.5)), house: 'Câmara Municipal' },
      { id: 'pres_camara', name: 'Presidente da Câmara', arena: 'city', sys: 'plurality', level: 1, minAge: 18, term: 4, every: 4, offset: 2029, kind: 'exec', scope: 'exec_local', maxConsec: 3 },
      { id: 'deputado', name: 'Deputado(a) à Assembleia da República', arena: 'state', sys: 'list_closed', level: 2, minAge: 18, term: 4, every: 4, offset: 2029, kind: 'leg', scope: 'leg', seats: (a) => ptReg[a.region].seats, house: 'Assembleia da República', req: { any: ['vereador', 'pres_camara'], fame: 12, alt: 32 } },
      { id: 'lider', name: 'Líder do Partido', arena: 'party', sys: 'internal', level: 3, minAge: 18, term: 99, every: 2, offset: 2028, kind: 'party', scope: 'leg', req: { any: ['deputado', 'pres_camara'], fame: 35, alt: 60 } },
      { id: 'pm', name: 'Primeiro-Ministro(a)', arena: 'country', sys: 'parliament', method: 'dhondt', level: 4, minAge: 18, term: 4, every: 4, offset: 2029, kind: 'exec', scope: 'exec_big', top: true, req: { cur: ['lider'], fame: 45 } },
      { id: 'pr', name: 'Presidente da República', arena: 'country', sys: 'majority', runoff: 'always', level: 5, minAge: 35, term: 5, every: 5, offset: 2031, kind: 'exec', scope: 'exec_big', maxConsec: 2, req: { any: ['pm', 'lider', 'deputado'], fame: 60, alt: 85 } },
    ],
    parties: [
      P('PSD', 'PSD / Aliança Democrática', '#f97316', 0.35, 0.2, 0.9, 0),
      P('PS', 'Partido Socialista', '#ec4899', -0.25, -0.3, 0.9, 0),
      P('CH', 'Chega', '#1e3a8a', 0.4, 0.8, 0.75, 0),
      P('IL', 'Iniciativa Liberal', '#06b6d4', 0.85, -0.2, 0.3, 0),
      P('L', 'Livre', '#84cc16', -0.5, -0.7, 0.15, 0),
      P('BE', 'Bloco de Esquerda', '#b91c1c', -0.75, -0.75, 0.1, 0),
      P('CDU', 'CDU (PCP-PEV)', '#dc2626', -0.9, -0.1, 0.12, 0),
      P('CDS', 'CDS-PP', '#2563eb', 0.4, 0.6, 0.1, 0),
    ],
    cities: [
      ['Lisboa', 'PT-11', 545e3], ['Sintra', 'PT-11', 385e3], ['Vila Nova de Gaia', 'PT-13', 304e3], ['Porto', 'PT-13', 232e3], ['Cascais', 'PT-11', 214e3],
      ['Braga', 'PT-03', 193e3], ['Guimarães', 'PT-03', 156e3], ['Coimbra', 'PT-06', 140e3], ['Leiria', 'PT-10', 128e3], ['Setúbal', 'PT-15', 123e3],
      ['Funchal', 'PT-30', 105e3], ['Viseu', 'PT-18', 99e3], ['Aveiro', 'PT-01', 80e3], ['Ponta Delgada', 'PT-20', 68e3], ['Faro', 'PT-08', 67e3],
      ['Évora', 'PT-07', 53e3], ['Bragança', 'PT-04', 34e3], ['Beja', 'PT-02', 33e3], ['Guarda', 'PT-09', 40e3], ['Viana do Castelo', 'PT-16', 86e3],
    ],
    real: [
      R('montenegro', 'Luís Montenegro', 'PSD', 1973, 85, ['pm', 'lider', 'deputado'], 'Porto', A('m', 0, 'side', 'salt', 'none', false, '#1e293b', '#f97316'), 'Advogado de Espinho; primeiro-ministro desde 2024.'),
      R('pns', 'Pedro Nuno Santos', 'PS', 1977, 62, ['deputado', 'lider'], 'Aveiro', A('m', 0, 'short', 'dbrown', 'stubble', false, '#1e293b', '#ec4899'), 'Economista e ex-ministro.'),
      R('ventura', 'André Ventura', 'CH', 1983, 82, ['deputado', 'lider', 'vereador'], 'Lisboa', A('m', 0, 'side', 'black', 'none', false, '#0f172a', '#1e3a8a'), 'Jurista e comentador; fundador do Chega.'),
      R('tavares', 'Rui Tavares', 'L', 1972, 50, ['deputado', 'lider'], 'Lisboa', A('m', 0, 'short', 'salt', 'full', true, '#374151', '#84cc16', 'shirt'), 'Historiador e escritor.'),
      R('moedas', 'Carlos Moedas', 'PSD', 1970, 58, ['pres_camara'], 'Lisboa', A('m', 0, 'side', 'salt', 'none', false, '#1e293b', '#f97316'), 'Engenheiro, presidente da Câmara de Lisboa.'),
    ],
  };

  // ======================= FRANÇA =======================
  const frReg = {};
  [
    ['ile-de-france', 'Île-de-France', 12.3, -0.1, -0.25, 0.8, 0.35], ['auvergne-rhone-alpes', 'Auvergne-Rhône-Alpes', 8.1, 0.15, 0.05, 0.6, 0.4],
    ['hauts-de-france', 'Hauts-de-France', 6.0, -0.05, 0.35, 0.45, 0.4], ['nouvelle-aquitaine', 'Nouvelle-Aquitaine', 6.0, -0.05, 0.05, 0.5, 0.4],
    ['occitanie', 'Occitanie', 6.0, -0.15, 0.1, 0.45, 0.4], ['grand-est', 'Grand Est', 5.6, 0.15, 0.3, 0.5, 0.45], ['provence-alpes-cote-d-azur', 'Provence-Alpes-Côte d’Azur', 5.1, 0.35, 0.35, 0.55, 0.45],
    ['pays-de-la-loire', 'Pays de la Loire', 3.8, 0.1, -0.05, 0.55, 0.5], ['bretagne', 'Bretagne', 3.4, -0.15, -0.2, 0.55, 0.45], ['normandie', 'Normandie', 3.3, 0.05, 0.15, 0.5, 0.4],
    ['bourgogne-franche-comte', 'Bourgogne-Franche-Comté', 2.8, 0.05, 0.2, 0.5, 0.4], ['centre-val-de-loire', 'Centre-Val de Loire', 2.6, 0.1, 0.2, 0.5, 0.4], ['corse', 'Corse', 0.35, 0.2, 0.2, 0.45, 0.5],
  ].forEach(([id, n, pop, e, s, inc, rel]) => (frReg[id] = { id, n, pop: pop * 1e6, lean: [e, s], inc, rel }));
  C.FR = {
    id: 'FR', name: 'França', flag: 'fr', cur: '€', costMult: 1, accent: '#3b82f6', accent2: '#ef4444',
    desc: 'Presidência forte eleita em dois turnos; deputados por circunscrição também em duas voltas.',
    tags: ['2 turnos', 'Presidencialismo forte', 'Circunscrições', 'Frentes republicanas'],
    elecRatio: 0.73, turnout: 0.72, voting: 'paper', tvFree: true, names: 'fr', bairroLang: 'fr',
    regionLabel: 'Região', regionsLabel: 'Regiões', cityLabel: 'Comuna', capital: 'Paris',
    regions: frReg,
    offices: [
      { id: 'conseiller', name: 'Vereador(a) (Conseiller municipal)', arena: 'city', sys: 'list_closed', level: 1, minAge: 18, term: 6, every: 6, offset: 2032, kind: 'leg', scope: 'leg', seats: (a) => councilSeats(a.pop), house: 'Conseil municipal' },
      { id: 'maire', name: 'Prefeito(a) (Maire)', arena: 'city', sys: 'majority', runoff: 'always', level: 1, minAge: 18, term: 6, every: 6, offset: 2032, kind: 'exec', scope: 'exec_local' },
      { id: 'depute', name: 'Deputado(a) (Député)', arena: 'district', distPop: 120000, sys: 'majority', runoff: 'always', level: 2, minAge: 18, term: 5, every: 5, offset: 2027, kind: 'leg', scope: 'leg', req: { any: ['conseiller', 'maire'], fame: 12, alt: 32 } },
      { id: 'pres_region', name: 'Presidente de Região', arena: 'state', sys: 'majority', runoff: 'always', level: 3, minAge: 18, term: 6, every: 6, offset: 2028, kind: 'exec', scope: 'exec_big', req: { any: ['maire', 'depute'], fame: 35, alt: 60 } },
      { id: 'president', name: 'Presidente da República', arena: 'country', sys: 'majority', runoff: 'always', level: 5, minAge: 18, term: 5, every: 5, offset: 2027, kind: 'exec', scope: 'exec_big', maxConsec: 2, top: true, req: { any: ['pres_region', 'depute', 'maire'], fame: 55, alt: 80 } },
    ],
    parties: [
      P('REN', 'Renaissance (Ensemble)', '#f59e0b', 0.25, -0.2, 0.7, 0),
      P('RN', 'Rassemblement National', '#1e3a8a', 0.0, 0.8, 0.95, 0),
      P('LFI', 'La France Insoumise', '#b91c1c', -0.85, -0.6, 0.6, 0),
      P('PS', 'Parti Socialiste', '#ec4899', -0.35, -0.4, 0.45, 0),
      P('LR', 'Les Républicains', '#2563eb', 0.45, 0.45, 0.5, 0),
      P('ECO', 'Les Écologistes', '#16a34a', -0.5, -0.7, 0.35, 0),
      P('HOR', 'Horizons', '#0ea5e9', 0.35, 0.0, 0.3, 0),
      P('REC', 'Reconquête', '#475569', 0.4, 0.95, 0.15, 0),
    ],
    cities: [
      ['Paris', 'ile-de-france', 2.1e6], ['Marseille', 'provence-alpes-cote-d-azur', 0.87e6], ['Lyon', 'auvergne-rhone-alpes', 0.52e6], ['Toulouse', 'occitanie', 0.5e6],
      ['Nice', 'provence-alpes-cote-d-azur', 0.34e6], ['Nantes', 'pays-de-la-loire', 0.32e6], ['Montpellier', 'occitanie', 0.3e6], ['Strasbourg', 'grand-est', 0.29e6],
      ['Bordeaux', 'nouvelle-aquitaine', 0.26e6], ['Lille', 'hauts-de-france', 0.24e6], ['Rennes', 'bretagne', 0.22e6], ['Reims', 'grand-est', 0.18e6],
      ['Le Havre', 'normandie', 0.17e6], ['Dijon', 'bourgogne-franche-comte', 0.16e6], ['Orléans', 'centre-val-de-loire', 0.12e6], ['Ajaccio', 'corse', 0.07e6], ['Hénin-Beaumont', 'hauts-de-france', 0.026e6],
    ],
    real: [
      R('bardella', 'Jordan Bardella', 'RN', 1995, 82, ['conseiller'], 'Paris', A('m', 0, 'side', 'dbrown', 'none', false, '#0f172a', '#1e3a8a'), 'Presidente do RN, eurodeputado.'),
      R('lepen', 'Marine Le Pen', 'RN', 1968, 90, ['depute', 'conseiller'], 'Hénin-Beaumont', A('f', 0, 'bob', 'blonde', 'none', false, '#1e3a8a', '#1e3a8a', 'blazer'), 'Advogada; três vezes candidata à presidência.'),
      R('melenchon', 'Jean-Luc Mélenchon', 'LFI', 1951, 85, ['depute'], 'Marseille', A('m', 0, 'short', 'white', 'none', false, '#1f2937', '#b91c1c', 'suit_open'), 'Fundador da França Insubmissa.'),
      R('philippe', 'Édouard Philippe', 'HOR', 1970, 75, ['maire', 'depute'], 'Le Havre', A('m', 0, 'short', 'white', 'full', false, '#1e293b', '#0ea5e9'), 'Ex-primeiro-ministro, prefeito do Havre.'),
      R('attal', 'Gabriel Attal', 'REN', 1989, 70, ['depute'], 'Paris', A('m', 0, 'side', 'dbrown', 'none', false, '#1e293b', '#f59e0b'), 'Ex-primeiro-ministro.'),
      R('glucksmann', 'Raphaël Glucksmann', 'PS', 1979, 60, [], 'Paris', A('m', 0, 'wavy', 'dbrown', 'none', false, '#1e293b', '#ec4899', 'suit_open'), 'Ensaísta e eurodeputado.'),
      R('retailleau', 'Bruno Retailleau', 'LR', 1960, 62, ['pres_region'], 'Nantes', A('m', 0, 'side', 'gray', 'none', true, '#1e293b', '#2563eb'), 'Ex-presidente da região Pays de la Loire.'),
    ],
  };

  // ======================= REINO UNIDO =======================
  const gbReg = {};
  [
    ['south-east', 'South East', 9.3, 0.2, 0.05, 0.7, 0.4, 91], ['greater-london', 'Grande Londres', 8.8, -0.35, -0.35, 0.75, 0.4, 75],
    ['north-west', 'North West', 7.4, -0.2, 0.05, 0.5, 0.4, 73], ['east', 'East of England', 6.3, 0.2, 0.15, 0.6, 0.35, 61],
    ['west-midlands', 'West Midlands', 5.95, 0.05, 0.15, 0.5, 0.4, 57], ['south-west', 'South West', 5.7, 0.15, 0.0, 0.6, 0.35, 58],
    ['yorkshire-and-the-humber', 'Yorkshire and the Humber', 5.5, -0.05, 0.15, 0.5, 0.35, 54], ['east-midlands', 'East Midlands', 4.9, 0.1, 0.15, 0.5, 0.35, 47],
    ['north-east', 'North East', 2.65, -0.25, 0.1, 0.45, 0.35, 27], ['scotland', 'Escócia', 5.44, -0.25, -0.15, 0.55, 0.3, 57],
    ['wales', 'País de Gales', 3.1, -0.25, -0.05, 0.45, 0.35, 32], ['northern-ireland', 'Irlanda do Norte', 1.9, 0.0, 0.35, 0.45, 0.65, 18],
  ].forEach(([id, n, pop, e, s, inc, rel, seats]) => (gbReg[id] = { id, n, pop: pop * 1e6, lean: [e, s], inc, rel, seats }));
  C.GB = {
    id: 'GB', name: 'Reino Unido', flag: 'gb', cur: '£', costMult: 0.9, accent: '#3b82f6', accent2: '#ef4444',
    desc: 'Voto distrital puro (first-past-the-post): conquiste a liderança do partido e 326 cadeiras para chegar a Downing Street.',
    tags: ['Distrital puro', 'Parlamentarismo', 'Liderança partidária', '326 para maioria'],
    elecRatio: 0.72, turnout: 0.6, voting: 'paper', tvFree: true, names: 'gb', bairroLang: 'gb',
    regionLabel: 'Região', regionsLabel: 'Regiões', cityLabel: 'Cidade', capital: 'Londres',
    regions: gbReg,
    offices: [
      { id: 'councillor', name: 'Vereador(a) (Councillor)', arena: 'district', distPop: 9000, sys: 'plurality', level: 1, minAge: 18, term: 4, every: 2, offset: 2028, kind: 'leg', scope: 'leg' },
      { id: 'mayor', name: 'Prefeito(a) (Mayor)', arena: 'city', sys: 'plurality', level: 1, minAge: 18, term: 4, every: 4, offset: 2028, kind: 'exec', scope: 'exec_local' },
      { id: 'mp', name: 'Membro do Parlamento (MP)', arena: 'district', distPop: 100000, sys: 'plurality', level: 2, minAge: 18, term: 5, every: 5, offset: 2029, kind: 'leg', scope: 'leg', req: { any: ['councillor', 'mayor'], fame: 12, alt: 30 } },
      { id: 'leader', name: 'Líder do Partido', arena: 'party', sys: 'internal', level: 3, minAge: 18, term: 99, every: 2, offset: 2028, kind: 'party', scope: 'leg', req: { any: ['mp'], fame: 35 } },
      { id: 'pm', name: 'Primeiro-Ministro(a)', arena: 'country', sys: 'parliament', method: 'fptp', level: 5, minAge: 18, term: 5, every: 5, offset: 2029, kind: 'exec', scope: 'exec_big', top: true, req: { cur: ['leader'], fame: 45 } },
    ],
    parties: [
      P('LAB', 'Labour', '#dc2626', -0.35, -0.3, 1, 0),
      P('CON', 'Conservative', '#1d4ed8', 0.55, 0.4, 0.85, 0),
      P('REF', 'Reform UK', '#06b6d4', 0.5, 0.8, 0.8, 0),
      P('LD', 'Liberal Democrats', '#f59e0b', 0.0, -0.5, 0.5, 0),
      P('GRN', 'Green Party', '#16a34a', -0.75, -0.75, 0.35, 0),
      P('SNP', 'Scottish National Party', '#eab308', -0.3, -0.4, 0.35, 0, { regions: ['scotland'] }),
    ],
    cities: [
      ['London', 'greater-london', 8.8e6], ['Birmingham', 'west-midlands', 1.14e6], ['Leeds', 'yorkshire-and-the-humber', 0.81e6], ['Glasgow', 'scotland', 0.63e6],
      ['Sheffield', 'yorkshire-and-the-humber', 0.56e6], ['Manchester', 'north-west', 0.55e6], ['Edinburgh', 'scotland', 0.51e6], ['Liverpool', 'north-west', 0.49e6],
      ['Bristol', 'south-west', 0.47e6], ['Cardiff', 'wales', 0.36e6], ['Belfast', 'northern-ireland', 0.35e6], ['Nottingham', 'east-midlands', 0.32e6],
      ['Newcastle', 'north-east', 0.3e6], ['Brighton', 'south-east', 0.28e6], ['Oxford', 'south-east', 0.16e6], ['Norwich', 'east', 0.14e6], ['Clacton-on-Sea', 'east', 0.055e6],
    ],
    real: [
      R('starmer', 'Keir Starmer', 'LAB', 1962, 88, ['pm', 'leader', 'mp'], 'London', A('m', 0, 'side', 'salt', 'none', true, '#1e293b', '#dc2626'), 'Advogado; primeiro-ministro desde 2024.'),
      R('badenoch', 'Kemi Badenoch', 'CON', 1980, 72, ['leader', 'mp'], 'London', A('f', 5, 'bun', 'black', 'none', false, '#1e3a8a', '#1d4ed8', 'blazer'), 'Engenheira de software, líder conservadora.'),
      R('farage', 'Nigel Farage', 'REF', 1964, 86, ['leader', 'mp'], 'Clacton-on-Sea', A('m', 0, 'side', 'salt', 'none', false, '#1e293b', '#06b6d4'), 'Líder do Reform UK.'),
      R('davey', 'Ed Davey', 'LD', 1965, 60, ['leader', 'mp'], 'London', A('m', 0, 'short', 'gray', 'none', false, '#1e293b', '#f59e0b'), 'Líder dos Liberais Democratas.'),
      R('polanski', 'Zack Polanski', 'GRN', 1982, 48, ['leader'], 'London', A('m', 0, 'short', 'dbrown', 'full', false, '#14532d', '#16a34a', 'shirt'), 'Líder do Partido Verde.'),
      R('burnham', 'Andy Burnham', 'LAB', 1970, 70, ['mayor', 'mp'], 'Manchester', A('m', 0, 'side', 'dbrown', 'none', false, '#1e293b', '#dc2626'), 'Prefeito da Grande Manchester.'),
    ],
  };

  // ======================= ESPANHA =======================
  const esReg = {};
  [
    ['andalucia', 'Andaluzia', 8.5, 0.1, 0.15, 0.4, 0.5, 61], ['cataluna', 'Catalunha', 7.8, -0.25, -0.35, 0.7, 0.3, 48], ['madrid', 'Madri', 6.8, 0.3, 0.05, 0.8, 0.4, 37],
    ['valenciana', 'C. Valenciana', 5.1, 0.15, 0.1, 0.55, 0.45, 33], ['galicia', 'Galiza', 2.7, 0.15, 0.15, 0.5, 0.5, 23], ['castilla-y-leon', 'Castela e Leão', 2.4, 0.3, 0.35, 0.5, 0.55, 31],
    ['pais-vasco', 'País Basco', 2.2, -0.3, -0.3, 0.75, 0.35, 18], ['canary-is', 'Canárias', 2.2, -0.05, 0.05, 0.45, 0.45, 15], ['castilla-la-mancha', 'Castela-Mancha', 2.05, 0.1, 0.3, 0.45, 0.55, 21],
    ['murcia', 'Múrcia', 1.5, 0.35, 0.35, 0.45, 0.55, 10], ['aragon', 'Aragão', 1.33, 0.1, 0.15, 0.55, 0.45, 13], ['islas-baleares', 'Baleares', 1.2, 0.1, 0.0, 0.6, 0.4, 8],
    ['extremadura', 'Extremadura', 1.05, 0.0, 0.25, 0.35, 0.55, 10], ['asturias', 'Astúrias', 1.0, -0.15, -0.05, 0.5, 0.4, 7], ['foral-de-navarra', 'Navarra', 0.66, -0.1, 0.0, 0.7, 0.45, 5],
    ['cantabria', 'Cantábria', 0.58, 0.15, 0.2, 0.55, 0.5, 5], ['la-rioja', 'La Rioja', 0.32, 0.2, 0.25, 0.6, 0.5, 4],
  ].forEach(([id, n, pop, e, s, inc, rel, seats]) => (esReg[id] = { id, n, pop: pop * 1e6, lean: [e, s], inc, rel, seats }));
  C.ES = {
    id: 'ES', name: 'Espanha', flag: 'es', cur: '€', costMult: 0.9, accent: '#ef4444', accent2: '#facc15',
    desc: 'Monarquia parlamentar: Congresso de 350 cadeiras por D’Hondt e investidura com 176 votos.',
    tags: ['Parlamentarismo', "D'Hondt provincial", 'Investidura', 'Partidos regionais'],
    elecRatio: 0.78, turnout: 0.68, voting: 'paper', tvFree: true, names: 'es', bairroLang: 'es',
    regionLabel: 'Comunidade', regionsLabel: 'Comunidades', cityLabel: 'Município', capital: 'Madri',
    regions: esReg,
    offices: [
      { id: 'concejal', name: 'Vereador(a) (Concejal)', arena: 'city', sys: 'list_closed', level: 1, minAge: 18, term: 4, every: 4, offset: 2027, kind: 'leg', scope: 'leg', seats: (a) => councilSeats(a.pop), house: 'Ayuntamiento' },
      { id: 'alcalde', name: 'Prefeito(a) (Alcalde)', arena: 'city', sys: 'plurality', level: 1, minAge: 18, term: 4, every: 4, offset: 2027, kind: 'exec', scope: 'exec_local' },
      { id: 'diputado', name: 'Deputado(a) no Congresso', arena: 'state', sys: 'list_closed', level: 2, minAge: 18, term: 4, every: 4, offset: 2027, kind: 'leg', scope: 'leg', seats: (a) => esReg[a.region].seats, house: 'Congreso de los Diputados', req: { any: ['concejal', 'alcalde'], fame: 12, alt: 32 } },
      { id: 'pres_auto', name: 'Presidente Autonômico', arena: 'state', sys: 'plurality', level: 3, minAge: 18, term: 4, every: 4, offset: 2027, kind: 'exec', scope: 'exec_big', req: { any: ['alcalde', 'diputado'], fame: 35, alt: 60 } },
      { id: 'lider', name: 'Líder do Partido', arena: 'party', sys: 'internal', level: 3, minAge: 18, term: 99, every: 2, offset: 2028, kind: 'party', scope: 'leg', req: { any: ['diputado', 'pres_auto', 'alcalde'], fame: 35, alt: 60 } },
      { id: 'pres_gob', name: 'Presidente do Governo', arena: 'country', sys: 'parliament', method: 'dhondt', level: 5, minAge: 18, term: 4, every: 4, offset: 2027, kind: 'exec', scope: 'exec_big', top: true, req: { cur: ['lider'], fame: 45 } },
    ],
    parties: [
      P('PSOE', 'PSOE', '#dc2626', -0.35, -0.45, 1, 0),
      P('PP', 'Partido Popular', '#2563eb', 0.45, 0.35, 1, 0),
      P('VOX', 'Vox', '#22c55e', 0.5, 0.9, 0.6, 0),
      P('SUMAR', 'Sumar', '#ec4899', -0.75, -0.7, 0.45, 0),
      P('POD', 'Podemos', '#7c3aed', -0.85, -0.8, 0.2, 0),
      P('JUNTS', 'Junts', '#06b6d4', 0.25, -0.1, 0.25, 0, { regions: ['cataluna'] }),
      P('ERC', 'Esquerra Republicana', '#eab308', -0.45, -0.5, 0.25, 0, { regions: ['cataluna'] }),
      P('PNV', 'PNV', '#15803d', 0.2, 0.1, 0.25, 0, { regions: ['pais-vasco'] }),
    ],
    cities: [
      ['Madrid', 'madrid', 3.3e6], ['Barcelona', 'cataluna', 1.66e6], ['Valencia', 'valenciana', 0.8e6], ['Sevilla', 'andalucia', 0.68e6], ['Zaragoza', 'aragon', 0.68e6],
      ['Málaga', 'andalucia', 0.58e6], ['Murcia', 'murcia', 0.46e6], ['Palma', 'islas-baleares', 0.42e6], ['Las Palmas', 'canary-is', 0.38e6], ['Bilbao', 'pais-vasco', 0.35e6],
      ['Alicante', 'valenciana', 0.34e6], ['Córdoba', 'andalucia', 0.32e6], ['Valladolid', 'castilla-y-leon', 0.3e6], ['Vigo', 'galicia', 0.29e6], ['Gijón', 'asturias', 0.27e6],
      ['Pamplona', 'foral-de-navarra', 0.2e6], ['Santander', 'cantabria', 0.17e6], ['Logroño', 'la-rioja', 0.15e6], ['Toledo', 'castilla-la-mancha', 0.086e6], ['Mérida', 'extremadura', 0.06e6],
    ],
    real: [
      R('sanchez', 'Pedro Sánchez', 'PSOE', 1972, 90, ['pres_gob', 'lider', 'diputado', 'concejal'], 'Madrid', A('m', 0, 'side', 'salt', 'none', false, '#1e293b', '#dc2626'), 'Economista; presidente do Governo desde 2018.'),
      R('feijoo', 'Alberto Núñez Feijóo', 'PP', 1961, 78, ['pres_auto', 'lider', 'diputado'], 'Vigo', A('m', 0, 'bald', 'gray', 'none', false, '#1e293b', '#2563eb'), 'Ex-presidente da Xunta da Galiza.'),
      R('ayuso', 'Isabel Díaz Ayuso', 'PP', 1978, 80, ['pres_auto'], 'Madrid', A('f', 0, 'long', 'dbrown', 'none', false, '#1e3a8a', '#2563eb', 'blazer'), 'Presidente da Comunidade de Madri.'),
      R('abascal', 'Santiago Abascal', 'VOX', 1976, 74, ['lider', 'diputado'], 'Bilbao', A('m', 0, 'buzz', 'black', 'full', false, '#0f172a', '#22c55e'), 'Fundador do Vox.'),
      R('ydiaz', 'Yolanda Díaz', 'SUMAR', 1971, 66, ['diputado', 'lider'], 'Vigo', A('f', 0, 'long', 'blonde', 'none', false, '#4a044e', '#ec4899', 'blazer'), 'Advogada trabalhista, ex-ministra do Trabalho.'),
    ],
  };

  C.ORDER = ['BR', 'US', 'AR', 'MX', 'PT', 'FR', 'GB', 'ES'];
  C.HC = HC;
})();
