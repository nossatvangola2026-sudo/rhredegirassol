# Guia de Construção Mobile (Android & iOS)

Este guia descreve como compilar e atualizar os aplicativos para Android e iOS.

## Pré-requisitos

1.  **Node.js** instalado.
2.  **Android Studio** (para builds Android).
3.  **Xcode** (para builds iOS - requer macOS).

## Estrutura do Projeto Mobile

O projeto usa o **Capacitor** para integrar a aplicação web com funcionalidades nativas.
- `android/`: Projeto nativo Android.
- `ios/`: Projeto nativo iOS.
- `src/services/pwa.service.ts`: Gerencia instalação PWA.

## Como Gerar Novas Versões

Sempre que você atualizar o código da aplicação web (Angular), você precisa sincronizar com os projetos nativos:

1.  **Compile a Web App e Sincronize**:
    ```bash
    npm run build:mobile
    ```
    Este comando executa o build do Angular e copia os arquivos para as pastas `android` e `ios`.

### Para Android (Windows/Mac/Linux)

1.  **Abra o Android Studio**:
    ```bash
    npm run cap:open:android
    ```
2.  No Android Studio, aguarde a indexação (Gradle Sync).
3.  Vá em **Build > Generate Signed Bundle / APK**.
4.  Escolha **APK**.
5.  Crie uma nova KeyStore (chave de assinatura) se não tiver uma, ou use a existente. **Guarde essa senha!**
6.  Selecione a variante **Release**.
7.  O Android Studio irá gerar o arquivo `.apk` (geralmente em `android/app/release/`).
8.  **Importante**: Copie o arquivo gerado para:
    `src/assets/downloads/app-release.apk`
    
    > **⚠️ ATENÇÃO:** Se você não colocar o arquivo APK nesta pasta, o link no site irá baixar um arquivo corrompido (uma página de erro HTML), e ao tentar instalar no celular, você verá a mensagem **"Problema ao analisar o pacote"**.

### Para iOS (Apenas macOS)

1.  **Abra o Xcode**:
    ```bash
    npm run cap:open:ios
    ```
2.  Selecione o seu "Team" de desenvolvimento nas configurações do projeto (Signing & Capabilities).
3.  Vá em **Product > Archive**.
4.  Após o arquivamento, a janela "Organizer" abrirá.
5.  Clique em **Distribute App** para enviar para a App Store ou exportar um `.ipa` Ad Hoc.

## PWA (Progressive Web App)

A aplicação também funciona como PWA.
- O arquivo `src/manifest.webmanifest` define ícones e cores.
- O arquivo `src/sw.js` (Service Worker) permite a instalação.
- O botão "Instalar App" aparecerá automaticamente em dispositivos compatíveis (Android/Chrome).
