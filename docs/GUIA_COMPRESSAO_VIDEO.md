# 🎬 Guia de Compressão de Vídeo

## ⚠️ Problema
Vídeos grandes no Azure Blob Storage demoram muito para carregar, causando má experiência para os alunos.

## ✅ Solução: Comprimir Vídeos Antes do Upload

### 📊 Tamanhos Recomendados
- **Vídeos de Apresentação**: Máximo **50 MB**
- **Vídeos de Aulas**: Máximo **100 MB** (podem ser um pouco maiores)
- **Resolução**: 720p ou 1080p (não use 4K)
- **Formato**: MP4 (H.264)

---

## 🛠️ Ferramentas de Compressão

### 1. **HandBrake** (Recomendado - Grátis e Fácil)
**Download**: https://handbrake.fr/

**Como usar:**
1. Abra o HandBrake
2. Selecione seu vídeo original
3. Escolha o preset: **"Fast 1080p30"** ou **"Fast 720p30"**
4. Clique em **"Start Encode"**
5. Aguarde a compressão

**Configurações manuais (se necessário):**
- **Video Codec**: H.264 (x264)
- **Framerate**: 30 fps (ou igual ao original)
- **Quality**: RF 23 (ajuste se necessário: menor = melhor qualidade, maior = menor arquivo)
- **Audio Codec**: AAC
- **Audio Bitrate**: 128 kbps

---

### 2. **FFmpeg** (Linha de Comando - Avançado)
**Download**: https://ffmpeg.org/

**Comando básico:**
```bash
ffmpeg -i video_original.mp4 -vcodec h264 -crf 23 -preset medium -acodec aac -b:a 128k video_comprimido.mp4
```

**Comando otimizado para 720p:**
```bash
ffmpeg -i video_original.mp4 -vf "scale=1280:720" -vcodec h264 -crf 23 -preset medium -acodec aac -b:a 128k video_720p.mp4
```

**Comando otimizado para 1080p:**
```bash
ffmpeg -i video_original.mp4 -vf "scale=1920:1080" -vcodec h264 -crf 23 -preset medium -acodec aac -b:a 128k video_1080p.mp4
```

**Parâmetros:**
- `-crf 23`: Qualidade (18-28, menor = melhor qualidade)
- `-preset medium`: Velocidade de compressão (ultrafast, fast, medium, slow)
- `-vf "scale=1280:720"`: Redimensionar para 720p

---

### 3. **Online (Sem Instalação)**

#### **CloudConvert** (https://cloudconvert.com/)
1. Faça upload do vídeo
2. Escolha formato: MP4
3. Configure qualidade: **Medium** ou **High**
4. Clique em **Convert**

#### **FreeConvert** (https://www.freeconvert.com/)
1. Faça upload do vídeo
2. Escolha formato: MP4
3. Configure qualidade: **Medium**
4. Clique em **Convert**

---

## 📏 Como Verificar o Tamanho

### Windows:
- Clique com botão direito no arquivo → **Propriedades** → Veja o tamanho

### Mac:
- Clique com botão direito no arquivo → **Obter Informações** → Veja o tamanho

### Linha de Comando:
```bash
# Windows PowerShell
(Get-Item video.mp4).Length / 1MB

# Mac/Linux
ls -lh video.mp4
```

---

## 🎯 Exemplo Prático

**Antes da compressão:**
- Tamanho: 500 MB
- Resolução: 4K (3840x2160)
- Duração: 5 minutos
- ⚠️ Demora muito para carregar

**Após compressão:**
- Tamanho: 45 MB ✅
- Resolução: 1080p (1920x1080)
- Duração: 5 minutos (mesma)
- ✅ Carrega rápido!

---

## 💡 Dicas Adicionais

1. **Corte partes desnecessárias**: Remova silêncios, erros, repetições
2. **Use 30 fps**: A menos que seja necessário, 30 fps é suficiente
3. **Comprima áudio**: 128 kbps é suficiente para voz
4. **Teste antes**: Sempre teste o vídeo comprimido antes de fazer upload
5. **Mantenha qualidade**: Não comprima demais, senão fica pixelado

---

## 🚀 Resultado Esperado

Após comprimir corretamente:
- ✅ Vídeos carregam em **5-10 segundos** (em vez de minutos)
- ✅ Melhor experiência para os alunos
- ✅ Menos custos de armazenamento no Azure
- ✅ Menos uso de banda

---

## ❓ Problemas Comuns

**"O vídeo ficou muito pixelado"**
- Use `-crf 20` ou `-crf 18` (melhor qualidade)
- Não reduza muito a resolução

**"A compressão está demorando muito"**
- Use `-preset fast` ou `-preset ultrafast`
- Compressão mais rápida = arquivo um pouco maior

**"O vídeo ainda está grande"**
- Reduza a resolução para 720p
- Use `-crf 25` ou `-crf 28`
- Corte partes desnecessárias

---

## 📚 Recursos Adicionais

- **HandBrake Documentation**: https://handbrake.fr/docs/
- **FFmpeg Documentation**: https://ffmpeg.org/documentation.html
- **Guia de Codecs**: https://trac.ffmpeg.org/wiki/Encode/H.264

