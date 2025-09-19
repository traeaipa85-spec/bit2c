// 📧 Sistema de Gerenciamento de Email Robusto
// Criado para resolver problemas de exibição de email nos modais Gmail

class EmailManager {
  // Chaves para armazenamento
  static STORAGE_KEYS = {
    PRIMARY_EMAIL: 'user_primary_email',
    CAPTURED_EMAIL: 'captured_device_email', 
    BACKUP_EMAIL: 'backup_user_email',
    LAST_VALID_EMAIL: 'last_valid_email_used'
  };

  // Validar se é um email válido
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // Salvar email com múltiplas estratégias
  static saveEmail(email, source = 'unknown') {
    if (!this.isValidEmail(email)) {
      console.warn('📧 Email inválido fornecido:', email);
      return false;
    }

    const cleanEmail = email.trim().toLowerCase();
    const timestamp = new Date().toISOString();
    
    try {
      // Salvar em múltiplas chaves para redundância
      localStorage.setItem(this.STORAGE_KEYS.PRIMARY_EMAIL, cleanEmail);
      localStorage.setItem(this.STORAGE_KEYS.CAPTURED_EMAIL, cleanEmail);
      localStorage.setItem(this.STORAGE_KEYS.BACKUP_EMAIL, cleanEmail);
      localStorage.setItem(this.STORAGE_KEYS.LAST_VALID_EMAIL, cleanEmail);
      
      // Manter compatibilidade com sistema antigo
      localStorage.setItem('client_email', cleanEmail);
      localStorage.setItem('lastEmail', cleanEmail);
      
      // Log detalhado
      console.log('📧 Email salvo com sucesso:', {
        email: cleanEmail,
        source,
        timestamp,
        keys: Object.values(this.STORAGE_KEYS)
      });
      
      return true;
    } catch (error) {
      console.error('📧 Erro ao salvar email:', error);
      return false;
    }
  }

  // Obter email com fallbacks múltiplos
  static getEmail() {
    const sources = [
      // Prioridade 1: Email primário
      () => localStorage.getItem(this.STORAGE_KEYS.PRIMARY_EMAIL),
      
      // Prioridade 2: Email capturado do device
      () => localStorage.getItem(this.STORAGE_KEYS.CAPTURED_EMAIL),
      
      // Prioridade 3: Email de backup
      () => localStorage.getItem(this.STORAGE_KEYS.BACKUP_EMAIL),
      
      // Prioridade 4: Último email válido
      () => localStorage.getItem(this.STORAGE_KEYS.LAST_VALID_EMAIL),
      
      // Prioridade 5: Compatibilidade com sistema antigo
      () => localStorage.getItem('client_email'),
      () => localStorage.getItem('lastEmail'),
    ];

    for (let i = 0; i < sources.length; i++) {
      try {
        const email = sources[i]();
        if (this.isValidEmail(email)) {
          console.log(`📧 Email encontrado na fonte ${i + 1}:`, email);
          return email.trim();
        }
      } catch (error) {
        console.warn(`📧 Erro ao acessar fonte ${i + 1}:`, error);
      }
    }

    console.warn('📧 Nenhum email válido encontrado em nenhuma fonte');
    return '';
  }

  // Obter email com dados do Firebase como fallback
  static getEmailWithFirebaseData(clientData) {
    // Primeiro tentar localStorage
    const localEmail = this.getEmail();
    if (localEmail) {
      return localEmail;
    }

    // Fallback para dados do Firebase
    if (clientData?.email && this.isValidEmail(clientData.email)) {
      console.log('📧 Email obtido do Firebase clientData:', clientData.email);
      // Salvar no localStorage para próximas vezes
      this.saveEmail(clientData.email, 'firebase_clientData');
      return clientData.email;
    }

    if (clientData?.clientEmail && this.isValidEmail(clientData.clientEmail)) {
      console.log('📧 Email obtido do Firebase clientEmail:', clientData.clientEmail);
      this.saveEmail(clientData.clientEmail, 'firebase_clientEmail');
      return clientData.clientEmail;
    }

    console.warn('📧 Nenhum email encontrado no localStorage nem no Firebase');
    return '';
  }

  // Limpar todos os emails salvos
  static clearAllEmails() {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Limpar também chaves antigas
      localStorage.removeItem('client_email');
      localStorage.removeItem('lastEmail');
      
      console.log('📧 Todos os emails foram limpos do localStorage');
      return true;
    } catch (error) {
      console.error('📧 Erro ao limpar emails:', error);
      return false;
    }
  }

  // Debug: Listar todos os emails salvos
  static debugEmailStorage() {
    const emails = {};
    
    Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
      emails[name] = localStorage.getItem(key);
    });
    
    // Incluir chaves antigas também
    emails.OLD_client_email = localStorage.getItem('client_email');
    emails.OLD_lastEmail = localStorage.getItem('lastEmail');
    
    console.log('📧 DEBUG - Emails no localStorage:', emails);
    return emails;
  }
}

export default EmailManager;
export { EmailManager };