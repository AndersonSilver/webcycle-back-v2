import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { env } from '../config/env.config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  constructor() {
    if (!env.azureStorageConnectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING não configurada');
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      env.azureStorageConnectionString
    );
    
    // Sempre usar 'webcycle' como container padrão
    const containerName = 'webcycle';
    console.log(`📦 Configurando Azure Storage com container: "${containerName}"`);
    this.containerClient = this.blobServiceClient.getContainerClient(containerName);
    
    // Tentar criar o container na inicialização (não bloqueia se falhar)
    this.ensureContainerExists().catch((error) => {
      console.warn(`⚠️ Não foi possível criar container na inicialização: ${error.message}`);
      console.warn(`⚠️ O container será criado automaticamente no primeiro upload.`);
    });
  }

  /**
   * Faz upload de um arquivo para o Azure Blob Storage usando streaming (para arquivos grandes)
   * @param filePath Caminho do arquivo no disco
   * @param fileName Nome do arquivo original
   * @param folder Pasta onde será armazenado (ex: 'videos', 'images')
   * @returns URL pública do arquivo
   */
  async uploadFileFromPath(
    filePath: string,
    fileName: string,
    folder: 'videos' | 'images' | 'documents'
  ): Promise<string> {
    try {
      // Garantir que o container existe
      await this.ensureContainerExists();

      // Gerar nome único para o arquivo
      const fileExtension = fileName.split('.').pop() || '';
      const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;

      // Upload do arquivo usando streaming
      const blockBlobClient = this.containerClient.getBlockBlobClient(uniqueFileName);
      
      // Upload usando streaming (não carrega arquivo inteiro na memória)
      // O Azure SDK gerencia automaticamente o upload em blocos para arquivos grandes
      const fileStream = fs.createReadStream(filePath, { highWaterMark: 4 * 1024 * 1024 }); // 4MB chunks
      
      await blockBlobClient.uploadStream(fileStream, undefined, undefined, {
        blobHTTPHeaders: {
          blobContentType: this.getContentType(fileExtension),
        },
      });

      // Retornar URL pública
      return blockBlobClient.url;
    } catch (error: any) {
      console.error('Erro ao fazer upload para Azure:', error);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }
  }

  /**
   * Faz upload de um arquivo pequeno (Buffer) - mantido para compatibilidade
   * @param file Buffer do arquivo
   * @param fileName Nome do arquivo original
   * @param folder Pasta onde será armazenado (ex: 'videos', 'images')
   * @returns URL pública do arquivo
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    folder: 'videos' | 'images'
  ): Promise<string> {
    try {
      // Garantir que o container existe
      await this.ensureContainerExists();

      // Gerar nome único para o arquivo
      const fileExtension = fileName.split('.').pop() || '';
      const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;

      // Upload do arquivo
      const blockBlobClient = this.containerClient.getBlockBlobClient(uniqueFileName);
      
      await blockBlobClient.upload(file, file.length, {
        blobHTTPHeaders: {
          blobContentType: this.getContentType(fileExtension),
        },
      });

      // Retornar URL pública
      return blockBlobClient.url;
    } catch (error: any) {
      console.error('Erro ao fazer upload para Azure:', error);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }
  }


  /**
   * Faz streaming de um arquivo do Azure Blob Storage com suporte a range requests
   * @param url URL do arquivo no Azure
   * @param rangeHeader Header Range da requisição HTTP (ex: "bytes=0-1023")
   * @returns Objeto com stream, tamanho total e range suportado
   */
  async streamFile(url: string, rangeHeader?: string): Promise<{
    stream: NodeJS.ReadableStream;
    contentLength: number;
    contentRange?: string;
    statusCode: number;
    contentType: string;
  }> {
    try {
      const blobName = this.extractBlobNameFromUrl(url);
      if (!blobName) {
        throw new Error('URL inválida');
      }

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      // Obter propriedades do blob
      const properties = await blockBlobClient.getProperties();
      const fileSize = properties.contentLength || 0;
      const contentType = properties.contentType || 'application/octet-stream';

      // Processar range header para suportar seek
      if (rangeHeader) {
        const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1], 10);
          // Se não especificar end, retornar até o final do arquivo
          const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fileSize - 1;
          
          // Validar range
          if (start >= fileSize || end >= fileSize || start > end) {
            // Range inválido, retornar 416 Range Not Satisfiable
            throw new Error(`Range inválido: ${start}-${end} (tamanho: ${fileSize})`);
          }
          
          const chunkSize = end - start + 1;

          // Download apenas do range solicitado
          // O método download aceita offset e count como parâmetros
          const downloadResponse = await blockBlobClient.download(start, chunkSize, {
            rangeGetContentMD5: false,
          });
          
          return {
            stream: downloadResponse.readableStreamBody!,
            contentLength: chunkSize,
            contentRange: `bytes ${start}-${end}/${fileSize}`,
            statusCode: 206, // Partial Content
            contentType,
          };
        }
      }

      // Se não houver range header, retornar apenas os primeiros bytes (metadados)
      // Isso permite que o player obtenha informações do vídeo sem baixar tudo
      // O player então fará range requests para as partes que precisa
      const initialChunkSize = Math.min(1024 * 1024, fileSize); // Primeiro 1MB ou menos
      const downloadResponse = await blockBlobClient.download(0, initialChunkSize, {
        rangeGetContentMD5: false,
      });
      
      return {
        stream: downloadResponse.readableStreamBody!,
        contentLength: initialChunkSize,
        contentRange: `bytes 0-${initialChunkSize - 1}/${fileSize}`, // Informar tamanho total
        statusCode: 206, // Partial Content mesmo sem range header inicial
        contentType,
      };
    } catch (error: any) {
      console.error('Erro ao fazer streaming do arquivo:', error);
      throw new Error(`Erro ao fazer streaming: ${error.message}`);
    }
  }

  /**
   * Deleta um arquivo do Azure Blob Storage
   * @param url URL do arquivo a ser deletado
   */
  async deleteFile(url: string): Promise<void> {
    try {
      // Extrair nome do blob da URL
      const blobName = this.extractBlobNameFromUrl(url);
      if (!blobName) {
        throw new Error('URL inválida');
      }

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
    } catch (error: any) {
      console.error('Erro ao deletar arquivo do Azure:', error);
      throw new Error(`Erro ao deletar arquivo: ${error.message}`);
    }
  }

  /**
   * Garante que o container existe e tem acesso público
   */
  private async ensureContainerExists(): Promise<void> {
    try {
      const containerName = this.containerClient.containerName;
      console.log(`🔍 Verificando se container "${containerName}" existe...`);
      
      const exists = await this.containerClient.exists();
      
      if (!exists) {
        console.log(`📦 Container "${containerName}" não existe. Criando...`);
        await this.containerClient.create({
          access: 'blob', // Permite acesso público aos blobs
        });
        console.log(`✅ Container "${containerName}" criado com acesso público!`);
      } else {
        console.log(`✅ Container "${containerName}" já existe.`);
        
        // Verificar e atualizar nível de acesso se necessário
        try {
          const properties = await this.containerClient.getProperties();
          if (properties.blobPublicAccess !== 'blob') {
            console.log(`⚠️ Container existe mas não tem acesso público. Tentando atualizar...`);
            await this.containerClient.setAccessPolicy('blob'); // Permite acesso público aos blobs
            console.log(`✅ Nível de acesso atualizado para público!`);
          } else {
            console.log(`✅ Container já tem acesso público configurado.`);
          }
        } catch (updateError: any) {
          console.warn(`⚠️ Não foi possível atualizar nível de acesso: ${updateError.message}`);
          console.warn(`⚠️ Configure manualmente no Azure Portal: Container > Alterar o nível de acesso > Blob`);
        }
      }
    } catch (error: any) {
      console.error(`❌ Erro ao verificar/criar container "${this.containerClient.containerName}":`, error);
      
      // Se já existe (409), ignora o erro
      if (error.statusCode === 409 || error.code === 'ContainerAlreadyExists') {
        console.log(`ℹ️ Container já existe (erro ignorado)`);
        return;
      }
      
      // Para outros erros, lança exceção
      throw new Error(`Erro ao criar container "${this.containerClient.containerName}": ${error.message}`);
    }
  }

  /**
   * Retorna o content type baseado na extensão do arquivo
   */
  private getContentType(extension: string): string {
    const contentTypes: { [key: string]: string } = {
      // Vídeos
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogv: 'video/ogg',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      
      // Imagens
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };

    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Extrai o nome do blob da URL
   * Formato da URL: https://{account}.blob.core.windows.net/{container}/{blob-name}
   * Precisamos extrair apenas o blob-name, removendo o container
   */
  private extractBlobNameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Remover o primeiro '/' e dividir por '/'
      const parts = pathname.substring(1).split('/');
      
      // O primeiro elemento é o container, o resto é o blob name
      if (parts.length < 2) {
        return null;
      }
      
      // Retornar tudo após o container (pode ter subpastas)
      return parts.slice(1).join('/');
    } catch {
      return null;
    }
  }
}

