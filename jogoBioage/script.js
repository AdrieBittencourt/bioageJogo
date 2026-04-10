// ----- DOM Elements -----
let currentScreen = 'inicio';
let memoriaCards = [];
let memoriaFlipped = [];
let memoriaMatched = [];
let memoriaBlocked = false;
let memorizationActive = true;
let memorizationInterval = null;

let adivinheTimer = null;
let adivinheTimeLeft = 10;
let adivinheResolvido = false;

let quizzIndex = 0;
const perguntas = [
  { text: "O ativo inovador presente nas máscaras Bio Mask Candy é o Glowcitocin", answer: true },
  { text: "Bio Mask Candy hidrata profundamente a pele", answer: true },
  { text: "Bio Mask Candy não é indicada para controle de oleosidade", answer: false }
];

const PRODUTO_CORRETO = 'brigadeiro';

// Função para obter imagem real (com fallback)
function getImagemProduto(tipo) {
  // Tenta usar as imagens reais primeiro
  const imagemMap = {
    brigadeiro: 'bio brigadeiro.png',
    mousse: 'bio mousse.png',
    ganache: 'bio ganache.png'
  };
  const caminho = imagemMap[tipo];
  // Retorna um objeto com a URL e um fallback SVG
  return {
    url: caminho,
    fallback: (cor, texto) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='${cor}'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='white' text-anchor='middle' dy='.3em'%3E${texto}%3C/text%3E%3C/svg%3E`,
    corFallback: tipo === 'brigadeiro' ? '%23652d08' : (tipo === 'mousse' ? '%2340231c' : '%23341e25'),
    nome: tipo.charAt(0).toUpperCase() + tipo.slice(1)
  };
}

function carregarImagemComFallback(tipo, elemento, propriedade = 'backgroundImage') {
  const imgInfo = getImagemProduto(tipo);
  const img = new Image();
  img.onload = () => {
    if (propriedade === 'backgroundImage') {
      elemento.style.backgroundImage = `url('${imgInfo.url}')`;
      elemento.style.backgroundSize = 'cover';
      elemento.style.backgroundPosition = 'center';
    } else if (propriedade === 'src') {
      elemento.src = imgInfo.url;
    }
  };
  img.onerror = () => {
    const fallbackSvg = imgInfo.fallback(imgInfo.corFallback, imgInfo.nome);
    if (propriedade === 'backgroundImage') {
      elemento.style.backgroundImage = `url('${fallbackSvg}')`;
      elemento.style.backgroundSize = 'cover';
    } else if (propriedade === 'src') {
      elemento.src = fallbackSvg;
    }
  };
  img.src = imgInfo.url;
}

// Inicializa jogo da memória
function initMemoryGame() {
  const cardData = [
    { tipo: 'brigadeiro' },
    { tipo: 'brigadeiro' },
    { tipo: 'mousse' },
    { tipo: 'mousse' },
    { tipo: 'ganache' },
    { tipo: 'ganache' }
  ];
  // Embaralhar
  for (let i = cardData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardData[i], cardData[j]] = [cardData[j], cardData[i]];
  }
  memoriaCards = cardData;
  memoriaFlipped = [];
  memoriaMatched = new Array(6).fill(false);
  memoriaBlocked = false;
  memorizationActive = true;
  
  if (memorizationInterval) clearInterval(memorizationInterval);
  
  renderMemoryGrid();
  
  // Durante a memorização: todas as cartas viradas (frente)
  const allCards = document.querySelectorAll('#cards-grid .card');
  allCards.forEach(card => card.classList.add('flipped'));
  
  // Mensagem durante memorização
  const msgDiv = document.getElementById('memoria-mensagem');
  msgDiv.innerHTML = '🧠 Memorize as imagens! 🧠';
  
  startMemorizationTimer();
}

function renderMemoryGrid() {
  const grid = document.getElementById('cards-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  memoriaCards.forEach((card, idx) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.setAttribute('data-tipo', card.tipo);
    cardDiv.setAttribute('data-index', idx);
    
    const front = document.createElement('div');
    front.className = 'card-front';
    // Carrega a imagem do produto na frente
    carregarImagemComFallback(card.tipo, front, 'backgroundImage');
    
    const back = document.createElement('div');
    back.className = 'card-back';
    back.style.backgroundImage = `url('bioLogo.png')`;
    back.style.backgroundSize = '70%';
    back.style.backgroundRepeat = 'no-repeat';
    back.style.backgroundPosition = 'center';
    
    cardDiv.appendChild(front);
    cardDiv.appendChild(back);
    cardDiv.addEventListener('click', () => onCardClick(idx));
    grid.appendChild(cardDiv);
  });
}

function onCardClick(idx) {
  if (memoriaBlocked) return;
  if (memoriaMatched[idx]) return;
  if (memorizationActive) {
    document.getElementById('memoria-mensagem').innerHTML = '⏳ Aguarde o tempo de memorização...';
    return;
  }
  if (memoriaFlipped.includes(idx)) return;
  if (memoriaFlipped.length === 2) return;
  
  memoriaFlipped.push(idx);
  updateFlipClass();
  
  if (memoriaFlipped.length === 2) {
    memoriaBlocked = true;
    const [i1, i2] = memoriaFlipped;
    if (memoriaCards[i1].tipo === memoriaCards[i2].tipo) {
      memoriaMatched[i1] = true;
      memoriaMatched[i2] = true;
      document.getElementById('memoria-mensagem').innerHTML = '✅ Acertou!';
      updateFlipClass();
      memoriaFlipped = [];
      memoriaBlocked = false;
      if (memoriaMatched.every(v => v === true)) {
        document.getElementById('memoria-mensagem').innerHTML = '🎉 Memória concluída! Avançando...';
        setTimeout(() => goToNextGame('memoria'), 1200);
      }
    } else {
      document.getElementById('memoria-mensagem').innerHTML = '❌ Errou!';
      setTimeout(() => {
        memoriaFlipped = [];
        updateFlipClass();
        memoriaBlocked = false;
        document.getElementById('memoria-mensagem').innerHTML = '';
      }, 800);
    }
  } else {
    document.getElementById('memoria-mensagem').innerHTML = '';
  }
}

function updateFlipClass() {
  const cardsDiv = document.querySelectorAll('#cards-grid .card');
  cardsDiv.forEach((card, i) => {
    if (memoriaFlipped.includes(i) || memoriaMatched[i]) {
      card.classList.add('flipped');
    } else {
      card.classList.remove('flipped');
    }
  });
}

function startMemorizationTimer() {
  let timeLeft = 3;
  const timerBar = document.getElementById('memoria-timer-bar');
  const timerText = document.getElementById('memoria-timer-text');
  
  memorizationInterval = setInterval(() => {
    if (!memorizationActive) {
      clearInterval(memorizationInterval);
      return;
    }
    timeLeft -= 0.05;
    if (timeLeft <= 0) {
      clearInterval(memorizationInterval);
      memorizationActive = false;
      timerText.innerText = 'jogue!';
      timerBar.style.width = '0%';
      // Vira todas as cartas para o verso
      const allCards = document.querySelectorAll('#cards-grid .card');
      allCards.forEach(card => card.classList.remove('flipped'));
      document.getElementById('memoria-mensagem').innerHTML = '🎯 Agora encontre os pares! 🎯';
    } else {
      const percent = (timeLeft / 3) * 100;
      timerBar.style.width = `${percent}%`;
      timerText.innerText = `memorize ${Math.ceil(timeLeft)}s`;
    }
  }, 50);
}

// Tela Adivinhe (com imagem real)
function startAdivinhe() {
  adivinheResolvido = false;
  adivinheTimeLeft = 10;
  const imgElement = document.getElementById('produto-blur-img');
  // Carrega a imagem real do Bio Brigadeiro
  carregarImagemComFallback('brigadeiro', imgElement, 'src');
  imgElement.style.filter = `blur(12px)`;
  
  if (adivinheTimer) clearInterval(adivinheTimer);
  const timerBar = document.getElementById('adivinhe-timer-bar');
  const timerTextSpan = document.getElementById('adivinhe-timer-text');
  
  const updateBlur = () => {
    const progress = adivinheTimeLeft / 10;
    const blurVal = Math.max(0, progress * 12);
    imgElement.style.filter = `blur(${blurVal}px)`;
    timerBar.style.width = `${progress * 100}%`;
    timerTextSpan.innerText = `${Math.ceil(adivinheTimeLeft)}s`;
  };
  updateBlur();
  
  adivinheTimer = setInterval(() => {
    if (adivinheResolvido) return;
    if (adivinheTimeLeft <= 0) {
      clearInterval(adivinheTimer);
      document.getElementById('adivinhe-mensagem').innerHTML = '⏰ Tempo esgotado! Tente novamente.';
      setTimeout(() => startAdivinhe(), 1500);
    } else {
      adivinheTimeLeft -= 0.1;
      if (adivinheTimeLeft < 0) adivinheTimeLeft = 0;
      updateBlur();
    }
  }, 100);
}

function verificarResposta(produto) {
  if (adivinheResolvido) return;
  if (produto === PRODUTO_CORRETO) {
    adivinheResolvido = true;
    if (adivinheTimer) clearInterval(adivinheTimer);
    document.getElementById('adivinhe-mensagem').innerHTML = '🎉 Correto! Bio Brigadeiro! Avançando...';
    setTimeout(() => goToNextGame('adivinhe'), 1500);
  } else {
    document.getElementById('adivinhe-mensagem').innerHTML = '❌ Errado! Tente novamente.';
  }
}

// Quizz
function initQuizz() {
  quizzIndex = 0;
  mostrarPergunta();
}

function mostrarPergunta() {
  if (quizzIndex >= perguntas.length) {
    document.getElementById('quizz-mensagem').innerHTML = '🏆 Quizz finalizado! Parabéns!';
    setTimeout(() => goToNextGame('quizz'), 1200);
    return;
  }
  const pergunta = perguntas[quizzIndex];
  document.getElementById('pergunta-texto').innerHTML = pergunta.text;
  document.getElementById('quizz-mensagem').innerHTML = '';
  const btnV = document.getElementById('btn-verdadeiro');
  const btnF = document.getElementById('btn-falso');
  btnV.disabled = false;
  btnF.disabled = false;
  btnV.style.opacity = '1';
  btnF.style.opacity = '1';
}

function responderQuizz(resposta) {
  const perguntaAtual = perguntas[quizzIndex];
  const isCorrect = (resposta === perguntaAtual.answer);
  if (isCorrect) {
    document.getElementById('quizz-mensagem').innerHTML = '✅ Correto!';
    quizzIndex++;
    setTimeout(() => mostrarPergunta(), 800);
  } else {
    document.getElementById('quizz-mensagem').innerHTML = '❌ Resposta errada. Tente novamente!';
  }
}

// Navegação
let currentGameIdx = 0;

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`tela-${screenId}`).classList.add('active');
  currentScreen = screenId;
}

function goToNextGame(currentGame) {
  if (currentGame === 'memoria') {
    currentGameIdx = 1;
    showScreen('adivinhe');
    startAdivinhe();
  } else if (currentGame === 'adivinhe') {
    currentGameIdx = 2;
    showScreen('quizz');
    initQuizz();
  } else if (currentGame === 'quizz') {
    showScreen('parabens');
  }
}

// Compartilhar
async function compartilharPrint() {
  const elemento = document.getElementById('compartilhar-container');
  if (!elemento) return;
  try {
    const canvas = await html2canvas(elemento, {
      scale: 2,
      backgroundColor: '#39252c',
      logging: false,
      useCORS: true
    });
    const imgData = canvas.toDataURL('image/png');
    if (navigator.share) {
      const blob = await (await fetch(imgData)).blob();
      const file = new File([blob], 'tarde_chocolate.png', { type: 'image/png' });
      await navigator.share({
        title: 'Tarde do Chocolate!',
        text: 'Participei da Tarde do Chocolate na Bioage Tubarão!',
        files: [file]
      });
    } else {
      const link = document.createElement('a');
      link.download = 'tarde_chocolate.png';
      link.href = imgData;
      link.click();
      alert('Print salvo! Compartilhe nos stories do Instagram.');
    }
  } catch (err) {
    alert('Não foi possível gerar o print, mas você pode tirar um print manual.');
    console.error(err);
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-jogar').addEventListener('click', () => {
    currentGameIdx = 0;
    showScreen('memoria');
    initMemoryGame();
  });
  
  document.querySelectorAll('.opcao-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const produto = e.currentTarget.getAttribute('data-produto');
      verificarResposta(produto);
    });
  });
  
  document.getElementById('btn-verdadeiro').addEventListener('click', () => responderQuizz(true));
  document.getElementById('btn-falso').addEventListener('click', () => responderQuizz(false));
  
 // document.getElementById('btn-compartilhar').addEventListener('click', compartilharPrint);
});
// ========== TELA DE PARABÉNS – COM CÂMERA + GUIA CIRCULAR + COMPARTILHAMENTO ==========
let stream = null;
let fotoCapturada = null;

// Conecta botão da tela de parabéns
function conectarBotaoParabens() {
  const btn = document.getElementById('btn-tirar-foto');
  if (btn) {
    btn.removeEventListener('click', handlerTirarFoto);
    btn.addEventListener('click', handlerTirarFoto);
    console.log('✅ Botão "Tirar foto" conectado');
  } else {
    setTimeout(conectarBotaoParabens, 500);
  }
}

// Handler principal: abre a câmera com guia
async function handlerTirarFoto() {
  // Abre o modal da câmera
  const modal = document.getElementById('camera-modal');
  const video = document.getElementById('camera-video');
  modal.style.display = 'flex';
  
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.error('Erro ao acessar câmera:', err);
    alert('Não foi possível acessar a câmera. Usando galeria.');
    fecharCamera();
    abrirGaleria();
    return;
  }
  
  // Botão capturar
  const btnCapturar = document.getElementById('btn-capturar');
  const btnFechar = document.getElementById('btn-fechar-camera');
  btnCapturar.onclick = () => capturarFoto(video);
  btnFechar.onclick = () => fecharCamera();
}

function fecharCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  const modal = document.getElementById('camera-modal');
  modal.style.display = 'none';
}

function capturarFoto(video) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  // Agora o vídeo já está visualmente espelhado pelo CSS, mas a fonte original não está.
  // Para que a foto saia igual ao preview, precisamos desenhar espelhado também.
  // Porém, o vídeo original (sem CSS) está normal, então vamos aplicar o espelhamento no canvas.
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();
  
  const imgCompleta = new Image();
  imgCompleta.onload = () => {
    const tamanho = 560;
    const menorLado = Math.min(imgCompleta.width, imgCompleta.height);
    const offsetX = (imgCompleta.width - menorLado) / 2;
    const offsetY = (imgCompleta.height - menorLado) / 2;
    const canvasQuad = document.createElement('canvas');
    canvasQuad.width = tamanho;
    canvasQuad.height = tamanho;
    const ctxQuad = canvasQuad.getContext('2d');
    ctxQuad.drawImage(imgCompleta, offsetX, offsetY, menorLado, menorLado, 0, 0, tamanho, tamanho);
    const fotoPronta = canvasQuad.toDataURL();
    fecharCamera();
    gerarStoryCompartilhar(fotoPronta);
  };
  imgCompleta.src = canvas.toDataURL();
}

function abrirGaleria() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      await gerarStoryCompartilhar(event.target.result);
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// Função auxiliar para carregar imagens (já adaptada para Netlify)
function carregarImagemSegura(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar ${url}`));
    img.src = url;
  });
}

function recortarQuadradoCentral(img, tamanhoFinal) {
  const canvas = document.createElement('canvas');
  canvas.width = tamanhoFinal;
  canvas.height = tamanhoFinal;
  const ctx = canvas.getContext('2d');
  
  // Calcula o menor lado da imagem
  const menorLado = Math.min(img.width, img.height);
  // Coordenadas para recortar o centro
  const x = (img.width - menorLado) / 2;
  const y = (img.height - menorLado) / 2;
  
  ctx.drawImage(img, x, y, menorLado, menorLado, 0, 0, tamanhoFinal, tamanhoFinal);
  return canvas.toDataURL();
}

// Gera o canvas 9:16 com fundo, logo e foto do usuário
async function gerarStoryCompartilhar(fotoProntaURL) {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Fundo
  try {
    const fundoImg = await carregarImagemSegura('fundobg.png');
    ctx.drawImage(fundoImg, 0, 0, width, height);
  } catch {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#39252c');
    grad.addColorStop(1, '#2a1a1f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, width, height);

  // Textos
  ctx.font = 'bold 52px "Poppins", sans-serif';
  ctx.fillStyle = '#fef3e4';
  ctx.shadowBlur = 12;
  ctx.textAlign = 'center';
  ctx.fillText('#eufui!', width/2, 200);
  ctx.font = 'bold 190px "Great Vibes", cursive';
  ctx.fillText('Tarde do', width/2, 420);
  ctx.fillText('chocolate!', width/2, 550);

  // Círculo e foto
  const raio = 380;
  const centerX = width/2;
  const centerY = 1100;
  ctx.beginPath();
  ctx.arc(centerX, centerY, raio+12, 0, Math.PI*2);
  ctx.fillStyle = '#123372';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX, centerY, raio, 0, Math.PI*2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const foto = new Image();
  foto.src = fotoProntaURL;
  await new Promise(resolve => { foto.onload = resolve; });
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, raio-8, 0, Math.PI*2);
  ctx.clip();
  ctx.drawImage(foto, centerX - (raio-8), centerY - (raio-8), (raio-8)*2, (raio-8)*2);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(centerX, centerY, raio+4, 0, Math.PI*2);
  ctx.strokeStyle = '#123372';
  ctx.lineWidth = 14;
  ctx.stroke();

  // Logo
  try {
    const logoImg = await carregarImagemSegura('bioLogo.png');
    const logoSize = 180;
    ctx.drawImage(logoImg, width/2 - logoSize/2, height-240, logoSize, logoSize);
  } catch {
    ctx.font = 'bold 42px "Poppins", sans-serif';
    ctx.fillStyle = '#fef3e4';
    ctx.fillText('bioage skincare', width/2, height-150);
  }

  // Compartilhar
  canvas.toBlob(async (blob) => {
    if (!blob) return alert('Erro ao gerar imagem');
    const file = new File([blob], 'tarde_chocolate_story.png', { type: 'image/png' });
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Tarde do Chocolate!', text: 'Participei da Tarde do Chocolate na Bioage! #eufui', files: [file] });
        alert('Compartilhado! Publique nos Stories do Instagram.');
      } catch {
        salvarImagem(blob);
      }
    } else {
      salvarImagem(blob);
    }
  }, 'image/png');
}

function salvarImagem(blob) {
  const link = document.createElement('a');
  link.download = 'tarde_chocolate_story.png';
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
  alert('Imagem salva! Abra o Instagram, crie um Story e adicione esta imagem marcando @bioagetubaraosc.');
}

// Inicia o botão
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', conectarBotaoParabens);
} else {
  conectarBotaoParabens();
}