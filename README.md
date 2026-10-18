# 📄 PDF Studio Web (NAPS2 Web Edition)

<p align="center">
  <strong>A experiência completa do NAPS2 (Not Another PDF Scanner 2) diretamente no seu navegador, 100% offline, gratuito e com privacidade total.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vers%C3%A3o-2.0%20NAPS2%20Edition-blue.svg" alt="Versão 2.0">
  <img src="https://img.shields.io/badge/Licen%C3%A7a-MIT-green.svg" alt="Licença MIT">
  <img src="https://img.shields.io/badge/Processamento-100%25%20Navegador%20(Local)-brightgreen.svg" alt="100% Client-side">
  <img src="https://img.shields.io/badge/Privacidade-Absoluta-success.svg" alt="Privacidade Total">
</p>

---

## 🌐 Demonstração Online (GitHub Pages)

Acesse e use agora mesmo sem instalar nada:
👉 **[https://postrenan.github.io/pdf-studio-web/](https://postrenan.github.io/pdf-studio-web/)**

---

## 🧰 Recursos Inspirados no NAPS2

### 1. 📷 Digitalização (Scanner & Câmera)
- **Captura com Câmera / WebCam**: Digitalize documentos físicos usando sua webcam ou a câmera do celular/tablet com alta resolução.
- **Perfis de Digitalização**:
  - 🎨 *Colorido*: Documentos com fotos e ilustrações.
  - 📄 *Preto e Branco / Texto*: Alto contraste e binarização para recibos e textos nítidos sem ruído de fundo.
  - 🌫️ *Tons de Cinza*: Documentos monocromáticos suaves.

---

### 2. 📑 Grade Visual de Miniaturas por Página
- **Desempacotamento Individual**: Ao importar um PDF ou documento com várias páginas, cada página vira um card interativo separado.
- **Arraste e Solte (Drag & Drop)**: Reorganize a ordem das páginas livremente.
- **Slider de Zoom**: Ajuste o tamanho das miniaturas das páginas conforme sua preferência.
- **Seleção Múltipla**: Selecione várias páginas com clique, <kbd>Ctrl</kbd>+Clique, <kbd>Shift</kbd>+Clique ou <kbd>Ctrl</kbd>+<kbd>A</kbd>.

---

### 3. 🎨 Tratamento & Ajuste de Imagem (Image Editor)
Dê um clique duplo em qualquer página ou use o botão **Ajustar Imagem**:
- **Modos de Cor**:
  - *Colorido Original*
  - *Tons de Cinza*
  - *Preto e Branco (Limiar / Binarização)* com slider de sensibilidade ajustável para limpar sombras e manchas de digitalização.
  - *Inverter Cores (Negativo)*
- **Brilho e Contraste**: Sliders em tempo real (-100% a +100%).
- **Desentortar (Deskew)**: Rotação fina livre de -25° a +25° para corrigir folhas digitalizadas tortas.
- **Recorte de Margens (Crop)**: Ajuste de bordas superior, inferior, esquerda e direita.
- **Aplicação em Lote**: Aplique os mesmos ajustes em todas as páginas selecionadas de uma vez só!

---

### 4. 🔀 Organização Avançada & Duplex Manual
- **Intercalar Duplex (Assinatura NAPS2)**: O recurso mais famoso do NAPS2 para quem tem scanner comum sem frente e verso automático. Escaneie todas as frentes (1, 3, 5...), depois o verso (2, 4, 6... ou 6, 4, 2...), e o botão **Intercalar Duplex** reorganiza tudo perfeitamente (1, 2, 3, 4, 5, 6)!
- **Desintercalar**: Separa páginas ímpares e pares em duas metades.
- **Inverter Ordem (Reverse)**: Inverte a ordem das páginas do documento.
- **Girar & Espelhar**: Gire 90° à direita, 90° à esquerda, 180° e espelhe horizontalmente ou verticalmente.
- **Duplicar e Excluir**: Duplique páginas ou remova com a tecla <kbd>Delete</kbd>.

---

### 5. 🔍 OCR (Reconhecimento Óptico de Caracteres)
- Motor **Tesseract.js** embutido para reconhecer texto em imagens e documentos digitalizados em Português, Inglês ou Espanhol.
- Copie o texto com um clique ou baixe como arquivo `.txt`.

---

### 6. 🔄 Conversor Multi-Formato (PDF para Outros Modelos)
Converta páginas ou documentos inteiros diretamente no navegador com 1 clique:
- 📘 **PDF para Microsoft Word (`.docx`)**: Gera arquivos `.docx` nativos com páginas em alta fidelidade e texto editável.
- 📙 **PDF para Microsoft PowerPoint (`.pptx`)**: Transforma cada página do PDF em um slide de apresentação.
- 📊 **PDF para Microsoft Excel (`.xlsx` / `.csv`)**: Extrai linhas de dados e tabelas do documento para planilhas.
- 🖼️ **PDF para Imagens (PNG / JPG em ZIP)**: Extraia todas as páginas em imagens de alta resolução.
- 📝 **PDF para Texto Puro (`.txt`) & Markdown (`.md`)**: Conteúdo textual limpo com cabeçalhos estruturados.
- 🌐 **PDF para Página Web (`.html`)**: Cria uma página web autônoma e responsiva pronta para compartilhamento.

---

### 7. 💾 Salvar, Lotes & Impressão
- **Salvar PDF com Metadados**: Defina Título, Autor e Assunto no PDF final, com layout A4 ou dimensões originais.
- **Dividir em Lotes (Batch Split)**: Separe automaticamente o documento a cada N páginas ou gere um PDF para cada folha.
- **Imprimir**: Envie as páginas diretamente para a impressora com formatação limpa (<kbd>Ctrl</kbd>+<kbd>P</kbd>).
- **Compartilhar**: Envio rápido via Web Share API ou e-mail.

## 🛡️ Conformidade com a LGPD e Armazenamento de Dados

O **PDF Studio Web** segue rigorosamente os princípios da **Lei Geral de Proteção de Dados Pessoais (LGPD &ndash; Lei Federal nº 13.709/2018)**:

- 🔒 **Zero Armazenamento em Servidor (Zero-Storage Policy)**: A aplicação não possui backend, banco de dados ou sistemas de armazenamento em nuvem. Todo o processamento (mesclagem, conversão, OCR, tratamento de imagens) é realizado **exclusivamente na memória RAM local do seu navegador**.
- 🚫 **Sem Rastreamento ou Telemetria**: Não utilizamos cookies de rastreamento, Google Analytics, pixels ou identificadores pessoais.
- 🗑️ **Descarte Imediato**: Ao fechar ou atualizar a aba, todos os arquivos manipulados são destruídos da memória pelo navegador.
- 💼 **Documentos Sensíveis e Confidenciais**: Contratos, holerites, certidões, documentos de identidade e exames médicos podem ser manipulados com garantia absoluta de sigilo, pois nenhum dado transita pela internet.
- ⚖️ **Direitos do Titular (Art. 18 da LGPD)**: Como nenhum dado pessoal é armazenado ou retido pela aplicação, o controle do usuário sobre seus arquivos é pleno, instantâneo e irrevogável.

---

## 🚀 Como Executar Localmente

### Opção 1: Sem Instalação
Basta dar dois cliques no arquivo [`index.html`](./index.html) em qualquer navegador moderno.

### Opção 2: Servidor Local
```bash
npm start
# ou: npx serve .
# ou: python -m http.server 8080
```

---

## 🏗️ Estrutura e Arquitetura do Projeto

O projeto foi inteiramente refatorado em uma arquitetura modular desacoplada, separando estilos, serviços de processamento, gerenciamento de estado e componentes de interface:

```text
quick-newton/
├── index.html                     # Estrutura HTML da aplicação
├── styles.css                     # Ponto central de carregamento de estilos (@import)
├── css/                           # Estilos modulares organizados por componente
│   ├── variables.css              # Cores, espaçamentos e temas
│   ├── base.css                   # Reset, tipografia e layout geral
│   ├── ribbon.css                 # Barra de ferramentas superior
│   ├── actionBar.css              # Barra secundária de ações com páginas
│   ├── pageGrid.css               # Grade visual interativa de miniaturas
│   ├── modals.css                 # Estilos base para modais e overlays
│   ├── scanner.css                # Interface da câmera/digitalizador
│   ├── imageAdjust.css            # Painel e sliders do editor de imagem
│   ├── lgpd.css                   # Banner flutuante e modal LGPD
│   ├── print.css                  # Folha de estilos para impressão nativa
│   └── responsive.css             # Adaptação para celulares, tablets e telas touch
├── js/
│   ├── main.js                    # Ponto de entrada (boot e atalhos globais)
│   ├── state.js                   # Gerenciador de estado reativo (App.State)
│   ├── utils/
│   │   └── dom.js                 # Utilitários DOM, canvas e downloads (App.Utils)
│   ├── services/                  # Motores de processamento de documentos
│   │   ├── pdfService.js          # Desempacotamento e montagem com PDF-Lib (App.PdfService)
│   │   ├── imageService.js        # Filtros de pixel, limiar P&B e rotação (App.ImageService)
│   │   └── conversionService.js   # Exportação para DOCX, PPTX, XLSX, ZIP, TXT, MD, HTML
│   └── components/                # Componentes isolados de interface
│       ├── pageGrid.js            # Grade de páginas e ordenação SortableJS (App.PageGrid)
│       ├── ribbon.js              # Barra superior e drag & drop global (App.Ribbon)
│       ├── actionBar.js           # Rotação, duplex, zoom e seleção (App.ActionBar)
│       ├── scannerModal.js        # Câmera e captura de frames (App.ScannerModal)
│       ├── imageAdjustModal.js    # Editor ao vivo de imagens (App.ImageAdjustModal)
│       ├── savePdfModal.js        # Configurações de exportação PDF (App.SavePdfModal)
│       ├── converterModal.js      # Modal de conversão multiformato (App.ConverterModal)
│       ├── ocrModal.js            # Reconhecimento óptico Tesseract (App.OcrModal)
│       ├── batchSplitModal.js     # Divisão em lotes em ZIP (App.BatchSplitModal)
│       ├── lgpdModal.js           # Banner e modal de privacidade (App.LgpdModal)
│       └── categoryTabs.js        # Seletor de abas mobile estilo Docs/Excel (App.CategoryTabs)
└── vendor/                        # Bibliotecas locais para uso 100% offline
```

---

## 📄 Licença
Distribuído sob a licença [MIT](LICENSE).
