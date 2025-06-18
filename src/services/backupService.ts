
export interface BackupData {
  version: string;
  timestamp: string;
  settings: any;
  orders: any[];
  menu: any[];
  tables: any[];
  rooms: any[];
  metadata: {
    deviceId: string;
    restaurantName: string;
  };
}

class BackupService {
  private version = '1.0.0';

  async createBackup(): Promise<BackupData> {
    const backup: BackupData = {
      version: this.version,
      timestamp: new Date().toISOString(),
      settings: JSON.parse(localStorage.getItem('lokal_settings') || '{}'),
      orders: JSON.parse(localStorage.getItem('lokal_orders') || '[]'),
      menu: JSON.parse(localStorage.getItem('lokal_menu') || '[]'),
      tables: JSON.parse(localStorage.getItem('lokal_tables') || '[]'),
      rooms: JSON.parse(localStorage.getItem('lokal_rooms') || '[]'),
      metadata: {
        deviceId: localStorage.getItem('lokal_device_id') || '',
        restaurantName: localStorage.getItem('lokal_restaurant_name') || 'LokalRestro'
      }
    };

    return backup;
  }

  async downloadBackup(): Promise<void> {
    const backup = await this.createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `lokalrestro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  async restoreBackup(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const backup: BackupData = JSON.parse(e.target?.result as string);
          
          // Validate backup structure
          if (!backup.version || !backup.timestamp) {
            throw new Error('Invalid backup file format');
          }

          // Store confirmation in sessionStorage for user to confirm
          sessionStorage.setItem('lokal_pending_restore', JSON.stringify(backup));
          resolve();
        } catch (error) {
          reject(new Error('Failed to parse backup file: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      reader.readAsText(file);
    });
  }

  async confirmRestore(): Promise<void> {
    const pendingRestore = sessionStorage.getItem('lokal_pending_restore');
    if (!pendingRestore) {
      throw new Error('No pending restore found');
    }

    const backup: BackupData = JSON.parse(pendingRestore);
    
    // Create current backup before restore
    const currentBackup = await this.createBackup();
    localStorage.setItem('lokal_pre_restore_backup', JSON.stringify(currentBackup));

    // Restore data
    localStorage.setItem('lokal_settings', JSON.stringify(backup.settings));
    localStorage.setItem('lokal_orders', JSON.stringify(backup.orders));
    localStorage.setItem('lokal_menu', JSON.stringify(backup.menu));
    localStorage.setItem('lokal_tables', JSON.stringify(backup.tables));
    localStorage.setItem('lokal_rooms', JSON.stringify(backup.rooms));

    // Clear pending restore
    sessionStorage.removeItem('lokal_pending_restore');
  }

  getPendingRestore(): BackupData | null {
    const pending = sessionStorage.getItem('lokal_pending_restore');
    return pending ? JSON.parse(pending) : null;
  }

  cancelRestore(): void {
    sessionStorage.removeItem('lokal_pending_restore');
  }

  async getBackupPreview(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const backup: BackupData = JSON.parse(e.target?.result as string);
          resolve(backup);
        } catch (error) {
          reject(new Error('Invalid backup file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export const backupService = new BackupService();
