export const worlds = {
  castle: {name:'Reino mágico', category:'Fantasia', title:'O Reino das Cores', art:'castle', symbol:'♛', color:'#e0cbff', description:'Um reino perdeu todas as suas cores. Só uma protagonista muito especial pode trazê-las de volta.', place:'um reino além do arco-íris', clue:'uma borboleta que brilhava em dourado', friend:'um dragãozinho cor de coral', mission:'devolver as cores ao reino', ending:'As torres voltaram a brilhar, e o céu ganhou o mais bonito arco-íris que alguém já tinha visto.'},
  space: {name:'Espaço sideral', category:'Espaço', title:'A Estrela que se Perdeu', art:'space', symbol:'★', color:'#c7dafa', description:'Uma pequena estrela sumiu do mapa. Aperte o cinto e embarque numa missão até os anéis de Saturno.', place:'uma estação perto de Saturno', clue:'um sinal piscando no meio das estrelas', friend:'um robô que colecionava pedacinhos de cometa', mission:'guiar uma estrela perdida de volta ao seu lugar no céu', ending:'A estrela voltou a brilhar, e o robô desenhou um coração no painel da nave.'},
  dino: {name:'Vale dos dinossauros', category:'Natureza', title:'O Segredo dos Dinossauros', art:'dino', symbol:'❋', color:'#c6efd8', description:'Pegadas misteriosas levam a um vale escondido, onde um dinossauro pequenino precisa de ajuda.', place:'um vale escondido entre montanhas', clue:'um rastro de pegadas recém-feitas', friend:'um dinossaurinho que espirrava bolhas', mission:'encontrar a família do dinossaurinho', ending:'Quando a família se reencontrou, o vale ficou cheio de bolhas coloridas.'},
  forest: {name:'Floresta encantada', category:'Fantasia', title:'A Floresta de Luz', art:'forest', symbol:'✧', color:'#f6dcbf', description:'Siga as luzes da floresta e descubra por que os bichos esqueceram o caminho de casa.', place:'uma floresta cheia de vaga-lumes', clue:'uma luz piscando atrás de um carvalho', friend:'uma raposinha de orelhas douradas', mission:'achar a estrela que guiava os bichos para casa', ending:'A estrela subiu devagar, e cada bichinho encontrou de novo o caminho da sua toca.'}
};

export function buildStory(draft) {
  const world = worlds[draft.world];
  const name = draft.name;
  const age = Number(draft.age);
  const setting = draft.mode === 'custom' && draft.setting ? draft.setting : world.place;
  const idea = draft.ideas.at(-1);
  const interest = draft.interest ? ` Levou consigo algo de que gostava muito: ${draft.interest}.` : '';
  const opening = age <= 5 ? `${name} chegou a ${setting}. De repente, encontrou ${world.clue}. Que surpresa!` : `${name} mal tinha chegado a ${setting} quando encontrou ${world.clue}. Havia alguma coisa diferente naquele lugar.`;
  const pages = [
    ['O começo da aventura', opening + interest],
    ['Uma dupla improvável', `${name} encontrou ${world.friend}. Quando percebeu que o novo amigo precisava de ajuda, decidiu ficar. Juntos, partiram para ${world.mission}.`],
    ['O detalhe que mudou tudo', idea ? `No caminho, ${name} encontrou algo inesperado: ${idea}. Com uma boa ideia e a ajuda do novo amigo, resolveu o mistério.` : `Quando o caminho parecia ter acabado, ${name} viu uma passagem escondida. Foi só dar o primeiro passo para descobrir a solução.`],
    ['De volta para casa', world.ending + (draft.lesson ? ` Na volta, ${name} ficou pensando no que tinha aprendido sobre ${draft.lesson}.` : ` Naquela noite, ${name} sonhou com a próxima aventura.`)]
  ];
  if (draft.dedication) pages.unshift(['Para você', draft.dedication]);
  return {
    title: draft.title || `${name} · ${world.title}`,
    world: draft.world, photo: draft.photo, pages
  };
}

export function exampleStory(world = 'castle') {
  return buildStory({world, title:worlds[world].title, name:'Luna', age:7, ideas:[], dedication:'Para quem já imaginou encontrar um mundo inteiro ao abrir um livro.'});
}
