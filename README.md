# 🩺 Transcrição Clínica e PEP AI

> **Suporte Digital Inteligente à Documentação em Saúde com IA (MedASR + Gemini)**  
> Transcrição médica em tempo real, diarização de interlocutores (Médico vs. Paciente), documentação estruturada nos formatos **SOAP Integral** e **Anamnese PEP**, extração automática de medicamentos, alergias e **CID-10**, com privacidade e conformidade **LGPD**.

---

##  Visão Geral

O **Transcrição Clínica & PEP AI** foi desenvolvido para reduzir o tempo que médicos e profissionais de enfermagem gastam preenchendo prontuários eletrônicos (PEP), permitindo foco total na relação médico-paciente.

A aplicação processa o diálogo da consulta (presencial via microfone, remota via telemedicina ou por upload de arquivo gravado), reconhece terminologia semiológica e farmacológica com precisão clínica e gera instantaneamente a documentação estruturada pronta para cópia em sistemas de prontuário (Tasy, MV Soul, iClinic, Prontmed, ProDoctor, etc.).

---

##  Principais Funcionalidades

###  1. Captura de Áudio Multicanal
* **Microfone do Consultório:** Gravação local (`getUserMedia`) com filtros ativos de cancelamento de eco, supressão de ruído ambiente e controle automático de ganho.
* **Aba / Telemedicina:** Captura direta de áudio de reuniões remotas (`getDisplayMedia`) no Google Meet, Zoom, Teams ou WhatsApp Web.
* **Upload de Áudio Gravado:** Suporte para arquivos `.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm` e `.aac`.
* **Osciloscópio Acústico em Tempo Real:** Visualizador em canvas HTML5 conectado a `AudioContext` e `AnalyserNode`.
* **Pausar e Retomar:** Permite interromper a escuta temporariamente durante exame físico ou ligações telefônicas.
* **Cronômetro Clínico:** Contador do tempo de duração do atendimento.

###  2. Geração Multidocumental com IA
* **SOAP Integral (S.O.A.P.):**
  * **S — Subjetivo:** História relatada pelo paciente redigida tecnicamente em 3ª pessoa.
  * **O — Objetivo:** Sinais vitais relatados, achados do exame físico e inspeção.
  * **A — Avaliação:** Hipóteses diagnósticas principais e diferenciais estratificadas.
  * **P — Plano:** Conduta médica, prescrições com posologia, exames complementares e critérios de retorno.
* **Anamnese Tradicional (Prontuário PEP):** Queixa Principal, HMA, Antecedentes Pessoais/Cirúrgicos, Hábitos de Vida, Alergias e Hipótese/Conduta.
* **Orientações Didáticas ao Paciente:** Resumo acolhedor em linguagem simples com orientações de uso dos medicamentos e sinais de alarme, com botão de cópia rápida para envio via WhatsApp.

###  3. Extração Automática de Entidades Médicas
* **Medicamentos Estruturados:** Nome do princípio ativo ou comercial, dosagem, frequência, posologia e via de administração em cards clicáveis.
  **Alerta de Alergias:** Destaque visual em badge vermelho de segurança do paciente para evitar prescrições inadvertidas.
* **Sugestão de CID-10 e CIAP-2:** Codificação diagnóstica recomendada com código oficial e descrição.
* **Sinais de Alarme (Red Flags):** Identificação de critérios de gravidade clínica.

### 4. Diarização e Separação de Falas
* Identificação de quem está falando em cada turno:
  *  `[Profissional de Saúde]`
  *  `[Paciente / Acompanhante]`
* Alternância com 1 clique diretamente na tag do segmento.
* Botão de **Diarização Automática com IA** para classificação semântica retroativa.

### 5. Privacidade e Conformidade LGPD
* **Modo Anonimizado com 1 Clique:** Mascara automaticamente nomes próprios, CPFs, RGs, números de telefone e e-mails (`[CPF-PROTEGIDO]`, `[PACIENTE-ANONIMIZADO]`).
* Não armazena dados de pacientes em servidores externos de terceiros.

### 6. Produtividade e Integração
* **Cópia Modular:** Botões de cópia individual por bloco (ex: *Copiar apenas o Subjetivo*, *Copiar apenas a Conduta*, *Copiar Medicamento*) para colar nos campos do prontuário.
* **Impressão Formal e PDF:** Modal de visualização com cabeçalho de prontuário eletrônico, data/hora formatada, campo de carimbo/assinatura e suporte nativo a `@media print`.
* **Histórico de Atendimentos:** Consultas salvas localmente no navegador (`localStorage`) para recuperação rápida durante o plantão.
* **Caso Clínico Demonstrativo:** Botão de 1 clique para injetar um caso real de cardiologia para demonstração imediata da inteligência clínica.

---

## Tecnologias Utilizadas

* **Frontend:**
  * [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  * [Vite](https://vitejs.dev/)
  * [Tailwind CSS](https://tailwindcss.com/)
  * [Lucide React](https://lucide.dev/) (Ícones clínicos)
  * Web Audio API (`AudioContext`, `AnalyserNode`, `MediaStreamAudioSourceNode`)
  * Web Speech API (`webkitSpeechRecognition`)
* **Backend:**
  * [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
  * [tsx](https://github.com/privatenumber/tsx)
  * [@google/genai SDK](https://www.npmjs.com/package/@google/genai)
  * Modelos Gemini (`gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.5-transcribe`) com fallbacks de alta disponibilidade

---

## Estrutura de Arquivos

```
├── App.tsx                          # Componente raiz com orquestração de layouts e modais
├── components/
│   ├── AudioWaveform.tsx            # Visualizador osciloscópio em canvas HTML5
│   ├── ClinicalPrintModal.tsx       # Modal de impressão formal e exportação PDF
│   ├── ConsultationHistoryModal.tsx # Histórico de consultas da sessão local
│   ├── ControlPanel.tsx             # Painel de controle (Mic, Aba, Arquivo, Pausa, Timer)
│   ├── SoapView.tsx                 # Hub de documentação clínica (SOAP, PEP, Entidades, LGPD)
│   └── TranscriptView.tsx           # Painel de transcrição com tags de diarização e busca
├── hooks/
│   └── useGeminiTranslation.ts      # Hook principal de áudio, transcrição e integração com a IA
├── utils/
│   ├── audioUtils.ts                # Conversores de áudio e PCM
│   └── clinicalUtils.ts             # Funções de anonimização LGPD, datas e base64
├── server.ts                        # Servidor Express com rotas de API do Gemini e Vite middlewares
├── types.ts                         # Interfaces TypeScript (SOAP, Anamnese, Entidades, etc.)
├── metadata.json                    # Permissões do applet (microfone, display-capture)
├── package.json
└── vite.config.ts
```

---

## Pré-requisitos e Instalação

### Pré-requisitos
* **Node.js** v18 ou superior
* Gerenciador de pacotes **npm** ou **pnpm**
* Chave de API do **Google Gemini** ([Google AI Studio](https://aistudio.google.com/))

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/transcricao-clinica-pep.git
   cd transcricao-clinica-pep
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz baseado no `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Abra o arquivo `.env` e adicione a sua chave de API:
   ```env
   GEMINI_API_KEY=sua_chave_gemini_aqui
   PORT=3000
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse no navegador:**
   Abra [http://localhost:3000](http://localhost:3000)

---

##  Como Testar a Aplicação

1. **Teste Imediato (Sem Microfone):**
   * Clique no botão **"Caso Demonstrativo"** ou **"Caso Exemplo (Teste Rápido)"**.
   * A transcrição de uma consulta cardiológica completa com diálogo entre médico e paciente será carregada.
   * Clique em **"Gerar Prontuário & SOAP Completo"** para ver a geração automática do SOAP, Anamnese, Medicamentos estruturados, Alergias destacadas e sugestões de CID-10.
   * Teste os botões de **"LGPD Ativa"** e **"Imprimir / Salvar PDF"**.

2. **Teste com Microfone (Consulta Presencial):**
   * Selecione a aba **"Microfone"**.
   * Clique em **"Iniciar Microfone"** e conceda a permissão no navegador.
   * Fale os sintomas e orientações da consulta. As falas aparecerão em tempo real.
   * Clique em **"Finalizar"** e depois em **"Gerar Prontuário & SOAP Completo"**.

3. **Teste com Telemedicina (Google Meet / Zoom):**
   * Selecione a aba **"Aba / Telemedicina"**.
   * Clique em **"Selecionar Guia / Tela"** e marque a opção **"Compartilhar áudio da guia"**.
   * O áudio do paciente e do médico será captado diretamente da conferência.

4. **Teste com Arquivo Gravado:**
   * Selecione a aba **"Arquivo Gravado"** e faça upload de um arquivo de áudio (`.mp3`, `.m4a`, `.wav`).

---

##  Conformidade Ética e Legal

* **Aviso de Supervisão Profissional:** Esta aplicação constitui ferramenta de apoio tecnológico à documentação e produtividade clínica. O diagnóstico final, a prescrição terapêutica e a validação do registro em prontuário são de exclusiva responsabilidade do profissional de saúde devidamente habilitado (conforme resoluções do **CFM** e **COFEN**).
* **Privacidade e LGPD:** O sistema disponibiliza filtros de anonimização e não compartilha dados de pacientes com terceiros.

---

## 📄 Licença

Consulte `LICENSE` para mais informações.
