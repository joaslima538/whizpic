import {mountReader} from '../../reader.js';

const response = await fetch('./story.json');
if (!response.ok) throw new Error('Não foi possível carregar a história.');
const story = await response.json();

const pages = story.pages.map((page, index) => ({
  ...page,
  image: `page-${index + 1}.webp`,
  alt: page.place
}));

mountReader(document.querySelector('#livro'), {
  title: story.title,
  coverArt: 'cover.webp',
  spreads: Array.from({length: pages.length / 2}, (_, index) => pages.slice(index * 2, index * 2 + 2))
});

const scenes = document.querySelector('#scene-list');
for (const page of pages) {
  const article = document.createElement('article');
  const illustration = new Image();
  illustration.src = page.image;
  illustration.alt = page.alt;
  illustration.loading = 'lazy';
  const details = document.createElement('div');
  const title = document.createElement('h4');
  title.textContent = page.title;
  details.append(title);
  for (const [label, value] of [
    ['Cenário',page.place],['Traje',page.wardrobe],['Reação',page.acting],['Continuidade',page.props]
  ]) {
    const paragraph = document.createElement('p');
    const emphasis = document.createElement('strong');
    emphasis.textContent = label + ' · ';
    paragraph.append(emphasis,value);
    details.append(paragraph);
  }
  article.append(illustration,details);
  scenes.append(article);
}
