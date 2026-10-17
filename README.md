# 📄 PDF Studio Web

<p align="center">
  <strong>Uma suíte web completa, moderna e 100% privada para mesclar, converter e manipular PDFs diretamente no seu navegador.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Licen%C3%A7a-MIT-blue.svg" alt="Licença MIT">
  <img src="https://img.shields.io/badge/Processamento-100%25%20Client--Side-brightgreen.svg" alt="100% Client-side">
  <img src="https://img.shields.io/badge/Privacidade-Total-success.svg" alt="Privacidade Total">
  <img src="https://img.shields.io/badge/Depend%C3%AAncias-Offline%20Vendored-orange.svg" alt="Offline">
</p>

---

## 🌐 Demonstração Online (GitHub Pages)

Você pode usar o aplicativo diretamente online, sem instalar nada:
👉 **[https://postrenan.github.io/pdf-studio-web/](https://postrenan.github.io/pdf-studio-web/)**

---

## 🔒 Privacidade e Segurança em Primeiro Lugar

Diferente da maioria das ferramentas online de PDF:
- **Nenhum arquivo é enviado para servidores externos.**
- Todo o processamento (conversão, leitura de texto, renderização e mesclagem) ocorre **exclusivamente na memória RAM do seu navegador**.
- Os arquivos e miniaturas continuam 100% seguros na sua própria máquina.
- Funciona perfeitamente mesmo **sem conexão com a internet**.

---

## ✨ Funcionalidades

### 1. 🔀 Mesclador Multi-Formato com Drag & Drop
- **Misture diferentes extensões**: Arraste arquivos de vários tipos para a mesma lista:
  - 📕 **PDF** (`.pdf`)
  - 📘 **Word** (`.docx`, `.doc`)
  - 📗 **Imagens** (`.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`)
  - 📙 **Texto** (`.txt`)
- **Reordenação Livre**: Arraste os cards para definir exatamente a ordem final das páginas no documento unificado.
- **Giro Individual de Páginas**: Botão em cada card para girar PDFs ou fotos em 90°, 180° ou 270°.
- **Ajuste de Formato**: Escolha entre ajustar imagens proporcionalmente para folha padrão A4 ou manter as dimensões originais.
- **Miniaturas em Tempo Real**: Pré-visualize a capa de cada arquivo antes de mesclar.

---

### 2. 🧰 Central de Conversões e Ferramentas Rápidas

Aba dedicada com ferramentas práticas de 1 clique:

| Ferramenta | Descrição |
|---|---|
| 📝 **Word (DOCX) para PDF** | Converte documentos `.docx` em arquivos PDF formatados de alta resolução. |
| 🖼️ **PDF para Imagens (ZIP)** | Extrai todas as páginas de um PDF como imagens PNG ou JPG e baixa tudo compactado em `.zip`. |
| ✂️ **Dividir / Extrair Páginas** | Extrai intervalos selecionados (ex: `1-3, 5, 8-10`) gerando um novo PDF separado. |
| 🔄 **Girar Páginas do PDF** | Rotaciona todas as páginas do PDF em 90°, 180° ou 270°. |
| 📋 **PDF para Texto (.txt)** | Extrai todo o conteúdo de texto do documento para um arquivo `.txt`. |
| 📸 **Imagens para PDF** | Agrupa múltiplas fotos em um único arquivo PDF com paginação limpa. |

---

## 🚀 Como Executar Localmente

### Opção 1: Sem Instalação (Mais Simples)
Clone o repositório ou baixe o ZIP e dê dois cliques no arquivo [`index.html`](./index.html):
```bash
git clone https://github.com/postrenan/pdf-studio-web.git
cd pdf-studio-web
# Abra o index.html no navegador
```

### Opção 2: Servidor Local com Node.js
```bash
npm start
```
Ou:
```bash
npx serve .
```

### Opção 3: Servidor Local com Python
```bash
python -m http.server 8080
```
Acesse `http://localhost:8080` no navegador.

---

## 🛠️ Tecnologias e Bibliotecas Utilizadas

Todas as bibliotecas estão pré-instaladas localmente na pasta `vendor/` para garantir funcionamento offline e conformidade com políticas de segurança:
- [**pdf-lib**](https://pdf-lib.js.org/): Criação, mesclagem e rotação vetorial de documentos PDF.
- [**PDF.js (Mozilla)**](https://mozilla.github.io/pdf.js/): Renderização das páginas, geração de miniaturas e extração de texto.
- [**Mammoth.js**](https://github.com/mwilliamson/mammoth.js): Conversão e parsing de arquivos Word `.docx` para HTML estruturado.
- [**html2canvas**](https://html2canvas.hertzen.com/): Renderização de documentos em páginas A4 com alta fidelidade visual.
- [**JSZip**](https://stuk.github.io/jszip/): Compactação das imagens extraídas de PDFs em arquivos ZIP.
- [**SortableJS**](https://sortablejs.github.io/Sortable/): Reordenação fluida e acessível via arrastar e soltar (Drag & Drop).

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE). Você pode utilizar, modificar e distribuir livremente.
