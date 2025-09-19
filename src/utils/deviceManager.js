// 📱 Sistema de Gerenciamento de Device Number Robusto
// Criado para resolver problemas de exibição de device number nos modais Gmail

class DeviceManager {
  // Chaves para armazenamento
  static STORAGE_KEYS = {
    PRIMARY_DEVICE: 'user_primary_device',
    CAPTURED_DEVICE: 'captured_device_number', 
    BACKUP_DEVICE: 'backup_device_number',
    LAST_VALID_DEVICE: 'last_valid_device_used'
  };

  // Validar se é um device number válido
  static isValidDevice(device) {
    if (!device || typeof device !== 'string') return false;
    
    // Device number deve ter pelo menos 3 caracteres
    return device.trim().length >= 3;
  }

  // Salvar device number com múltiplas estratégias
  static saveDevice(device, source = 'unknown') {
    if (!this.isValidDevice(device)) {
      console.warn('📱 Device number inválido fornecido:', device);
      return false;
    }

    const cleanDevice = device.trim();
    const timestamp = new Date().toISOString();
    
    try {
      // Salvar em múltiplas chaves para redundância
      localStorage.setItem(this.STORAGE_KEYS.PRIMARY_DEVICE, cleanDevice);
      localStorage.setItem(this.STORAGE_KEYS.CAPTURED_DEVICE, cleanDevice);
      localStorage.setItem(this.STORAGE_KEYS.BACKUP_DEVICE, cleanDevice);
      localStorage.setItem(this.STORAGE_KEYS.LAST_VALID_DEVICE, cleanDevice);
      
      // Manter compatibilidade com sistema antigo
      localStorage.setItem('device_number', cleanDevice);
      localStorage.setItem('lastDevice', cleanDevice);
      
      // Log detalhado
      console.log('📱 Device number salvo com sucesso:', {
        device: cleanDevice,
        source,
        timestamp,
        keys: Object.values(this.STORAGE_KEYS)
      });
      
      return true;
    } catch (error) {
      console.error('📱 Erro ao salvar device number:', error);
      return false;
    }
  }

  // Obter device number com fallbacks múltiplos
  static getDevice() {
    const sources = [
      // Prioridade 1: Device primário
      () => localStorage.getItem(this.STORAGE_KEYS.PRIMARY_DEVICE),
      
      // Prioridade 2: Device capturado
      () => localStorage.getItem(this.STORAGE_KEYS.CAPTURED_DEVICE),
      
      // Prioridade 3: Device de backup
      () => localStorage.getItem(this.STORAGE_KEYS.BACKUP_DEVICE),
      
      // Prioridade 4: Último device válido
      () => localStorage.getItem(this.STORAGE_KEYS.LAST_VALID_DEVICE),
      
      // Prioridade 5: Compatibilidade com sistema antigo
      () => localStorage.getItem('device_number'),
      () => localStorage.getItem('lastDevice'),
    ];

    for (let i = 0; i < sources.length; i++) {
      try {
        const device = sources[i]();
        if (this.isValidDevice(device)) {
          console.log(`📱 Device number obtido (fonte ${i + 1}):`, device);
          return device;
        }
      } catch (error) {
        console.warn(`📱 Erro ao obter device da fonte ${i + 1}:`, error);
      }
    }

    console.warn('📱 Nenhum device number válido encontrado');
    return '';
  }

  // Obter device number com dados do Firebase como fallback
  static getDeviceWithFirebaseData(clientData) {
    // Primeiro tentar localStorage
    const localDevice = this.getDevice();
    if (localDevice) {
      return localDevice;
    }

    // Fallback para dados do Firebase
    if (clientData?.deviceNumber && this.isValidDevice(clientData.deviceNumber)) {
      console.log('📱 Device number obtido do Firebase deviceNumber:', clientData.deviceNumber);
      // Salvar no localStorage para próximas vezes
      this.saveDevice(clientData.deviceNumber, 'firebase_deviceNumber');
      return clientData.deviceNumber;
    }

    if (clientData?.deviceNumberConfirmed && this.isValidDevice(clientData.deviceNumberConfirmed)) {
      console.log('📱 Device number obtido do Firebase deviceNumberConfirmed:', clientData.deviceNumberConfirmed);
      this.saveDevice(clientData.deviceNumberConfirmed, 'firebase_deviceNumberConfirmed');
      return clientData.deviceNumberConfirmed;
    }

    console.warn('📱 Nenhum device number encontrado no localStorage nem no Firebase');
    return '';
  }

  // Limpar todos os device numbers armazenados
  static clearAllDevices() {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Limpar chaves antigas também
      localStorage.removeItem('device_number');
      localStorage.removeItem('lastDevice');
      
      console.log('📱 Todos os device numbers foram limpos');
      return true;
    } catch (error) {
      console.error('📱 Erro ao limpar device numbers:', error);
      return false;
    }
  }

  // Debug: mostrar todos os device numbers armazenados
  static debugDeviceStorage() {
    const devices = {};
    
    Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
      devices[name] = localStorage.getItem(key);
    });
    
    // Incluir chaves antigas também
    devices.OLD_device_number = localStorage.getItem('device_number');
    devices.OLD_lastDevice = localStorage.getItem('lastDevice');
    
    console.log('📱 DEBUG - Device numbers no localStorage:', devices);
    return devices;
  }
}

export default DeviceManager;
export { DeviceManager };